import { describe, expect, it } from "vitest";
import { normalizeLinkedInProfileUrl } from "@/lib/linkedin/normalize";

describe("normalizeLinkedInProfileUrl", () => {
  it("normalizes host/protocol and strips query/hash/trailing slash", () => {
    const actual = normalizeLinkedInProfileUrl(
      "http://linkedin.com/in/jane-doe/?trk=foo#about"
    );
    expect(actual).toBe("https://www.linkedin.com/in/jane-doe");
  });
});
