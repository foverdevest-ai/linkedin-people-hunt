import { NextResponse } from "next/server";
import { z } from "zod";
import { ProspectDuplicateStatus, ProspectMessagingStatus, ProspectSalesforceStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireActorOrExtensionUser } from "@/lib/auth/actor-or-extension";
import { normalizeLinkedInProfileUrl, splitPersonName } from "@/lib/linkedin/normalize";
import { scoreProspect } from "@/lib/scoring/model";
import { checkSalesforceDuplicate } from "@/lib/salesforce/duplicate-check";
import { writeAuditLog } from "@/lib/audit/write";

const candidateSchema = z.object({
  profileUrl: z.string().url(),
  linkedinMemberId: z.string().optional(),
  fullName: z.string().optional(),
  headline: z.string().optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  companyUrl: z.string().optional(),
  location: z.string().optional(),
  connectionDegree: z.string().optional(),
  searchUrl: z.string().optional(),
  messageable: z.boolean().default(false),
  raw: z.record(z.any()).optional()
});

const payloadSchema = z.object({
  candidates: z.array(candidateSchema).min(1)
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActorOrExtensionUser(request);
    const { id } = await params;
    const run = await prisma.huntRun.findFirst({ where: { id, userId: actor.id } });
    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
    }

    const results: Array<{ prospectId?: string; action: ProspectMessagingStatus; reason?: string }> = [];

    for (const item of parsed.data.candidates) {
      const normalizedProfileUrl = normalizeLinkedInProfileUrl(item.profileUrl);
      if (!normalizedProfileUrl) {
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
        : crossUserRecent.userId === actor.id
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
          userId: actor.id,
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

    await writeAuditLog({
      actorUserId: actor.id,
      entityType: "hunt_run",
      entityId: run.id,
      action: "prospects_ingested",
      metadataJson: { count: parsed.data.candidates.length, results }
    });

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
