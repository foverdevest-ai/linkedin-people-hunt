import { describe, expect, it } from "vitest";
import { createExtensionSessionToken, verifyExtensionSessionToken } from "@/lib/auth/extension-token";

describe("extension session token", () => {
  it("creates and verifies token", () => {
    const token = createExtensionSessionToken("u1", 60);
    const payload = verifyExtensionSessionToken(token);
    expect(payload?.userId).toBe("u1");
  });
});
