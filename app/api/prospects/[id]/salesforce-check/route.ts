import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireActorUser } from "@/lib/auth/current-user";
import { checkSalesforceDuplicate } from "@/lib/salesforce/duplicate-check";
import { writeAuditLog } from "@/lib/audit/write";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActorUser();
    const { id } = await params;
    const prospect = await prisma.huntProspect.findFirst({ where: { id, userId: actor.id } });
    if (!prospect) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const result = await checkSalesforceDuplicate(prospect);
    await prisma.huntProspect.update({
      where: { id: prospect.id },
      data: {
        salesforceStatus:
          result.status === "matched" ? "matched" : result.status === "not_found" ? "not_found" : "error",
        salesforceMatchId: result.matchId
      }
    });
    await writeAuditLog({
      actorUserId: actor.id,
      entityType: "prospect",
      entityId: prospect.id,
      action: "salesforce_checked",
      metadataJson: result
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
