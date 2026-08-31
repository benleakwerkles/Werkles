import type { GhostMember } from "@/lib/ghost-fleet/types";

export const BACKER_EQUALITY_POLICY = Object.freeze({
  version: "v1" as const,
  postureValues: Object.freeze(["can_back", "not_qualified"] as const),
  allowedUse: "purpose_specific_eligibility_filter" as const,
  forbiddenUses: Object.freeze([
    "score", "sort", "weight", "tie_break", "visibility", "queue_priority", "badge", "member_access"
  ] as const)
});

/**
 * Answers one narrow question only: may this profile enter the candidate pool
 * for this capital conversation? It must run before personality/goal/working-
 * style ranking and its result must never add points or public status.
 */
export function eligibleForCapitalConversation(member: GhostMember): boolean {
  return member.lane === "Backer" && member.capitalPosture === "can_back";
}
