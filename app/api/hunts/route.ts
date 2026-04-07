import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireActorUser } from "@/lib/auth/current-user";
import { env } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit/write";

const createHuntSchema = z.object({
  name: z.string().trim().max(120).optional(),
  inputUrl: z.string().url(),
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

    const run = await prisma.huntRun.create({
      data: {
        userId: actor.id,
        name: parsed.data.name,
        inputUrl: parsed.data.inputUrl,
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
      metadataJson: { inputUrl: run.inputUrl, autopilot: run.autopilot, maxPages: run.maxPages }
    });
    return NextResponse.json({ id: run.id });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create hunt" }, { status: 500 });
  }
}
