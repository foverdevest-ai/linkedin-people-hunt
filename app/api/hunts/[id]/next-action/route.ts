import { NextResponse } from "next/server";
import { requireActorOrExtensionUser } from "@/lib/auth/actor-or-extension";
import { getNextAutopilotAction } from "@/lib/hunts/autopilot";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActorOrExtensionUser(request);
    const { id } = await params;
    const result = await getNextAutopilotAction({ runId: id, actorUserId: actor.id });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 400 });
  }
}
