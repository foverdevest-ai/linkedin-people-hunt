import { describe, expect, it } from "vitest";
import { buildSalesforceLeadPayload } from "@/lib/salesforce/mapping";

describe("buildSalesforceLeadPayload", () => {
  it("forces LeadSource LinkedIn and OwnerId", () => {
    const payload = buildSalesforceLeadPayload(
      {
        id: "p1",
        huntRunId: "r1",
        userId: "u1",
        normalizedProfileUrl: "https://www.linkedin.com/in/test",
        linkedinMemberId: null,
        fullName: "Jane Doe",
        firstName: "Jane",
        lastName: "Doe",
        headline: null,
        jobTitle: "Founder",
        companyName: "Acme",
        companyUrl: null,
        location: null,
        connectionDegree: null,
        searchUrl: "https://www.linkedin.com/search/results/people",
        rawJson: null,
        score: null,
        scoreReasonsJson: null,
        duplicateStatus: "none",
        salesforceStatus: "unchecked",
        salesforceMatchId: null,
        skipReason: null,
        messageableStatus: "messageable",
        messagingStatus: "replied",
        threadUrl: null,
        lastMessageAt: null,
        repliedAt: null,
        replySnippet: "Thanks, interested",
        pushedToSalesforceAt: null,
        salesforceCreatedId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "u1",
        name: "Rep",
        email: "rep@personeel.com",
        passwordHash: "x",
        role: "rep",
        salesforceOwnerId: "005xx",
        defaultMessageTemplateId: null,
        signupTrackingCode: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    );

    expect(payload.LeadSource).toBe("LinkedIn");
    expect(payload.OwnerId).toBe("005xx");
  });
});
