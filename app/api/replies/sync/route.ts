import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireActorOrExtensionUser } from "@/lib/auth/actor-or-extension";
import { writeAuditLog } from "@/lib/audit/write";

const replySchema = z.object({
  prospectId: z.string().min(1),
  threadUrl: z.string().optional(),
  replySnippet: z.string().optional(),
  repliedAt: z.string().datetime().optional(),
  raw: z.record(z.any()).optional()
});

const payloadSchema = z.object({
  replies: z.array(replySchema)
});

export async function POST(request: Request) {
  try {
    const actor = await requireActorOrExtensionUser(request);
    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
    }

    for (const event of parsed.data.replies) {
      const prospect = await prisma.huntProspect.findFirst({
        where: { id: event.prospectId, userId: actor.id }
      });
      if (!prospect) continue;

      const repliedAt = event.repliedAt ? new Date(event.repliedAt) : new Date();
      await prisma.replyEvent.create({
        data: {
          prospectId: prospect.id,
          threadUrl: event.threadUrl,
          replySnippet: event.replySnippet,
          repliedAt,
          rawJson: event.raw
        }
      });
      await prisma.huntProspect.update({
        where: { id: prospect.id },
        data: {
          messagingStatus: "replied",
          repliedAt,
          replySnippet: event.replySnippet || prospect.replySnippet,
          threadUrl: event.threadUrl || prospect.threadUrl
        }
      });
    }

    await writeAuditLog({
      actorUserId: actor.id,
      entityType: "reply_sync",
      action: "reply_synced",
      metadataJson: { count: parsed.data.replies.length }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to sync replies" }, { status: 500 });
  }
}
