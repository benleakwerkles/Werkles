import type {
  EvidenceItem,
  HumanGateRequirement,
  PersonalRecommendationGenerationDisclosure,
  RecommendationKind,
  SquibbRecommendation,
  SquibbRecommendationSession
} from "@/lib/squibb/recommendations";
import { RECOMMENDATION_KIND_LABELS } from "@/lib/squibb/recommendations";
import {
  PERSONAL_RECOMMENDATION_GENERATION,
  PERSONAL_RECOMMENDATION_INTRO,
  PERSONAL_RECOMMENDATION_OPERATOR_CONTEXT,
  PERSONAL_RECOMMENDATION_SOURCE_DETAIL,
  PERSONAL_RECOMMENDATION_SOURCE_LABEL
} from "@/lib/matching/personal-recommendation-disclosure";
import { publicMatchingHumanGates } from "@/lib/matching/public-recommendation-gates";

export type PersonalRecommendationResponse =
  | { success: true; persisted: false; status: "profile_required" }
  | {
      success: true;
      persisted: false;
      status: "personal";
      session: SquibbRecommendationSession;
    };

export type PersonalRecommendationDeliveryDecision =
  | PersonalRecommendationResponse
  | { status: "reauth_required" }
  | { status: "error" };

const RECOMMENDATION_KINDS = new Set([
  "translate_need",
  "verify_proof",
  "stage_intro_candidate",
  "find_partner",
  "find_equipment",
  "find_banker",
  "find_credit_union",
  "find_better_job",
  "stay_current_job",
  "relocate",
  "get_training",
  "raise_capital"
]);

const HUMAN_GATE_KINDS = new Set([
  "none",
  "operator_approval",
  "petra_review",
  "crucible_proof",
  "legal_review",
  "financial_commitment",
  "external_intro"
]);

const RECOMMENDATION_KEYS = new Set([
  "id",
  "kind",
  "rank",
  "title",
  "headline",
  "squibbNote",
  "reasoning",
  "confidence",
  "evidence",
  "humanGates",
  "suggestedAgent",
  "suggestedTool",
  "keepOriginalPathLabel"
]);
const PERSONAL_SESSION_KEYS = new Set([
  "version",
  "statedNeed",
  "operatorContext",
  "squibbIntro",
  "source",
  "generation",
  "ranked",
  "catalog"
]);
const PERSONAL_SOURCE_KEYS = new Set(["mode", "label", "detail"]);
const PERSONAL_GENERATION_KEYS = new Set(Object.keys(PERSONAL_RECOMMENDATION_GENERATION));
const MATCHING_CONFIDENCE_EXPLANATION =
  "Rules-based path score from what you entered and the proof gaps recorded here. It is not a probability of success or eligibility.";
const AUTOMATION_SUBJECT =
  /\b(?:ai|llm|model|provider|werkles|system|agent|algorithm)\b/i;
const REAL_WORLD_ACTION =
  /\b(?:contacted|introduced|sent|paid|purchased|applied|approved|booked|initiated|completed|verified|found|matched|transferred|emailed|called)\b/i;
const NEGATION = /\b(?:no|not|never|nothing|cannot|can't|didn't|hasn't|without)\b/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>) {
  return Object.keys(value).every((key) => allowed.has(key));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])])
  );
}

function canonicalString(value: unknown) {
  return JSON.stringify(canonicalize(value));
}

function carriesPositiveAutomationClaim(value: unknown) {
  if (typeof value !== "string") return false;
  return (
    AUTOMATION_SUBJECT.test(value) &&
    REAL_WORLD_ACTION.test(value) &&
    !NEGATION.test(value)
  );
}

function isOptionalString(value: unknown) {
  return value === undefined || isBoundedString(value, 4_000);
}

function isBoundedString(value: unknown, maxLength: number) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= 100 &&
    value.every((item) => isBoundedString(item, 4_000))
  );
}

function isEvidenceItem(value: unknown): value is EvidenceItem {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, new Set(["id", "label", "strength", "source"])) &&
    isBoundedString(value.id, 200) &&
    isBoundedString(value.label, 1_000) &&
    (value.strength === "verified" ||
      value.strength === "self_reported" ||
      value.strength === "inferred" ||
      value.strength === "missing") &&
    isOptionalString(value.source)
  );
}

