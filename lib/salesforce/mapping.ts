import { HuntProspect, User } from "@prisma/client";
import { env } from "@/lib/env";

export function buildSalesforceLeadPayload(prospect: HuntProspect, user: User) {
  const payload: Record<string, unknown> = {
    FirstName: prospect.firstName || undefined,
    LastName: prospect.lastName || prospect.fullName || "Unknown",
    Company: prospect.companyName || "Unknown Company",
    Title: prospect.jobTitle || undefined,
    City: prospect.location || undefined,
    LeadSource: "LinkedIn",
    OwnerId: user.salesforceOwnerId || undefined,
    Description: [
      "LinkedIn People Hunt",
      `HuntRunId: ${prospect.huntRunId}`,
      prospect.searchUrl ? `SearchUrl: ${prospect.searchUrl}` : "",
      prospect.normalizedProfileUrl ? `ProfileUrl: ${prospect.normalizedProfileUrl}` : "",
      prospect.replySnippet ? `ReplySnippet: ${prospect.replySnippet}` : ""
    ]
      .filter(Boolean)
      .join("\n")
  };

  if (env.SALESFORCE_FIELD_LINKEDIN_URL && prospect.normalizedProfileUrl) {
    payload[env.SALESFORCE_FIELD_LINKEDIN_URL] = prospect.normalizedProfileUrl;
  }
  if (env.SALESFORCE_FIELD_SEARCH_URL && prospect.searchUrl) {
    payload[env.SALESFORCE_FIELD_SEARCH_URL] = prospect.searchUrl;
  }
  if (env.SALESFORCE_FIELD_REPLY_SNIPPET && prospect.replySnippet) {
    payload[env.SALESFORCE_FIELD_REPLY_SNIPPET] = prospect.replySnippet;
  }

  return payload;
}
