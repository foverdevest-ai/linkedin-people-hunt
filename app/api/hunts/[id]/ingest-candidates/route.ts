import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireActorOrExtensionUser } from "@/lib/auth/actor-or-extension";
import { ingestCandidatesForRun } from "@/lib/hunts/ingest";
import { writeAuditLog } from "@/lib/audit/write";
import { getAutopilotState, mergeAutopilotState } from "@/lib/hunts/autopilot";

const candidateSchema = z.object({
  profileUrl: z.string().url(),
  linkedinMemberId: z.string().optional(),
  fullName: z.string().optional(),
  headline: z.string().optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  companyUrl: z.string().optional(),
  location: z.string().optional(),
  connectionDegree: z.string().optional(),
  searchUrl: z.string().optional(),
  messageable: z.boolean().default(false),
  raw: z.record(z.any()).optional()
});

const payloadSchema = z.object({
  pageNumber: z.coerce.number().int().min(1).optional(),
  candidates: z.array(candidateSchema).min(1)
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActorOrExtensionUser(request);
    const { id } = await params;
    const run = await prisma.huntRun.findFirst({ where: { id, userId: actor.id } });
    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
    }

    const results = await ingestCandidatesForRun({
      actorUserId: actor.id,
      run: { id: run.id, autopilot: run.autopilot, statsJson: run.statsJson },
      candidates: parsed.data.candidates
    });

    const currentState = getAutopilotState(run.statsJson);
    const nextPage = parsed.data.pageNumber ? Math.max(currentState.currentPage, parsed.data.pageNumber) : currentState.currentPage;
    await prisma.huntRun.update({
      where: { id: run.id },
      data: {
        statsJson: mergeAutopilotState(run.statsJson, {
          currentPage: nextPage,
          blockingReason: null,
          lastAction: "ingest_candidates",
          lastError: null
        })
      }
    });

    await writeAuditLog({
      actorUserId: actor.id,
      entityType: "hunt_run",
      entityId: run.id,
      action: "prospects_ingested",
      metadataJson: { count: parsed.data.candidates.length, pageNumber: parsed.data.pageNumber ?? null, results }
    });

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
