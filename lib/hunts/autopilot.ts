import type { HuntProspect, HuntRunStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { classifyLinkedInInputUrl } from "@/lib/linkedin/input-url";
import { transitionRunStatus } from "@/lib/queue/runs";

type JsonObject = Record<string, unknown>;

export type HuntAutopilotState = {
  messageTemplateId: string | null;
  messageTemplateName: string | null;
  messageBody: string | null;
  currentPage: number;
  blockingReason: string | null;
  lastAction: string | null;
  lastError: string | null;
};

export type HuntCounts = {
  total: number;
  queued: number;
  sent: number;
  replied: number;
  failed: number;
  skipped: number;
};

export type NextAutopilotAction =
  | { type: "stop"; reason: string }
  | { type: "extract_page"; pageNumber: number; targetUrl: string }
  | { type: "send_one"; prospectId: string; profileUrl: string; message: string }
  | { type: "complete"; reason: string }
  | { type: "pause"; reason: string };

type DecisionInput = {
  autopilot: boolean;
  runStatus: HuntRunStatus;
  inputType: "people_search" | "profile" | "unsupported";
  currentPage: number;
  maxPages: number;
  connected: boolean;
  hasMessageBody: boolean;
  queuedCount: number;
  totalProspects: number;
  sentToday: number;
  dailyCap: number;
};

export function getAutopilotState(statsJson: Prisma.JsonValue | null | undefined): HuntAutopilotState {
  const root = isJsonObject(statsJson) ? statsJson : {};
  const autopilot = isJsonObject(root.autopilot) ? root.autopilot : {};

  return {
    messageTemplateId: asNullableString(autopilot.messageTemplateId),
    messageTemplateName: asNullableString(autopilot.messageTemplateName),
    messageBody: asNullableString(autopilot.messageBody),
    currentPage: asNumber(autopilot.currentPage),
    blockingReason: asNullableString(autopilot.blockingReason),
    lastAction: asNullableString(autopilot.lastAction),
    lastError: asNullableString(autopilot.lastError)
  };
}

export function mergeAutopilotState(
  statsJson: Prisma.JsonValue | null | undefined,
  patch: Partial<HuntAutopilotState>
): Prisma.InputJsonValue {
  const root = isJsonObject(statsJson) ? { ...statsJson } : {};
  const current = getAutopilotState(statsJson);
  root.autopilot = {
    messageTemplateId: "messageTemplateId" in patch ? patch.messageTemplateId ?? null : current.messageTemplateId,
    messageTemplateName: "messageTemplateName" in patch ? patch.messageTemplateName ?? null : current.messageTemplateName,
    messageBody: "messageBody" in patch ? patch.messageBody ?? null : current.messageBody,
    currentPage: "currentPage" in patch ? patch.currentPage ?? 0 : current.currentPage,
    blockingReason: "blockingReason" in patch ? patch.blockingReason ?? null : current.blockingReason,
    lastAction: "lastAction" in patch ? patch.lastAction ?? null : current.lastAction,
    lastError: "lastError" in patch ? patch.lastError ?? null : current.lastError
  };
  return root as Prisma.InputJsonValue;
}

export function buildPeopleSearchPageUrl(inputUrl: string, pageNumber: number) {
  const url = new URL(inputUrl);
  if (pageNumber <= 1) {
    url.searchParams.delete("page");
  } else {
    url.searchParams.set("page", String(pageNumber));
  }
  return url.toString();
}

export function getRunCounts(prospects: Pick<HuntProspect, "messagingStatus">[]): HuntCounts {
  return prospects.reduce<HuntCounts>(
    (acc, prospect) => {
      acc.total += 1;
      if (prospect.messagingStatus === "queued") acc.queued += 1;
      if (prospect.messagingStatus === "sent") acc.sent += 1;
      if (prospect.messagingStatus === "replied" || prospect.messagingStatus === "pushed_to_salesforce") acc.replied += 1;
      if (prospect.messagingStatus === "failed") acc.failed += 1;
      if (
        prospect.messagingStatus === "skipped_duplicate" ||
        prospect.messagingStatus === "skipped_existing_salesforce" ||
        prospect.messagingStatus === "skipped_not_messageable"
      ) {
        acc.skipped += 1;
      }
      return acc;
    },
    { total: 0, queued: 0, sent: 0, replied: 0, failed: 0, skipped: 0 }
  );
}

export function decideNextAutopilotAction(input: DecisionInput): NextAutopilotAction {
  if (!input.autopilot) return { type: "stop", reason: "autopilot_disabled" };
  if (!input.connected) return { type: "stop", reason: "linkedin_not_connected" };
  if (!input.hasMessageBody) return { type: "stop", reason: "message_template_required" };
  if (input.runStatus === "paused") return { type: "stop", reason: "run_paused" };
  if (input.runStatus === "failed") return { type: "stop", reason: "run_failed" };
  if (input.runStatus === "completed") return { type: "stop", reason: "run_completed" };
  if (input.sentToday >= input.dailyCap) return { type: "pause", reason: "daily_cap_reached" };

  const importFinished = input.inputType !== "people_search" || input.currentPage >= input.maxPages;

  if (!importFinished) {
    return {
      type: "extract_page",
      pageNumber: input.currentPage + 1,
      targetUrl: ""
    };
  }

  if (input.queuedCount > 0) {
    return { type: "send_one", prospectId: "", profileUrl: "", message: "" };
  }

  if (input.totalProspects === 0) return { type: "complete", reason: "no_people_found" };
  return { type: "complete", reason: "run_finished" };
}

export async function setRunAutopilotState(runId: string, patch: Partial<HuntAutopilotState>) {
  const run = await prisma.huntRun.findUnique({ where: { id: runId }, select: { statsJson: true } });
  if (!run) throw new Error("Run not found");

  return prisma.huntRun.update({
    where: { id: runId },
    data: {
      statsJson: mergeAutopilotState(run.statsJson, patch)
    }
  });
}

export async function finalizeImportLifecycle(runId: string, actorUserId: string) {
  let current = await prisma.huntRun.findUnique({ where: { id: runId } });
  if (!current) throw new Error("Run not found");

  const steps: HuntRunStatus[] = ["imported", "scoring", "ready"];
  for (const target of steps) {
    if (current.status === target) continue;
    if (!["queued", "importing", "imported", "scoring", "ready"].includes(current.status)) continue;
    current = await transitionRunStatus({ runId, actorUserId, to: target });
  }

  return current;
}

export async function getNextAutopilotAction(args: { runId: string; actorUserId: string }) {
  const run = await prisma.huntRun.findFirst({
    where: { id: args.runId, userId: args.actorUserId },
    include: {
      prospects: {
        orderBy: { createdAt: "asc" }
      }
    }
  });
  if (!run) throw new Error("Run not found");

  const connection = await prisma.linkedInConnection.findUnique({
    where: { userId_providerType: { userId: args.actorUserId, providerType: "browser_extension" } }
  });
  const state = getAutopilotState(run.statsJson);
  const counts = getRunCounts(run.prospects);
  const inputType = classifyLinkedInInputUrl(run.inputUrl).type;
  const sentToday = await countUserSentToday(args.actorUserId);
  const baseDecision = decideNextAutopilotAction({
    autopilot: run.autopilot,
    runStatus: run.status,
    inputType,
    currentPage: state.currentPage,
    maxPages: run.maxPages,
    connected: connection?.status === "connected",
    hasMessageBody: Boolean(state.messageBody),
    queuedCount: counts.queued,
    totalProspects: counts.total,
    sentToday,
    dailyCap: env.DEFAULT_DAILY_SEND_CAP
  });

  if (baseDecision.type === "pause") {
    if (run.status !== "paused") {
      await transitionRunStatus({ runId: run.id, actorUserId: args.actorUserId, to: "paused", metadata: { reason: baseDecision.reason } });
    }
    await setRunAutopilotState(run.id, { blockingReason: baseDecision.reason, lastAction: "pause" });
    return { action: baseDecision, counts, state: getAutopilotState(run.statsJson) };
  }

  if (baseDecision.type === "stop") {
    await setRunAutopilotState(run.id, { blockingReason: baseDecision.reason, lastAction: "stop" });
    return { action: baseDecision, counts, state };
  }

  if (baseDecision.type === "extract_page") {
    if (run.status === "draft") {
      await transitionRunStatus({ runId: run.id, actorUserId: args.actorUserId, to: "queued" });
    }
    const refreshed = await prisma.huntRun.findUnique({ where: { id: run.id } });
    if (refreshed?.status === "queued") {
      await transitionRunStatus({ runId: run.id, actorUserId: args.actorUserId, to: "importing" });
    }
    await setRunAutopilotState(run.id, { blockingReason: null, lastAction: "extract_page" });
    return {
      action: {
        ...baseDecision,
        targetUrl: buildPeopleSearchPageUrl(run.inputUrl, baseDecision.pageNumber)
      },
      counts,
      state: getAutopilotState((await prisma.huntRun.findUnique({ where: { id: run.id }, select: { statsJson: true } }))?.statsJson)
    };
  }

  if (baseDecision.type === "complete") {
    if (run.status === "queued" || run.status === "importing") {
      await finalizeImportLifecycle(run.id, args.actorUserId);
    }
    const completedRun = await prisma.huntRun.findUnique({ where: { id: run.id } });
    if (completedRun && completedRun.status !== "completed") {
      await transitionRunStatus({ runId: run.id, actorUserId: args.actorUserId, to: "completed", metadata: { reason: baseDecision.reason } });
    }
    await setRunAutopilotState(run.id, { blockingReason: baseDecision.reason, lastAction: "complete" });
    return { action: baseDecision, counts, state };
  }

  if (run.status === "queued" || run.status === "importing") {
    await finalizeImportLifecycle(run.id, args.actorUserId);
  }
  const latestRun = await prisma.huntRun.findUnique({ where: { id: run.id } });
  if (latestRun?.status === "ready") {
    await transitionRunStatus({ runId: run.id, actorUserId: args.actorUserId, to: "sending" });
  }

  const nextProspect = await prisma.huntProspect.findFirst({
    where: { huntRunId: run.id, userId: args.actorUserId, messagingStatus: "queued" },
    orderBy: { createdAt: "asc" }
  });

  if (!nextProspect || !state.messageBody) {
    return {
      action: { type: "stop", reason: !nextProspect ? "no_queued_prospects" : "message_template_required" },
      counts,
      state
    };
  }

  await setRunAutopilotState(run.id, { blockingReason: null, lastAction: "send_one" });
  return {
    action: {
      type: "send_one",
      prospectId: nextProspect.id,
      profileUrl: nextProspect.normalizedProfileUrl,
      message: state.messageBody
    },
    counts,
    state
  };
}

async function countUserSentToday(userId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return prisma.huntProspect.count({
    where: {
      userId,
      lastMessageAt: { gte: startOfDay }
    }
  });
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
