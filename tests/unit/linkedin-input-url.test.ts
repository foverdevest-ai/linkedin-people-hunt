import { describe, expect, it } from "vitest";
import { classifyLinkedInInputUrl } from "@/lib/linkedin/input-url";

describe("classifyLinkedInInputUrl", () => {
  it("accepts people search urls", () => {
    const actual = classifyLinkedInInputUrl("http://linkedin.com/search/results/people/?keywords=hr");
    expect(actual.type).toBe("people_search");
    expect(actual.normalizedUrl).toBe("https://www.linkedin.com/search/results/people/?keywords=hr");
  });

  it("accepts profile urls and strips query/hash", () => {
    const actual = classifyLinkedInInputUrl("https://linkedin.com/in/jane-doe/?trk=foo#about");
    expect(actual.type).toBe("profile");
    expect(actual.normalizedUrl).toBe("https://www.linkedin.com/in/jane-doe");
  });

  it("rejects unsupported linkedin paths", () => {
    const actual = classifyLinkedInInputUrl("https://www.linkedin.com/company/personeel");
    expect(actual.type).toBe("unsupported");
    expect(actual.reason).toBe("unsupported_linkedin_path");
  });

  it("rejects non-linkedin hosts", () => {
    const actual = classifyLinkedInInputUrl("https://example.com/in/jane-doe");
    expect(actual.type).toBe("unsupported");
    expect(actual.reason).toBe("not_linkedin_host");
  });
});
