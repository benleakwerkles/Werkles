export const MATCH_REVIEW_SHELF_DEVICE_KEY = "werkles:match-deck:review-shelf:v1";
export const MATCH_REVIEW_SHELF_LIMIT = 3;

export function matchReviewShelfFrom(value: unknown, allowedIds: readonly string[]): readonly string[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  const allowed = new Set(allowedIds);
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const candidate of value) {
    if (typeof candidate !== "string" || !allowed.has(candidate) || seen.has(candidate)) continue;
    seen.add(candidate);
    ids.push(candidate);
    if (ids.length === MATCH_REVIEW_SHELF_LIMIT) break;
  }
  return Object.freeze(ids);
}

export function toggleMatchReviewShelf(current: readonly string[], id: string): readonly string[] {
  if (current.includes(id)) return Object.freeze(current.filter((candidateId) => candidateId !== id));
  return Object.freeze([...current, id].slice(-MATCH_REVIEW_SHELF_LIMIT));
}

