export function normalizeLinkedInProfileUrl(input: string): string {
  const value = input.trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "linkedin.com") return value;
    url.hostname = "www.linkedin.com";
    url.protocol = "https:";
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return value;
  }
}

export function splitPersonName(fullName?: string | null) {
  const normalized = (fullName ?? "").trim().replace(/\s+/g, " ");
  if (!normalized) return { firstName: null, lastName: null };
  const [first, ...rest] = normalized.split(" ");
  return {
    firstName: first || null,
    lastName: rest.length > 0 ? rest.join(" ") : null
  };
}
