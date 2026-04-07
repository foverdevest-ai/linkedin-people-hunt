import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActorOrExtensionUser } from "@/lib/auth/actor-or-extension";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit/write";

const schema = z.object({
  lastSyncAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional()
});

export async function POST(request: Request) {
  try {
    const actor = await requireActorOrExtensionUser(request);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
    }

    await prisma.linkedInConnection.upsert({
      where: { userId_providerType: { userId: actor.id, providerType: "browser_extension" } },
      create: {
        userId: actor.id,
        providerType: "browser_extension",
        status: "connected",
        lastSeenAt: new Date(),
        lastSyncAt: parsed.data.lastSyncAt ? new Date(parsed.data.lastSyncAt) : null,
        metadataJson: (parsed.data.metadata as object | undefined) ?? undefined
      },
      update: {
        status: "connected",
        lastSeenAt: new Date(),
        lastSyncAt: parsed.data.lastSyncAt ? new Date(parsed.data.lastSyncAt) : undefined,
        metadataJson: (parsed.data.metadata as object | undefined) ?? undefined
      }
    });
    await writeAuditLog({
      actorUserId: actor.id,
      entityType: "linkedin_connection",
      entityId: actor.id,
      action: "linkedin_heartbeat",
      metadataJson: parsed.data
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
