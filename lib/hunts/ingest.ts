import { ProspectDuplicateStatus, ProspectMessagingStatus, ProspectSalesforceStatus, type HuntRun, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeLinkedInProfileUrl, splitPersonName } from "@/lib/linkedin/normalize";
import { isLinkedInProfileUrl } from "@/lib/linkedin/input-url";
import { scoreProspect } from "@/lib/scoring/model";
import { checkSalesforceDuplicate } from "@/lib/salesforce/duplicate-check";

export type IngestCandidateInput = {
  profileUrl: string;
  linkedinMemberId?: string;
  fullName?: string;
  headline?: string;
  jobTitle?: string;
  companyName?: string;
  companyUrl?: string;
  location?: string;
  connectionDegree?: string;
  searchUrl?: string;
  messageable?: boolean;
  raw?: Prisma.InputJsonValue;
};

export type IngestCandidateResult = {
  prospectId?: string;
  action: ProspectMessagingStatus;
  reason?: string;
};

type IngestCandidatesArgs = {
  actorUserId: string;
  run: Pick<HuntRun, "id" | "autopilot" | "statsJson">;
  candidates: IngestCandidateInput[];
};

export async function ingestCandidatesForRun(args: IngestCandidatesArgs): Promise<IngestCandidateResult[]> {
  const { actorUserId, run, candidates } = args;
  const results: IngestCandidateResult[] = [];

  for (const item of candidates) {
    const normalizedProfileUrl = normalizeLinkedInProfileUrl(item.profileUrl);
    if (!normalizedProfileUrl || !isLinkedInProfileUrl(normalizedProfileUrl)) {
      results.push({ action: "failed", reason: "failed_parse" });
      continue;
    }

    const existingRun = await prisma.huntProspect.findUnique({
      where: { huntRunId_normalizedProfileUrl: { huntRunId: run.id, normalizedProfileUrl } }
    });
    if (existingRun) {
      results.push({ prospectId: existingRun.id, action: "skipped_duplicate", reason: "same_run_duplicate" });
      continue;
    }

    const crossUserRecent = await prisma.huntProspect.findFirst({
      where: {
        normalizedProfileUrl,
        updatedAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) }
      },
      select: { userId: true }
    });
    const duplicateStatus: ProspectDuplicateStatus = !crossUserRecent
      ? "none"
      : crossUserRecent.userId === actorUserId
        ? "same_user_recent"
        : "cross_user_recent";

    const names = splitPersonName(item.fullName);
    const scored = scoreProspect({
      jobTitle: item.jobTitle,
      headline: item.headline,
      location: item.location,
      messageableStatus: item.messageable ? "messageable" : "not_messageable"
    });

    const created = await prisma.huntProspect.create({
      data: {
        huntRunId: run.id,
        userId: actorUserId,
        normalizedProfileUrl,
        linkedinMemberId: item.linkedinMemberId,
        fullName: item.fullName,
        firstName: names.firstName,
        lastName: names.lastName,
        headline: item.headline,
        jobTitle: item.jobTitle,
        companyName: item.companyName,
        companyUrl: item.companyUrl,
        location: item.location,
        connectionDegree: item.connectionDegree,
        searchUrl: item.searchUrl,
        rawJson: item.raw,
        score: scored.score,
        scoreReasonsJson: scored.scoreReasons,
        duplicateStatus,
        messageableStatus: item.messageable ? "messageable" : "not_messageable",
        messagingStatus: "imported"
      }
    });

    let finalStatus: ProspectMessagingStatus = run.autopilot ? "queued" : "imported";
    let skipReason: string | undefined;
    let salesforceStatus: ProspectSalesforceStatus = "unchecked";
    let salesforceMatchId: string | undefined;

    if (!item.messageable) {
      finalStatus = "skipped_not_messageable";
      skipReason = "not_messageable";
    } else {
      const dup = await checkSalesforceDuplicate(created);
      if (dup.status === "matched") {
        finalStatus = "skipped_existing_salesforce";
        salesforceStatus = "matched";
        salesforceMatchId = dup.matchId;
        skipReason = dup.reason || "existing_salesforce";
      } else if (dup.status === "error") {
        salesforceStatus = "error";
      } else {
        salesforceStatus = "not_found";
      }
    }

    await prisma.huntProspect.update({
      where: { id: created.id },
      data: {
        messagingStatus: finalStatus,
        salesforceStatus,
        salesforceMatchId,
        skipReason
      }
    });
    results.push({ prospectId: created.id, action: finalStatus, reason: skipReason });
  }

  return results;
}
