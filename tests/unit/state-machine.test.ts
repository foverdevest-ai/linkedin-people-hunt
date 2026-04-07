import { describe, expect, it } from "vitest";
import { canTransitionProspectStatus, canTransitionRunStatus } from "@/lib/queue/status";

describe("state transitions", () => {
  it("allows expected run transitions", () => {
    expect(canTransitionRunStatus("draft", "queued")).toBe(true);
    expect(canTransitionRunStatus("completed", "queued")).toBe(false);
  });

  it("allows expected prospect transitions", () => {
    expect(canTransitionProspectStatus("queued", "sending")).toBe(true);
    expect(canTransitionProspectStatus("sent", "pushed_to_salesforce")).toBe(false);
    expect(canTransitionProspectStatus("replied", "pushed_to_salesforce")).toBe(true);
  });
});
