const DEFAULT_API_BASE = "https://people-hunt.personeel.com";

const messageEl = document.getElementById("message");
const savedStatusEl = document.getElementById("savedStatus");
const tokenInputEl = document.getElementById("tokenInput");
const connectBtnEl = document.getElementById("connectBtn");
const heartbeatBtnEl = document.getElementById("heartbeatBtn");

function setMessage(text, type = "muted") {
  messageEl.textContent = text;
  messageEl.className = `status ${type}`;
}

async function getApiBase() {
  const { appApiBase } = await chrome.storage.local.get(["appApiBase"]);
  return appApiBase || DEFAULT_API_BASE;
}

function parseHandshakeInput(value) {
  const trimmed = value.trim();
  if (!trimmed) return { token: "", apiBase: "" };

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed.token === "string") {
        return {
          token: parsed.token.trim(),
          apiBase: typeof parsed.apiBase === "string" ? parsed.apiBase.trim() : ""
        };
      }
    } catch {
      // Fall through and treat as raw token.
    }
  }

  return { token: trimmed, apiBase: "" };
}

async function readHandshakeInput() {
  const manual = tokenInputEl.value.trim();
  if (manual) return parseHandshakeInput(manual);
  try {
    const clipboard = await navigator.clipboard.readText();
    return parseHandshakeInput(clipboard);
  } catch {
    return { token: "", apiBase: "" };
  }
}

async function refreshSavedStatus() {
  const { sessionToken, connectedAt } = await chrome.storage.local.get(["sessionToken", "connectedAt"]);
  if (!sessionToken) {
    savedStatusEl.textContent = "Session: not connected";
    savedStatusEl.className = "status muted";
    return;
  }
  const dateLabel = connectedAt ? new Date(connectedAt).toLocaleString() : "unknown";
  savedStatusEl.textContent = `Session: connected (${dateLabel})`;
  savedStatusEl.className = "status ok";
}

async function completeConnection() {
  connectBtnEl.disabled = true;
  setMessage("Completing handshake...", "muted");
  try {
    const handshake = await readHandshakeInput();
    const token = handshake.token;
    if (!token) {
      setMessage("No handshake token found. Start connect in app settings first.", "warn");
      return;
    }
    if (handshake.apiBase) {
      await chrome.storage.local.set({ appApiBase: handshake.apiBase });
    }

    const apiBase = await getApiBase();
    const response = await fetch(`${apiBase}/api/extension/handshake/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token,
        browserInfo: navigator.userAgent
      })
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.sessionToken) {
      setMessage(body.error || "Handshake failed.", "warn");
      return;
    }

    await chrome.storage.local.set({
      sessionToken: body.sessionToken,
      connectedAt: new Date().toISOString()
    });
    setMessage("Connected. Session token saved.", "ok");
    await refreshSavedStatus();
  } catch {
    setMessage("Handshake failed.", "warn");
  } finally {
    connectBtnEl.disabled = false;
  }
}

async function sendHeartbeat() {
  heartbeatBtnEl.disabled = true;
  try {
    const apiBase = await getApiBase();
    const { sessionToken } = await chrome.storage.local.get(["sessionToken"]);
    if (!sessionToken) {
      setMessage("No session token saved yet.", "warn");
      return;
    }

    const response = await fetch(`${apiBase}/api/extension/heartbeat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        lastSyncAt: new Date().toISOString(),
        metadata: { source: "extension_popup" }
      })
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setMessage(body.error || "Heartbeat failed.", "warn");
      return;
    }
    setMessage("Heartbeat sent.", "ok");
  } catch {
    setMessage("Heartbeat failed.", "warn");
  } finally {
    heartbeatBtnEl.disabled = false;
  }
}

connectBtnEl.addEventListener("click", () => {
  completeConnection();
});

heartbeatBtnEl.addEventListener("click", () => {
  sendHeartbeat();
});

refreshSavedStatus();
