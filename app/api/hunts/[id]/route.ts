import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireActorUser } from "@/lib/auth/current-user";
import { env } from "@/lib/env";
import { getAutopilotState, getRunCounts } from "@/lib/hunts/autopilot";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActorUser();
    const { id } = await params;
    const run = await prisma.huntRun.findFirst({
      where: { id, userId: actor.id },
      include: { prospects: true, logs: { orderBy: { createdAt: "desc" }, take: 200 } }
    });
    if (!run) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const connection = await prisma.linkedInConnection.findUnique({
      where: { userId_providerType: { userId: actor.id, providerType: "browser_extension" } }
    });
    const autopilot = getAutopilotState(run.statsJson);
    const counts = getRunCounts(run.prospects);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sentToday = await prisma.huntProspect.count({
      where: {
        userId: actor.id,
        lastMessageAt: { gte: startOfDay }
      }
    });

    return NextResponse.json({
      ...run,
      template: {
        id: autopilot.messageTemplateId,
        name: autopilot.messageTemplateName,
        body: autopilot.messageBody
      },
      connection: {
        status: connection?.status || "disconnected",
        lastSeenAt: connection?.lastSeenAt?.toISOString() || null,
        lastSyncAt: connection?.lastSyncAt?.toISOString() || null
      },
      progress: {
        currentPage: autopilot.currentPage,
        maxPages: run.maxPages,
        blockingReason: autopilot.blockingReason,
        lastAction: autopilot.lastAction,
        lastError: autopilot.lastError,
        dailyCap: env.DEFAULT_DAILY_SEND_CAP,
        sentToday,
        counts
      }
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
