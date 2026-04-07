import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireActorUser } from "@/lib/auth/current-user";

export async function GET() {
  try {
    const actor = await requireActorUser();
    const replies = await prisma.huntProspect.findMany({
      where: { userId: actor.id, messagingStatus: "replied" },
      orderBy: { repliedAt: "desc" }
    });
    return NextResponse.json({ replies });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
