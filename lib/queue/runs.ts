import { HuntRunStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canTransitionRunStatus } from "@/lib/queue/status";
import { writeAuditLog } from "@/lib/audit/write";

export async function transitionRunStatus(args: {
  runId: string;
  actorUserId: string;
  to: HuntRunStatus;
  metadata?: unknown;
}) {
  const run = await prisma.huntRun.findUnique({ where: { id: args.runId } });
  if (!run) throw new Error("Run not found");
  if (!canTransitionRunStatus(run.status, args.to) && run.status !== args.to) {
    throw new Error(`Invalid transition from ${run.status} to ${args.to}`);
  }
  const updated = await prisma.huntRun.update({
    where: { id: run.id },
    data: {
      status: args.to,
      startedAt: args.to === "importing" || args.to === "sending" ? new Date() : run.startedAt,
      finishedAt: args.to === "completed" || args.to === "failed" ? new Date() : null
    }
  });
  await prisma.runLog.create({
    data: {
      huntRunId: run.id,
      level: "info",
      message: `Run status changed to ${args.to}`,
      metadata: (args.metadata ?? {}) as object
    }
  });
  await writeAuditLog({
    actorUserId: args.actorUserId,
    entityType: "hunt_run",
    entityId: run.id,
    action: "hunt_status_changed",
    metadataJson: { from: run.status, to: args.to, metadata: args.metadata ?? null }
  });
  return updated;
}
