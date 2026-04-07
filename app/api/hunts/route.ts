import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireActorUser } from "@/lib/auth/current-user";
import { env } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit/write";
import { classifyLinkedInInputUrl } from "@/lib/linkedin/input-url";
import { ingestCandidatesForRun } from "@/lib/hunts/ingest";

const createHuntSchema = z.object({
  name: z.string().trim().max(120).optional(),
  inputUrl: z.string().trim().url(),
  autopilot: z.boolean().default(true),
  maxPages: z.coerce.number().int().min(1).max(50).default(env.DEFAULT_RUN_MAX_PAGES)
});

export async function GET() {
  try {
    const actor = await requireActorUser();
    const runs = await prisma.huntRun.findMany({
      where: { userId: actor.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { prospects: true } } }
    });
    return NextResponse.json({ runs });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireActorUser();
    const json = await request.json();
    const parsed = createHuntSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
    }
    const inputUrlType = classifyLinkedInInputUrl(parsed.data.inputUrl);
    if (inputUrlType.type === "unsupported") {
      return NextResponse.json(
        {
          error:
            "Unsupported LinkedIn URL. Use a people search URL (/search/results/people/...) or a profile URL (/in/...)."
        },
        { status: 400 }
      );
    }

    const run = await prisma.huntRun.create({
      data: {
        userId: actor.id,
        name: parsed.data.name,
        inputUrl: inputUrlType.normalizedUrl,
        autopilot: parsed.data.autopilot,
        maxPages: parsed.data.maxPages,
        status: "draft"
      }
    });
    await writeAuditLog({
      actorUserId: actor.id,
      entityType: "hunt_run",
      entityId: run.id,
      action: "hunt_created",
      metadataJson: { inputUrl: run.inputUrl, inputUrlType: inputUrlType.type, autopilot: run.autopilot, maxPages: run.maxPages }
    });

    if (inputUrlType.type === "profile") {
      const results = await ingestCandidatesForRun({
        actorUserId: actor.id,
        run: { id: run.id, autopilot: run.autopilot },
        candidates: [
          {
            profileUrl: inputUrlType.normalizedUrl,
            searchUrl: run.inputUrl,
            messageable: true,
            raw: { source: "manual_profile_input" }
          }
        ]
      });

      await writeAuditLog({
        actorUserId: actor.id,
        entityType: "hunt_run",
        entityId: run.id,
        action: "prospects_ingested",
        metadataJson: { count: 1, source: "profile_input", results }
      });
    }

    return NextResponse.json({ id: run.id });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create hunt" }, { status: 500 });
  }
}
