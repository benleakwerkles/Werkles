import type { GhostMatchResult } from "@/lib/ghost-fleet/types";

export const GHOST_FLEET_WORKSHOP_ROUTE = "/dashboard/blueprints" as const;
export const GHOST_FLEET_INTROS_ROUTE = "/dashboard/intros" as const;

export type GhostFleetPlayableLoopBridge = Readonly<{
  synthetic: true;
  state: "ranked" | "no_honest_match";
  candidateCount: number;
  reviewRequiredCount: number;
  disclosure: string;
  workshopHref: typeof GHOST_FLEET_WORKSHOP_ROUTE;
  introsHref: typeof GHOST_FLEET_INTROS_ROUTE;
}>;

/**
 * Reduce an owner-bound match result to the minimum public navigation contract.
 * Candidate identities, scores, reasons, owner IDs, and intake IDs deliberately
 * do not cross this seam. The caller must supply the exact intake ID shown on
 * the recommendation page; a concurrent/stale result fails closed.
 */
export function buildGhostFleetPlayableLoopBridge(
  result: GhostMatchResult,
  expectedIntakeId: string,
  disclosure: string
): GhostFleetPlayableLoopBridge | null {
  if (
    typeof expectedIntakeId !== "string" ||
    expectedIntakeId.trim().length === 0 ||
    typeof result?.intakeId !== "string" ||
    result.intakeId !== expectedIntakeId ||
    typeof disclosure !== "string" ||
    disclosure.trim().length === 0 ||
    !Number.isSafeInteger(result.scored) ||
    result.scored < 0 ||
    !Number.isSafeInteger(result.excludedBlocked) ||
    result.excludedBlocked < 0 ||
    !Array.isArray(result.candidates) ||
    result.candidates.length > result.scored
  ) {
    return null;
  }

  let reviewRequiredCount = 0;
  const candidateIds = new Set<string>();
  for (const [index, candidate] of result.candidates.entries()) {
    if (
      candidate?.synthetic !== true ||
      typeof candidate.ghostId !== "string" ||
      candidate.ghostId.trim().length === 0 ||
      candidateIds.has(candidate.ghostId) ||
      candidate.rank !== index + 1 ||
      (candidate.eligibility !== "open" && candidate.eligibility !== "review_required")
    ) {
      return null;
    }
    candidateIds.add(candidate.ghostId);
    if (candidate.eligibility === "review_required") reviewRequiredCount += 1;
  }

  return Object.freeze({
    synthetic: true,
    state: result.candidates.length > 0 ? "ranked" : "no_honest_match",
    candidateCount: result.candidates.length,
    reviewRequiredCount,
    disclosure: disclosure.trim(),
    workshopHref: GHOST_FLEET_WORKSHOP_ROUTE,
    introsHref: GHOST_FLEET_INTROS_ROUTE
  });
}
