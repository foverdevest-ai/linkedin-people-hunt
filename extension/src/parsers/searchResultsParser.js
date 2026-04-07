function text(node, selector) {
  const item = node.querySelector(selector);
  return item ? item.textContent.trim() : "";
}

function href(node, selector) {
  const item = node.querySelector(selector);
  return item ? item.href : "";
}

export function parseSearchResultsCards(doc = document) {
  const cards = Array.from(doc.querySelectorAll("li.reusable-search__result-container, li .entity-result"));
  return cards
    .map((card) => ({
      profileUrl: href(card, "a[href*='/in/']"),
      fullName: text(card, "span[aria-hidden='true']"),
      headline: text(card, ".entity-result__primary-subtitle"),
      jobTitle: text(card, ".entity-result__summary"),
      companyName: text(card, ".entity-result__secondary-subtitle"),
      location: text(card, ".entity-result__secondary-subtitle+div"),
      messageable: Boolean(card.querySelector("button[aria-label*='Message']")),
      searchUrl: (doc.location && doc.location.href) || ""
    }))
    .filter((row) => row.profileUrl);
}
