const DEFAULT_API_BASE = "https://people-hunt.personeel.com";

async function getApiBase() {
  const { appApiBase } = await chrome.storage.local.get(["appApiBase"]);
  return appApiBase || DEFAULT_API_BASE;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["appApiBase"]).then(({ appApiBase }) => {
    if (!appApiBase) {
      chrome.storage.local.set({ appApiBase: DEFAULT_API_BASE });
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "EXT_HELLO") {
    getApiBase().then((appApiBase) => {
      sendResponse({ ok: true, appApiBase });
    });
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
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          lastSyncAt: new Date().toISOString(),
          metadata: { source: "extension_background" }
        })
      });
      sendResponse({ ok: response.ok });
    });
    return true;
  }
});