function isHumanGate(value: unknown): value is HumanGateRequirement {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, new Set(["id", "label", "kind", "severity", "reason", "benMustApprove"])) &&
    isBoundedString(value.id, 200) &&
    isBoundedString(value.label, 1_000) &&
    typeof value.kind === "string" &&
    HUMAN_GATE_KINDS.has(value.kind) &&
    (value.severity === "info" || value.severity === "warning" || value.severity === "blocker") &&
    isBoundedString(value.reason, 4_000) &&
    typeof value.benMustApprove === "boolean"
  );
}

function isRecommendation(value: unknown): value is SquibbRecommendation {
  if (!isRecord(value) || !isRecord(value.reasoning) || !isRecord(value.confidence)) return false;
  return (
    hasOnlyKeys(value, RECOMMENDATION_KEYS) &&
    hasOnlyKeys(
      value.reasoning,
      new Set(["statedNeed", "translatedNeed", "rationale", "counterpoint"])
    ) &&
    hasOnlyKeys(value.confidence, new Set(["score", "label", "why"])) &&
    isBoundedString(value.id, 200) &&
    typeof value.kind === "string" &&
    RECOMMENDATION_KINDS.has(value.kind) &&
    typeof value.rank === "number" &&
    Number.isInteger(value.rank) &&
    value.rank > 0 &&
    isBoundedString(value.title, 1_000) &&
    isBoundedString(value.headline, 4_000) &&
    isBoundedString(value.squibbNote, 8_000) &&
    isBoundedString(value.reasoning.statedNeed, 8_000) &&
    isOptionalString(value.reasoning.translatedNeed) &&
    isStringArray(value.reasoning.rationale) &&
    isOptionalString(value.reasoning.counterpoint) &&
    typeof value.confidence.score === "number" &&
    Number.isFinite(value.confidence.score) &&
    value.confidence.score >= 0 &&
    value.confidence.score <= 100 &&
    (value.confidence.label === "low" ||
      value.confidence.label === "medium" ||
      value.confidence.label === "high") &&
    isBoundedString(value.confidence.why, 4_000) &&
    Array.isArray(value.evidence) &&
    value.evidence.length <= 100 &&
    value.evidence.every(isEvidenceItem) &&
    Array.isArray(value.humanGates) &&
    value.humanGates.length > 0 &&
    value.humanGates.length <= 100 &&
    value.humanGates.every(isHumanGate) &&
    isBoundedString(value.suggestedAgent, 1_000) &&
    isOptionalString(value.suggestedTool) &&
    isBoundedString(value.keepOriginalPathLabel, 1_000)
  );
}

function isCanonicalPersonalGeneration(
  value: unknown
): value is PersonalRecommendationGenerationDisclosure {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, PERSONAL_GENERATION_KEYS) &&
    canonicalString(value) === canonicalString(PERSONAL_RECOMMENDATION_GENERATION)
  );
}

function hasCanonicalMatchingGates(recommendation: SquibbRecommendation) {
  const expected = publicMatchingHumanGates(recommendation.kind);
  const actual = [...recommendation.humanGates].sort((left, right) =>
    left.id.localeCompare(right.id)
  );
  const sortedExpected = [...expected].sort((left, right) =>
    left.id.localeCompare(right.id)
  );
  return canonicalString(actual) === canonicalString(sortedExpected);
}

