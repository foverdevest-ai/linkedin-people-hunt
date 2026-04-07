import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireActorUser } from "@/lib/auth/current-user";

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
    return NextResponse.json(run);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
