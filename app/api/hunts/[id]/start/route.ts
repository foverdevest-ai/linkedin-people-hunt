import { NextResponse } from "next/server";
import { requireActorUser } from "@/lib/auth/current-user";
import { transitionRunStatus } from "@/lib/queue/runs";
import { setRunAutopilotState } from "@/lib/hunts/autopilot";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActorUser();
    const { id } = await params;
    await transitionRunStatus({ runId: id, actorUserId: actor.id, to: "queued" });
    await setRunAutopilotState(id, { blockingReason: null, lastAction: "manual_start", lastError: null });
    return NextResponse.redirect(new URL(`/hunts/${id}`, process.env.BASE_URL ?? "http://localhost:3000"));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 400 });
  }
}
