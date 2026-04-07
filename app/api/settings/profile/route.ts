import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActorUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit/write";

const schema = z.object({
  name: z.string().min(1).max(120),
  salesforceOwnerId: z.string().optional(),
  signupTrackingCode: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const actor = await requireActorUser();
    const form = await request.formData();
    const parsed = schema.safeParse({
      name: form.get("name"),
      salesforceOwnerId: form.get("salesforceOwnerId"),
      signupTrackingCode: form.get("signupTrackingCode")
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: actor.id },
      data: {
        name: parsed.data.name,
        salesforceOwnerId: parsed.data.salesforceOwnerId || null,
        signupTrackingCode: parsed.data.signupTrackingCode || null
      }
    });
    await writeAuditLog({
      actorUserId: actor.id,
      entityType: "user",
      entityId: actor.id,
      action: "user_settings_updated"
    });
    return NextResponse.redirect(new URL("/settings/profile", process.env.BASE_URL ?? "http://localhost:3000"));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
