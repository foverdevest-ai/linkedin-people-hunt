import { HuntRunStatus, ProspectMessagingStatus } from "@prisma/client";

const runTransitions: Record<HuntRunStatus, HuntRunStatus[]> = {
  draft: ["queued", "failed"],
  queued: ["importing", "paused", "failed"],
  importing: ["imported", "failed", "paused"],
  imported: ["scoring", "failed", "paused"],
  scoring: ["ready", "failed", "paused"],
  ready: ["sending", "paused", "completed", "failed"],
  sending: ["completed", "paused", "failed"],
  completed: [],
  failed: [],
  paused: ["queued", "importing", "scoring", "sending", "failed"]
};

const prospectTransitions: Record<ProspectMessagingStatus, ProspectMessagingStatus[]> = {
  imported: ["skipped_duplicate", "skipped_existing_salesforce", "skipped_not_messageable", "queued"],
  skipped_duplicate: [],
  skipped_existing_salesforce: [],
  skipped_not_messageable: [],
  queued: ["sending", "failed"],
  sending: ["sent", "failed"],
  sent: ["replied"],
  failed: ["queued"],
  replied: ["pushed_to_salesforce"],
  pushed_to_salesforce: []
};

export function canTransitionRunStatus(from: HuntRunStatus, to: HuntRunStatus) {
  return runTransitions[from].includes(to);
}

export function canTransitionProspectStatus(from: ProspectMessagingStatus, to: ProspectMessagingStatus) {
  return prospectTransitions[from].includes(to);
}
