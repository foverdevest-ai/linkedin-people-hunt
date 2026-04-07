import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireActorUser } from "@/lib/auth/current-user";

export async function GET() {
  try {
    const actor = await requireActorUser();
    const connection = await prisma.linkedInConnection.findUnique({
      where: { userId_providerType: { userId: actor.id, providerType: "browser_extension" } }
    });

    return NextResponse.json({
      status: connection?.status || "disconnected",
      lastSeenAt: connection?.lastSeenAt?.toISOString() || null,
      lastSyncAt: connection?.lastSyncAt?.toISOString() || null
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
