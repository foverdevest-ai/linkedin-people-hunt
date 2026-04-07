export async function sendOneMessageToProfile(profileUrl, message) {
  const openResult = {
    status: "failed",
    threadUrl: null,
    errorMessage: ""
  };

  try {
    window.location.href = profileUrl;
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const messageButton =
      document.querySelector("button[aria-label*='Message']") ||
      document.querySelector("button[aria-label*='Bericht']");
    if (!messageButton) {
      openResult.errorMessage = "message_button_missing";
      return openResult;
    }
    messageButton.click();
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const composer = document.querySelector("div[role='textbox']");
    if (!composer) {
      openResult.errorMessage = "composer_missing";
      return openResult;
    }
    composer.focus();
    document.execCommand("insertText", false, message);
    await new Promise((resolve) => setTimeout(resolve, 200));

    const sendButton =
      document.querySelector("button.msg-form__send-button") || document.querySelector("button[aria-label*='Send']");
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
