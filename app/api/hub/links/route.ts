import { NextResponse } from "next/server";
import { getHubLinks } from "@/lib/hub/links";

export async function GET() {
  return NextResponse.json({ links: getHubLinks() });
}
