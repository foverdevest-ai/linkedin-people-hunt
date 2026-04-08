const DEFAULT_API_BASE = "https://people-hunt.personeel.com";
const AUTOPILOT_ALARM = "linkedin-people-hunt-autopilot";
let autopilotRunning = false;

async function getApiBase() {
  const { appApiBase } = await chrome.storage.local.get(["appApiBase"]);
  return appApiBase || DEFAULT_API_BASE;
}

async function getSessionToken() {
  const { sessionToken } = await chrome.storage.local.get(["sessionToken"]);
  return sessionToken || "";
}

function authHeaders(sessionToken) {
  return {
    "content-type": "application/json",
    authorization: `Bearer ${sessionToken}`
  };
}

async function apiRequest(path, sessionToken, init = {}) {
  const appApiBase = await getApiBase();
  const response = await fetch(`${appApiBase}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      authorization: `Bearer ${sessionToken}`
    }
  });
  const body = await response.json().catch(() => ({}));
  return { response, body, appApiBase };
}

function ensureAlarm() {
  chrome.alarms.create(AUTOPILOT_ALARM, { periodInMinutes: 1 });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForTabComplete(tabId) {
  const tab = await chrome.tabs.get(tabId);
  if (tab.status === "complete") return;

  await new Promise((resolve) => {
    const listener = (updatedTabId, info) => {
      if (updatedTabId === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function ensureLinkedInTab(targetUrl) {
  const existingTabs = await chrome.tabs.query({ url: "https://www.linkedin.com/*" });
  const tab = existingTabs[0]
    ? await chrome.tabs.update(existingTabs[0].id, { url: targetUrl, active: false })
    : await chrome.tabs.create({ url: targetUrl, active: false });

  await waitForTabComplete(tab.id);
  await delay(2500);
  return tab.id;
}

async function sendToTab(tabId, message, retries = 5) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      if (attempt === retries - 1) throw error;
      await delay(1000);
    }
  }
  return null;
}

function isRunnableRun(run) {
  return run.autopilot && !["completed", "failed", "paused"].includes(run.status);
}

async function processRun(runId, sessionToken) {
  for (let step = 0; step < 20; step += 1) {
    const next = await apiRequest(`/api/hunts/${runId}/next-action`, sessionToken);
    if (!next.response.ok || !next.body?.action) return;

    const action = next.body.action;
    if (action.type === "stop" || action.type === "complete" || action.type === "pause") {
      return;
    }

    if (action.type === "extract_page") {
      const tabId = await ensureLinkedInTab(action.targetUrl);
      const result = await sendToTab(tabId, {
        type: "HUNT_EXTRACT_PAGE",
        payload: {
          runId,
          apiBase: next.appApiBase,
          sessionToken,
          pageNumber: action.pageNumber
        }
      });
      if (!result?.ok) return;
      continue;
    }

    if (action.type === "send_one") {
      const tabId = await ensureLinkedInTab(action.profileUrl);
      const result = await sendToTab(tabId, {
        type: "HUNT_SEND_ONE",
        payload: {
          runId,
          apiBase: next.appApiBase,
          sessionToken,
          prospectId: action.prospectId,
          message: action.message
        }
      });
      if (!result?.ok) return;
    }
  }
}

async function processAutopilot() {
  if (autopilotRunning) return;

  autopilotRunning = true;
  try {
    const sessionToken = await getSessionToken();
    if (!sessionToken) return;

    const runsResponse = await apiRequest("/api/hunts", sessionToken);
    if (!runsResponse.response.ok || !Array.isArray(runsResponse.body?.runs)) return;

    const runnableRuns = runsResponse.body.runs.filter(isRunnableRun);
    for (const run of runnableRuns) {
      await processRun(run.id, sessionToken);
    }
  } finally {
    autopilotRunning = false;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["appApiBase"]).then(({ appApiBase }) => {
    if (!appApiBase) {
      chrome.storage.local.set({ appApiBase: DEFAULT_API_BASE });
    }
  });
  ensureAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  ensureAlarm();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === AUTOPILOT_ALARM) {
    processAutopilot().catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "EXT_HELLO") {
    getApiBase().then((appApiBase) => {
      sendResponse({ ok: true, appApiBase });
    });
    return true;
  }

  if (message?.type === "EXT_RUN_AUTOPILOT") {
    processAutopilot()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "unknown_error" }));
    return true;
  }

  if (message?.type === "EXT_HEARTBEAT") {
    chrome.storage.local.get(["sessionToken"]).then(async ({ sessionToken }) => {
      if (!sessionToken) {
        sendResponse({ ok: false, error: "missing_session_token" });
        return;
      }
      const appApiBase = await getApiBase();
      const response = await fetch(`${appApiBase}/api/extension/heartbeat`, {
        method: "POST",
        headers: authHeaders(sessionToken),
        body: JSON.stringify({
          lastSyncAt: new Date().toISOString(),
          metadata: { source: "extension_background" }
        })
      });
      if (response.ok) {
        processAutopilot().catch(() => {});
      }
      sendResponse({ ok: response.ok });
    });
    return true;
  }
});
