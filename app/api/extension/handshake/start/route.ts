import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { requireActorUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { hashToken, signExtensionToken } from "@/lib/security";

export async function POST() {
  try {
    const actor = await requireActorUser();
    const nonce = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 5);
    const payload = `${actor.id}.${nonce}.${Math.floor(expiresAt.getTime() / 1000)}`;
    const signature = signExtensionToken(payload);
    const token = `${payload}.${signature}`;

    await prisma.extensionHandshakeToken.create({
      data: {
        userId: actor.id,
        nonce,
        tokenHash: hashToken(token),
        expiresAt
      }
    });

    await prisma.linkedInConnection.upsert({
      where: { userId_providerType: { userId: actor.id, providerType: "browser_extension" } },
      create: { userId: actor.id, providerType: "browser_extension", status: "connecting" },
      update: { status: "connecting" }
    });

    return NextResponse.json({ token, expiresAt });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