function hasSafeSystemPresentation(recommendation: SquibbRecommendation) {
  const expectedNote =
    recommendation.rank === 1
      ? "This is the highest-ranked path not ruled out by the current rules."
      : "This is another path not ruled out by the current rules to compare before deciding what to do.";
  const systemText = [
    recommendation.headline,
    recommendation.squibbNote,
    recommendation.reasoning.translatedNeed,
    ...(recommendation.reasoning.rationale ?? []),
    recommendation.reasoning.counterpoint,
    recommendation.confidence.why,
    ...recommendation.evidence.map((item) => item.source),
    recommendation.suggestedAgent,
    recommendation.suggestedTool,
    recommendation.keepOriginalPathLabel
  ];
  return (
    recommendation.title === RECOMMENDATION_KIND_LABELS[recommendation.kind] &&
    recommendation.squibbNote === expectedNote &&
    recommendation.confidence.why === MATCHING_CONFIDENCE_EXPLANATION &&
    recommendation.suggestedAgent === "Werkles human review" &&
    recommendation.suggestedTool === undefined &&
    recommendation.keepOriginalPathLabel === "Keep my current approach" &&
    !systemText.some(carriesPositiveAutomationClaim)
  );
}

function hasOrderedUniqueRanks(items: SquibbRecommendation[]) {
  return items.every((item, index) => item.rank === index + 1);
}

function isPersonalSession(value: unknown): value is SquibbRecommendationSession {
  if (!isRecord(value) || !isRecord(value.source)) return false;
  if (
    !hasOnlyKeys(value, PERSONAL_SESSION_KEYS) ||
    !hasOnlyKeys(value.source, PERSONAL_SOURCE_KEYS)
  ) {
    return false;
  }
  if (!Array.isArray(value.ranked) || !Array.isArray(value.catalog)) return false;
  if (
    value.ranked.length === 0 ||
    value.ranked.length > 100 ||
    value.catalog.length === 0 ||
    value.catalog.length > 100 ||
    !value.ranked.every(isRecommendation) ||
    !value.catalog.every(isRecommendation)
  ) {
    return false;
  }

  const ranked = value.ranked as SquibbRecommendation[];
  const catalog = value.catalog as SquibbRecommendation[];
  const rankedIds = new Set(ranked.map((item) => item.id));
  const catalogIds = new Set(catalog.map((item) => item.id));
  if (rankedIds.size !== ranked.length || catalogIds.size !== catalog.length) {
    return false;
  }
  if (
    !hasOrderedUniqueRanks(ranked) ||
    !hasOrderedUniqueRanks(catalog) ||
    rankedIds.size !== catalogIds.size ||
    [...rankedIds].some((id) => !catalogIds.has(id)) ||
    ranked.some(
      (item) =>
        canonicalString(item) !==
        canonicalString(catalog.find((candidate) => candidate.id === item.id))
    ) ||
    ranked.some(
      (item) => !hasCanonicalMatchingGates(item) || !hasSafeSystemPresentation(item)
    ) ||
    catalog.some(
      (item) => !hasCanonicalMatchingGates(item) || !hasSafeSystemPresentation(item)
    )
  ) {
    return false;
  }

  return (
    value.version === "v1" &&
    isBoundedString(value.statedNeed, 8_000) &&
    value.operatorContext === PERSONAL_RECOMMENDATION_OPERATOR_CONTEXT &&
    value.squibbIntro === PERSONAL_RECOMMENDATION_INTRO &&
    value.source.mode === "authenticated_profile" &&
    value.source.label === PERSONAL_RECOMMENDATION_SOURCE_LABEL &&
    value.source.detail === PERSONAL_RECOMMENDATION_SOURCE_DETAIL &&
    isCanonicalPersonalGeneration(value.generation)
  );
}

export function isPersonalRecommendationResponse(
  value: unknown
): value is PersonalRecommendationResponse {
  if (
    !isRecord(value) ||
    value.success !== true ||
    value.persisted !== false ||
    (value.status !== "profile_required" && value.status !== "personal")
  ) {
    return false;
  }

  return value.status === "profile_required"
    ? value.session === undefined &&
        hasOnlyKeys(value, new Set(["success", "persisted", "status"]))
    : hasOnlyKeys(value, new Set(["success", "persisted", "status", "session"])) &&
        isPersonalSession(value.session);
}

export function classifyPersonalRecommendationResponse({
  status,
  ok,
  payload
}: {
  status: number;
  ok: boolean;
  payload: unknown;
}): PersonalRecommendationDeliveryDecision {
  if (status === 401) return { status: "reauth_required" };
  if (!ok || !isPersonalRecommendationResponse(payload)) return { status: "error" };
  return payload;
}
