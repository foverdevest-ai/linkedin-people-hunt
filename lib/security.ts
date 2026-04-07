import crypto from "node:crypto";
import { env } from "@/lib/env";

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function signExtensionToken(payload: string) {
  return crypto.createHmac("sha256", env.LINKEDIN_EXTENSION_SHARED_SECRET).update(payload).digest("hex");
}

export function timingSafeEqualString(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
