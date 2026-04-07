import { NextResponse } from "next/server";
import { requireActorUser } from "@/lib/auth/current-user";
import { pushRepliedProspectToSalesforce } from "@/lib/salesforce/push";
import { writeAuditLog } from "@/lib/audit/write";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActorUser();
    const { id } = await params;
    const pushed = await pushRepliedProspectToSalesforce(id, actor);
    await writeAuditLog({
      actorUserId: actor.id,
      entityType: "prospect",
      entityId: id,
      action: "salesforce_pushed",
      metadataJson: pushed
    });
    return NextResponse.redirect(new URL("/replies", process.env.BASE_URL ?? "http://localhost:3000"));
  } catch (error) {
    await writeAuditLog({
      actorUserId: undefined,
      entityType: "prospect",
      entityId: (await params).id,
      action: "salesforce_push_failed",
      metadataJson: { error: error instanceof Error ? error.message : "unknown" }
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Push failed" }, { status: 400 });
  }
}
