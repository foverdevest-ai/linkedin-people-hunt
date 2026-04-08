import { describe, expect, it } from "vitest";
import { buildPeopleSearchPageUrl, decideNextAutopilotAction, getAutopilotState, mergeAutopilotState } from "@/lib/hunts/autopilot";

describe("autopilot coordinator", () => {
  it("queues the next search page before sending any queued prospects", () => {
    const action = decideNextAutopilotAction({
      autopilot: true,
      runStatus: "importing",
      inputType: "people_search",
      currentPage: 1,
      maxPages: 5,
      connected: true,
      hasMessageBody: true,
      queuedCount: 4,
      totalProspects: 4,
      sentToday: 0,
      dailyCap: 40
    });

    expect(action.type).toBe("extract_page");
    if (action.type === "extract_page") {
      expect(action.pageNumber).toBe(2);
    }
  });

  it("pauses when the daily cap is reached", () => {
    const action = decideNextAutopilotAction({
      autopilot: true,
      runStatus: "sending",
      inputType: "people_search",
      currentPage: 5,
      maxPages: 5,
      connected: true,
      hasMessageBody: true,
      queuedCount: 3,
      totalProspects: 10,
      sentToday: 40,
      dailyCap: 40
    });

    expect(action).toEqual({ type: "pause", reason: "daily_cap_reached" });
  });

  it("moves to send once importing is finished and prospects are queued", () => {
    const action = decideNextAutopilotAction({
      autopilot: true,
      runStatus: "ready",
      inputType: "people_search",
      currentPage: 5,
      maxPages: 5,
      connected: true,
      hasMessageBody: true,
      queuedCount: 2,
      totalProspects: 7,
      sentToday: 3,
      dailyCap: 40
    });

    expect(action.type).toBe("send_one");
  });

  it("stops when linkedin is disconnected", () => {
    const action = decideNextAutopilotAction({
      autopilot: true,
      runStatus: "queued",
      inputType: "people_search",
      currentPage: 0,
      maxPages: 5,
      connected: false,
      hasMessageBody: true,
      queuedCount: 0,
      totalProspects: 0,
      sentToday: 0,
      dailyCap: 40
    });

    expect(action).toEqual({ type: "stop", reason: "linkedin_not_connected" });
  });

  it("tracks template-backed run state inside stats json", () => {
    const stats = mergeAutopilotState(null, {
      messageTemplateId: "tpl_1",
      messageTemplateName: "CEO intro",
      messageBody: "Hi there",
      currentPage: 2,
      blockingReason: null,
      lastAction: "extract_page",
      lastError: null
    });

    expect(getAutopilotState(stats)).toEqual({
      messageTemplateId: "tpl_1",
      messageTemplateName: "CEO intro",
      messageBody: "Hi there",
      currentPage: 2,
      blockingReason: null,
      lastAction: "extract_page",
      lastError: null
    });
  });

  it("builds predictable linkedin people-search page urls", () => {
    expect(buildPeopleSearchPageUrl("https://www.linkedin.com/search/results/people/?keywords=ceo", 1)).toBe(
      "https://www.linkedin.com/search/results/people/?keywords=ceo"
    );
    expect(buildPeopleSearchPageUrl("https://www.linkedin.com/search/results/people/?keywords=ceo", 3)).toBe(
      "https://www.linkedin.com/search/results/people/?keywords=ceo&page=3"
    );
  });
});
