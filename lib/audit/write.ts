import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function writeAuditLog(input: {
  actorUserId?: string;
  entityType: string;
  entityId?: string;
  action: AuditAction;
  metadataJson?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      metadataJson: input.metadataJson as object | undefined
    }
  });
}
