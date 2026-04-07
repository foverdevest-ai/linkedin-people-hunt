import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashToken, signExtensionToken, timingSafeEqualString } from "@/lib/security";
import { writeAuditLog } from "@/lib/audit/write";
import { createExtensionSessionToken } from "@/lib/auth/extension-token";

const schema = z.object({
  token: z.string().min(1),
  browserInfo: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
    }

    const [userId, nonce, exp, signature] = parsed.data.token.split(".");
    if (!userId || !nonce || !exp || !signature) {
      return NextResponse.json({ error: "Invalid token shape" }, { status: 400 });
    }

    const payload = `${userId}.${nonce}.${exp}`;
    const expected = signExtensionToken(payload);
    if (!timingSafeEqualString(signature, expected)) {
      return NextResponse.json({ error: "Invalid token signature" }, { status: 401 });
    }
    if (Number(exp) * 1000 < Date.now()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    const stored = await prisma.extensionHandshakeToken.findUnique({ where: { nonce } });
    if (!stored) return NextResponse.json({ error: "Handshake not found" }, { status: 404 });
    if (stored.usedAt) return NextResponse.json({ error: "Handshake already used" }, { status: 409 });
    if (stored.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: "Handshake expired" }, { status: 401 });
    if (!timingSafeEqualString(stored.tokenHash, hashToken(parsed.data.token))) {
      return NextResponse.json({ error: "Handshake token mismatch" }, { status: 401 });
    }

    await prisma.$transaction([
      prisma.extensionHandshakeToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() }
      }),
      prisma.linkedInConnection.upsert({
        where: { userId_providerType: { userId, providerType: "browser_extension" } },
        create: {
          userId,
          providerType: "browser_extension",
          status: "connected",
          lastSeenAt: new Date(),
          metadataJson: { browserInfo: parsed.data.browserInfo ?? null }
        },
        update: {
          status: "connected",
          lastSeenAt: new Date(),
          metadataJson: { browserInfo: parsed.data.browserInfo ?? null }
        }
      })
    ]);

    await writeAuditLog({
      actorUserId: userId,
      entityType: "linkedin_connection",
      entityId: userId,
      action: "linkedin_connected",
      metadataJson: { browserInfo: parsed.data.browserInfo ?? null }
    });

    return NextResponse.json({ ok: true, sessionToken: createExtensionSessionToken(userId) });
  } catch {
    return NextResponse.json({ error: "Failed to confirm handshake" }, { status: 500 });
  }
}
