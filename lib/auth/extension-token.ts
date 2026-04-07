import crypto from "node:crypto";
import { env } from "@/lib/env";

type ExtensionTokenPayload = {
  userId: string;
  exp: number;
};

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function createExtensionSessionToken(userId: string, ttlSeconds = 60 * 60 * 8) {
  const payload: ExtensionTokenPayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds
  };
  const serialized = JSON.stringify(payload);
  const body = toBase64Url(serialized);
  const signature = crypto
    .createHmac("sha256", env.LINKEDIN_EXTENSION_SHARED_SECRET)
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

export function verifyExtensionSessionToken(token: string): ExtensionTokenPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = crypto.createHmac("sha256", env.LINKEDIN_EXTENSION_SHARED_SECRET).update(body).digest("base64url");
  if (expected !== signature) return null;
  try {
    const payload = JSON.parse(fromBase64Url(body)) as ExtensionTokenPayload;
    if (!payload.userId || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
