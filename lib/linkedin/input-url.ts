export type LinkedInInputUrlType = "people_search" | "profile" | "unsupported";

export type LinkedInInputUrlClassification = {
  type: LinkedInInputUrlType;
  normalizedUrl: string;
  reason?: string;
};

function normalizeCommon(url: URL) {
  url.protocol = "https:";
  url.hostname = "www.linkedin.com";
  url.hash = "";
}

export function classifyLinkedInInputUrl(input: string): LinkedInInputUrlClassification {
  const trimmed = input.trim();
  if (!trimmed) {
    return { type: "unsupported", normalizedUrl: trimmed, reason: "empty" };
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "linkedin.com") {
      return { type: "unsupported", normalizedUrl: trimmed, reason: "not_linkedin_host" };
    }

    normalizeCommon(url);
    const path = url.pathname.replace(/\/+$/, "").toLowerCase();

    if (path.startsWith("/in/")) {
      const profilePath = path.replace(/\/+$/, "");
      return { type: "profile", normalizedUrl: `https://www.linkedin.com${profilePath}` };
    }

    if (path === "/search/results/people" || path.startsWith("/search/results/people/")) {
      return { type: "people_search", normalizedUrl: url.toString() };
    }

    return { type: "unsupported", normalizedUrl: url.toString(), reason: "unsupported_linkedin_path" };
  } catch {
    return { type: "unsupported", normalizedUrl: trimmed, reason: "invalid_url" };
  }
}

export function isLinkedInProfileUrl(input: string): boolean {
  return classifyLinkedInInputUrl(input).type === "profile";
}
