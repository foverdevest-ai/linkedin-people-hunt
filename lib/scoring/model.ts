type ProspectLike = {
  jobTitle?: string | null;
  headline?: string | null;
  location?: string | null;
  messageableStatus?: "unknown" | "messageable" | "not_messageable";
};

const titleBoost = [
  "owner",
  "founder",
  "directeur",
  "managing director",
  "hr",
  "talent acquisition",
  "recruiter",
  "operations",
  "office manager",
  "hiring manager"
];

export function scoreProspect(input: ProspectLike) {
  let score = 0;
  const reasons: string[] = [];
  const text = `${input.jobTitle ?? ""} ${input.headline ?? ""}`.toLowerCase();
  const location = (input.location ?? "").toLowerCase();

  if (titleBoost.some((term) => text.includes(term))) {
    score += 35;
    reasons.push("Decision-maker or hiring-relevant title");
  }

  if (location.includes("netherlands") || location.includes("nederland") || location.includes("nl")) {
    score += 25;
    reasons.push("NL geography fit");
  } else if (location.includes("belgium") || location.includes("belgie") || location.includes("be")) {
    score += 18;
    reasons.push("BE geography fit");
  }

  if ((input.jobTitle ?? "").toLowerCase().includes("recruit")) {
    score += 20;
    reasons.push("Hiring signal in job title");
  }

  if (input.messageableStatus === "messageable") {
    score += 20;
    reasons.push("Messageable profile");
  }

  if (input.messageableStatus === "not_messageable") {
    score = 0;
    reasons.push("Not messageable");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    scoreReasons: reasons
  };
}
