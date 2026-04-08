function parseSearchResultsCards(doc = document) {
  const cards = Array.from(doc.querySelectorAll("li.reusable-search__result-container, li .entity-result"));
  return cards
    .map((card) => ({
      profileUrl: (card.querySelector("a[href*='/in/']") || {}).href || "",
      fullName: ((card.querySelector("span[aria-hidden='true']") || {}).textContent || "").trim(),
      headline: ((card.querySelector(".entity-result__primary-subtitle") || {}).textContent || "").trim(),
      jobTitle: ((card.querySelector(".entity-result__summary") || {}).textContent || "").trim(),
      companyName: ((card.querySelector(".entity-result__secondary-subtitle") || {}).textContent || "").trim(),
      location: ((card.querySelector(".entity-result__secondary-subtitle+div") || {}).textContent || "").trim(),
      messageable: Boolean(card.querySelector("button[aria-label*='Message']") || card.querySelector("button[aria-label*='Bericht']")),
      searchUrl: location.href || ""
    }))
    .filter((row) => row.profileUrl);
}

function parseReplyThreads(doc = document) {
  const snippets = Array.from(doc.querySelectorAll(".msg-s-message-list__event .msg-s-event-listitem__body"));
  return snippets.slice(0, 50).map((node) => ({
    replySnippet: (node.textContent || "").trim(),
    threadUrl: window.location.href,
    repliedAt: new Date().toISOString()
  }));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendMessageOnCurrentProfile(message) {
  const openResult = {
    status: "failed",
    threadUrl: null,
    errorMessage: ""
  };

  try {
    await wait(1500);

    const messageButton =
      document.querySelector("button[aria-label*='Message']") ||
      document.querySelector("button[aria-label*='Bericht']");
    if (!messageButton) {
      openResult.errorMessage = "message_button_missing";
      return openResult;
    }
    messageButton.click();
    await wait(1200);

    const composer = document.querySelector("div[role='textbox']");
    if (!composer) {
      openResult.errorMessage = "composer_missing";
      return openResult;
    }
    composer.focus();
    document.execCommand("insertText", false, message);
    await wait(200);

    const sendButton =
      document.querySelector("button.msg-form__send-button") ||
      document.querySelector("button[aria-label*='Send']") ||
      document.querySelector("button[aria-label*='Verzenden']");
    if (!sendButton) {
      openResult.errorMessage = "send_button_missing";
      return openResult;
    }
    sendButton.click();

    openResult.status = "sent";
    openResult.threadUrl = window.location.href;
    return openResult;
  } catch (error) {
    openResult.errorMessage = error instanceof Error ? error.message : "unknown_send_error";
    return openResult;
  }
}

function jsonHeaders(token) {
  return {
    "content-type": "application/json",
    authorization: `Bearer ${token}`
  };
}

async function syncCandidates(payload) {
  const { runId, apiBase, sessionToken, pageNumber } = payload;
  const cards = parseSearchResultsCards(document);
  await fetch(`${apiBase}/api/hunts/${runId}/ingest-candidates`, {
    method: "POST",
    headers: jsonHeaders(sessionToken),
    body: JSON.stringify({ pageNumber, candidates: cards })
  });
  return { ok: true, count: cards.length };
}

async function syncReplies(payload) {
  const replies = parseReplyThreads(document);
  const body = {
    replies: replies.map((item) => ({
      ...item,
      prospectId: payload.prospectId
    }))
  };
  await fetch(`${payload.apiBase}/api/replies/sync`, {
    method: "POST",
    headers: jsonHeaders(payload.sessionToken),
    body: JSON.stringify(body)
  });
  return { ok: true, count: replies.length };
}

async function sendMessage(payload) {
  const result = await sendMessageOnCurrentProfile(payload.message);
  await fetch(`${payload.apiBase}/api/hunts/${payload.runId}/send-events`, {
    method: "POST",
    headers: jsonHeaders(payload.sessionToken),
    body: JSON.stringify({
      events: [
        {
          prospectId: payload.prospectId,
          status: result.status === "sent" ? "sent" : "failed",
          errorMessage: result.errorMessage,
          threadUrl: result.threadUrl || undefined
        }
      ]
    })
  });
  return result;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "HUNT_EXTRACT_PAGE") {
    syncCandidates(message.payload)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "unknown_error" }));
    return true;
  }
  if (message?.type === "HUNT_SEND_ONE") {
    sendMessage(message.payload)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "unknown_error" }));
    return true;
  }
  if (message?.type === "REPLY_SYNC") {
    syncReplies(message.payload)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "unknown_error" }));
    return true;
  }
});
