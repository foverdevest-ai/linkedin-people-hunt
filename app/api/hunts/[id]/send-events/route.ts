import { NextResponse } from "next/server";
import { z } from "zod";
import { ProspectMessagingStatus, SendAttemptStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireActorOrExtensionUser } from "@/lib/auth/actor-or-extension";
import { canTransitionProspectStatus } from "@/lib/queue/status";
import { writeAuditLog } from "@/lib/audit/write";

const sendEventSchema = z.object({
  prospectId: z.string().min(1),
  status: z.enum(["sending", "sent", "failed", "skipped_not_messageable"]),
  errorMessage: z.string().optional(),
  threadUrl: z.string().optional()
});

const payloadSchema = z.object({
  events: z.array(sendEventSchema)
});

function mapAttemptStatus(status: z.infer<typeof sendEventSchema>["status"]): SendAttemptStatus {
  if (status === "sending") return "sending";
  if (status === "sent") return "sent";
  if (status === "failed") return "failed";
  return "skipped";
}

function mapProspectStatus(status: z.infer<typeof sendEventSchema>["status"]): ProspectMessagingStatus {
  if (status === "sending") return "sending";
  if (status === "sent") return "sent";
  if (status === "failed") return "failed";
  return "skipped_not_messageable";
}

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

    for (const event of parsed.data.events) {
      const prospect = await prisma.huntProspect.findFirst({
        where: { id: event.prospectId, huntRunId: run.id, userId: actor.id }
      });
      if (!prospect) continue;

      const nextStatus = mapProspectStatus(event.status);
      if (!canTransitionProspectStatus(prospect.messagingStatus, nextStatus) && prospect.messagingStatus !== nextStatus) {
        continue;
      }

      await prisma.sendAttempt.create({
        data: {
          prospectId: prospect.id,
          userId: actor.id,
          status: mapAttemptStatus(event.status),
          errorMessage: event.errorMessage,
          startedAt: new Date(),
          finishedAt: event.status === "sending" ? null : new Date(),
          metadataJson: { threadUrl: event.threadUrl ?? null }
        }
      });

      await prisma.huntProspect.update({
        where: { id: prospect.id },
        data: {
          messagingStatus: nextStatus,
          threadUrl: event.threadUrl ?? prospect.threadUrl,
          lastMessageAt: event.status === "sent" ? new Date() : prospect.lastMessageAt,
          skipReason: event.status === "skipped_not_messageable" ? "not_messageable" : prospect.skipReason
        }
      });
    }

    await writeAuditLog({
      actorUserId: actor.id,
      entityType: "hunt_run",
      entityId: run.id,
      action: "send_attempt_logged",
      metadataJson: { count: parsed.data.events.length }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
