export function detectMessageability(cardEl) {
  if (!cardEl) return { messageable: false, reason: "card_missing" };
  const button = cardEl.querySelector("button[aria-label*='Message'],button[aria-label*='Bericht']");
  if (!button) return { messageable: false, reason: "message_button_missing" };
  return { messageable: true };
}
