import type { BusinessOpportunityCandidate } from "@/lib/opportunities/types";

const PROHIBITED_UNSOURCED_CLAIMS = [
  /\bbest\b/i,
  /\bguaranteed\b/i,
  /\bpre[- ]?approved\b/i,
  /\beligible\b/i,
  /\bzoned for\b/i,
  /\bwithin (?:your|the) budget\b/i,
  /\bjust became vacant\b/i,
  /\bverified (?:business|provider|listing|funds|lender)\b/i
] as const;

function validHttps(value: string): boolean {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

export function opportunityCandidateSafetyErrors(candidate: BusinessOpportunityCandidate): readonly string[] {
  const errors: string[] = [];
  if (!candidate.id.trim()) errors.push("Candidate id is required.");
  if (!candidate.name.trim()) errors.push("Candidate name is required.");
  if (!validHttps(candidate.sourceUrl)) errors.push("Source URL must be HTTPS.");
  if (!validHttps(candidate.action.href)) errors.push("Action URL must be HTTPS.");
  if (Number.isNaN(Date.parse(candidate.observedAt))) errors.push("Observed time must be a valid timestamp.");
  if (candidate.whyItAppeared.length === 0) errors.push("Candidate must explain why it appeared.");
  if (candidate.unknowns.length === 0) errors.push("Candidate must expose at least one unresolved question.");
  if (candidate.sponsorship.affectedOrdering !== false) errors.push("Sponsorship cannot affect ordering in v1.");
  if (candidate.action.sendsMemberData !== false) errors.push("Outbound action cannot transmit member data in v1.");
  if (candidate.action.createsCommitment !== false) errors.push("Outbound action cannot create a commitment in v1.");

  const werklesClaims = candidate.whyItAppeared.join(" ");
  for (const claim of PROHIBITED_UNSOURCED_CLAIMS) {
    if (claim.test(werklesClaims)) errors.push(`Unsupported promotional or eligibility claim: ${claim.source}`);
  }
  return Object.freeze(errors);
}

export function isSafeOpportunityCandidate(candidate: BusinessOpportunityCandidate): boolean {
  return opportunityCandidateSafetyErrors(candidate).length === 0;
}

