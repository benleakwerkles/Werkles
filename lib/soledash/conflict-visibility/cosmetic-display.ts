import type { GuillotineCard } from "@/lib/soledash/guillotine/types";

import {
  CLEAR_CONFLICT_VISIBILITY,
  type ConflictVisibility
} from "./types";

/**
 * Display-only badge paint for card UI previews.
 * Not conflict detection — real conflict data should be passed on `card.conflict`.
 */
export function cosmeticConflictDisplay(card: GuillotineCard, index: number): ConflictVisibility {
  if (card.conflict) return card.conflict;

  const branch = card.branch !== "—" ? card.branch : "main";
  const owner = card.owner !== "—" ? card.owner : null;

  if (card.id.startsWith("blocker:")) {
    return {
      state: "CONFLICT",
      blockingCard: "P0-A002",
      branch,
      owner,
      reason: card.purpose !== "—" ? card.purpose : "Platform blocker holds this lane"
    };
  }

  switch (index % 4) {
    case 0:
      return CLEAR_CONFLICT_VISIBILITY;
    case 1:
      return {
        state: "CONFLICT",
        blockingCard: "P0-A002",
        branch,
        owner,
        reason: "Parallel lane holds the same foreman write path"
      };
    case 2:
      return {
        state: "STALE",
        blockingCard: card.cardId,
        branch,
        owner,
        reason: "Lock timestamp is older than the latest fleet snapshot"
      };
    case 3:
      return {
        state: "NEEDS_REVIEW",
        blockingCard: null,
        branch,
        owner,
        reason: "Two cards touch the same SoleDash surface — operator review only"
      };
    default:
      return CLEAR_CONFLICT_VISIBILITY;
  }
}
