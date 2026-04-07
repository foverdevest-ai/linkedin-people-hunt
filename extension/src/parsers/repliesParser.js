export function parseReplyThreads(doc = document) {
  const snippets = Array.from(doc.querySelectorAll(".msg-s-message-list__event .msg-s-event-listitem__body"));
  return snippets.slice(0, 50).map((node) => ({
    replySnippet: (node.textContent || "").trim(),
    threadUrl: window.location.href,
    repliedAt: new Date().toISOString()
  }));
}
