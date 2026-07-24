import type {
  EvidenceItem,
  HumanGateRequirement,
  SquibbRecommendation,
  SquibbRecommendationSession
} from "@/lib/squibb/recommendations";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isEvidenceItem(value: unknown): value is EvidenceItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
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
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.kind === "string" &&
    HUMAN_GATE_KINDS.has(value.kind) &&
    (value.severity === "info" || value.severity === "warning" || value.severity === "blocker") &&
    typeof value.reason === "string" &&
    typeof value.benMustApprove === "boolean"
  );
}

function isRecommendation(value: unknown): value is SquibbRecommendation {
  if (!isRecord(value) || !isRecord(value.reasoning) || !isRecord(value.confidence)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.kind === "string" &&
    RECOMMENDATION_KINDS.has(value.kind) &&
    typeof value.rank === "number" &&
    Number.isFinite(value.rank) &&
    typeof value.title === "string" &&
    typeof value.headline === "string" &&
    typeof value.squibbNote === "string" &&
    typeof value.reasoning.statedNeed === "string" &&
    isOptionalString(value.reasoning.translatedNeed) &&
    isStringArray(value.reasoning.rationale) &&
    isOptionalString(value.reasoning.counterpoint) &&
    typeof value.confidence.score === "number" &&
    Number.isFinite(value.confidence.score) &&
    (value.confidence.label === "low" ||
      value.confidence.label === "medium" ||
      value.confidence.label === "high") &&
    typeof value.confidence.why === "string" &&
    Array.isArray(value.evidence) &&
    value.evidence.every(isEvidenceItem) &&
    Array.isArray(value.humanGates) &&
    value.humanGates.every(isHumanGate) &&
    typeof value.suggestedAgent === "string" &&
    isOptionalString(value.suggestedTool) &&
    typeof value.keepOriginalPathLabel === "string"
  );
}

function isPersonalSession(value: unknown): value is SquibbRecommendationSession {
  if (!isRecord(value) || !isRecord(value.source)) return false;
  return (
    value.version === "v1" &&
    typeof value.statedNeed === "string" &&
    typeof value.operatorContext === "string" &&
    typeof value.squibbIntro === "string" &&
    value.source.mode === "authenticated_profile" &&
    typeof value.source.label === "string" &&
    typeof value.source.detail === "string" &&
    value.source.fedDocument === undefined &&
    Array.isArray(value.ranked) &&
    value.ranked.every(isRecommendation) &&
    Array.isArray(value.catalog) &&
    value.catalog.every(isRecommendation)
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
    ? value.session === undefined
    : isPersonalSession(value.session);
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
