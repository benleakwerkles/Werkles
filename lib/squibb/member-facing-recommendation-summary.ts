import type { SquibbRecommendation } from "./recommendations";

export type MemberFacingRecommendationSummary = Readonly<{
  why: string;
  caution: string;
  nextAction: string;
}>;

export type MemberFacingIntakeFact = Readonly<{
  label: string;
  text: string;
}>;

const WHY_FALLBACK =
  "This option is worth comparing with the evidence and limits shown below.";
const CAUTION_FALLBACK =
  "This is a starting option to compare, not a promise that it will work.";
const NEXT_ACTION_FALLBACK =
  "Review the evidence below and compare this option before deciding.";

const RAW_INTERNAL_LANGUAGE = [/\b[a-z0-9]+_[a-z0-9_]+\b/i] as const;

const INTERNAL_LANGUAGE = [
  /\bsupport\s+band\b/i,
  /\ba person checks this first\b/i,
  /\b(?:human|operator|policy|verification|release)\s+gates?\b/i,
  /\bgate\s+\d+\b/i,
  /\bprovider\b/i,
  /\brouting\b/i,
  /\baccount custody\b/i,
  /\bgovernance\b/i,
  /\bimplementation\b/i,
  /\bdiagnostic(?:s)?\b/i,
  /\bstatus code\b/i,
  /\/api\//i
] as const;

function screeningCopy(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\p{Pd}_]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function memberFacingCandidate(value: string | undefined): string | null {
  const candidate = value?.trim();
  if (!candidate) return null;
  const rawScreened = candidate.normalize("NFKC");
  if (RAW_INTERNAL_LANGUAGE.some((pattern) => pattern.test(rawScreened))) return null;
  const screened = screeningCopy(candidate);
  if (INTERNAL_LANGUAGE.some((pattern) => pattern.test(screened))) return null;
  return candidate;
}

function firstMemberFacing(values: readonly (string | undefined)[]): string | null {
  for (const value of values) {
    const candidate = memberFacingCandidate(value);
    if (candidate) return candidate;
  }
  return null;
}

function naturalCaution(value: string | null): string | null {
  if (!value) return null;
  if (/cannot send, apply, introduce, commit, purchase, or decide anything on your behalf/i.test(value)) {
    return "Werkles can help you compare and prepare. It cannot send, apply, buy, introduce, or make this decision for you.";
  }
  return value;
}

const GERUND_LEADS: Readonly<Record<string, string>> = Object.freeze({
  build: "building",
  choose: "choosing",
  clarify: "clarifying",
  compare: "comparing",
  connect: "connecting",
  define: "defining",
  explore: "exploring",
  find: "finding",
  keep: "keeping",
  make: "making",
  name: "naming",
  prepare: "preparing",
  see: "seeing",
  separate: "separating",
  shortlist: "shortlisting",
  start: "starting",
  strengthen: "strengthening",
  talk: "talking",
  test: "testing",
  use: "using",
  write: "writing"
});

function asGerundPhrase(value: string): string {
  const clean = value.trim().replace(/[.!?]+$/, "");
  const [first = "", ...rest] = clean.split(/\s+/);
  const lead = GERUND_LEADS[first.toLowerCase()] ?? first.toLowerCase();
  return [lead, ...rest].join(" ");
}

const CAUSAL_FACT_PRIORITIES = [
  /getting in the way/i,
  /decision/i,
  /cannot change|non-negotiable|constraint/i,
  /already have/i,
  /where is it today|stage/i,
  /when does this matter|urgency/i
] as const;

const GOAL_FACT_LABEL = /trying to make real|stated need|goal/i;

export function selectMemberFacingCausalFact(
  facts: readonly MemberFacingIntakeFact[]
): MemberFacingIntakeFact | null {
  const safeFacts = facts.filter(
    (fact) => memberFacingCandidate(fact.label) && memberFacingCandidate(fact.text)
  );

  for (const pattern of CAUSAL_FACT_PRIORITIES) {
    const match = safeFacts.find((fact) => pattern.test(fact.label));
    if (match) return match;
  }

  /* A goal by itself says what the member wants, not why this particular
     option follows. Repeating it as causal evidence would make the result
     sound personalized without adding any reasoning. */
  return safeFacts.find((fact) => !GOAL_FACT_LABEL.test(fact.label)) ?? null;
}

function causalWhy(
  recommendation: SquibbRecommendation,
  fact: MemberFacingIntakeFact | null
): string | null {
  if (!fact) return null;
  const practicalEffect = memberFacingCandidate(recommendation.reasoning.translatedNeed);
  if (!memberFacingCandidate(fact.text) || !practicalEffect) return null;

  return `This comes first because the next decisions depend on ${asGerundPhrase(practicalEffect)}.`;
}

export function memberFacingRecommendationSummary(
  recommendation: SquibbRecommendation,
  facts: readonly MemberFacingIntakeFact[] = []
): MemberFacingRecommendationSummary {
  const cautionReasons = recommendation.humanGates
    .filter((gate) => gate.severity === "blocker" || gate.severity === "warning")
    .map((gate) => gate.reason);

  return Object.freeze({
    why:
      causalWhy(recommendation, selectMemberFacingCausalFact(facts)) ??
      firstMemberFacing(recommendation.reasoning.rationale) ??
      WHY_FALLBACK,
    caution:
      naturalCaution(firstMemberFacing([recommendation.reasoning.counterpoint, ...cautionReasons])) ??
      CAUTION_FALLBACK,
    nextAction:
      firstMemberFacing(recommendation.reasoning.nextSteps ?? []) ?? NEXT_ACTION_FALLBACK
  });
}
