import { describe, expect, it } from "vitest";
import { scoreProspect } from "@/lib/scoring/model";

describe("scoreProspect", () => {
  it("gives strong score for title + NL + messageable", () => {
    const result = scoreProspect({
      jobTitle: "HR Manager",
      location: "Amsterdam, Netherlands",
      messageableStatus: "messageable"
    });
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.scoreReasons.length).toBeGreaterThan(1);
  });

  it("hard-gates not messageable", () => {
    const result = scoreProspect({
      jobTitle: "Founder",
      location: "NL",
      messageableStatus: "not_messageable"
    });
    expect(result.score).toBe(0);
  });
});
