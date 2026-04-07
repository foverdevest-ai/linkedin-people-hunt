import { NextResponse } from "next/server";
import { requireActorUser } from "@/lib/auth/current-user";
import { salesforceConfigured } from "@/lib/salesforce/client";

export async function GET() {
  try {
    await requireActorUser();
    return NextResponse.json({
      configured: salesforceConfigured()
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
