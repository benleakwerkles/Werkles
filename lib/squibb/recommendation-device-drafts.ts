import { recommendationSolutionPath } from "./recommendation-solution-path";
import type { RecommendationKind } from "./recommendations";

export const RECOMMENDATION_DRAFT_MAX_FIELD_LENGTH = 1200;
const MAX_RAW_LENGTH = 12_000;

export function recommendationDraftStorageKey(kind: RecommendationKind): string {
  return `werkles:recommendation-work:v2:${kind}`;
}

export function normalizeRecommendationDraft(
  kind: RecommendationKind,
  value: unknown
): Readonly<Record<string, string>> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const fields = recommendationSolutionPath(kind).artifact.fields;

  const normalized: Record<string, string> = {};
  for (const field of fields) {
    const candidate = source[field.id];
    if (candidate !== undefined && typeof candidate !== "string") return null;
    normalized[field.id] = (candidate ?? "").slice(0, RECOMMENDATION_DRAFT_MAX_FIELD_LENGTH);
  }
  return Object.freeze(normalized);
}

export function parseRecommendationDraft(
  kind: RecommendationKind,
  raw: string | null
): Readonly<Record<string, string>> | null {
  if (raw === null || raw.length > MAX_RAW_LENGTH) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const fields = recommendationSolutionPath(kind).artifact.fields;
    if (Object.keys(parsed).some((key) => !fields.some((field) => field.id === key))) return null;
    return normalizeRecommendationDraft(kind, parsed);
  } catch {
    return null;
  }
}
