const API_BASE = "http://localhost:3000";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ appApiBase: API_BASE });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "EXT_HELLO") {
    sendResponse({ ok: true, appApiBase: API_BASE });
    return true;
  }

  if (message?.type === "EXT_HEARTBEAT") {
    chrome.storage.local.get(["sessionToken"]).then(async ({ sessionToken }) => {
      if (!sessionToken) {
        sendResponse({ ok: false, error: "missing_session_token" });
        return;
      }
      const response = await fetch(`${API_BASE}/api/extension/heartbeat`, {
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
