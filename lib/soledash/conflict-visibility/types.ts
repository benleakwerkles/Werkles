export type ConflictVisibilityState = "CLEAR" | "CONFLICT" | "STALE" | "NEEDS_REVIEW";

export type ConflictVisibility = {
  state: ConflictVisibilityState;
  blockingCard: string | null;
  branch: string | null;
  owner: string | null;
  reason: string | null;
};

export const CLEAR_CONFLICT_VISIBILITY: ConflictVisibility = {
  state: "CLEAR",
  blockingCard: null,
  branch: null,
  owner: null,
  reason: null
};

export function conflictBadgeLabel(conflict: ConflictVisibility): string {
  switch (conflict.state) {
    case "CLEAR":
      return "Ready";
    case "CONFLICT":
      return `Blocked by ${conflict.blockingCard ?? "CARD-ID"} on ${conflict.branch ?? "BRANCH"}`;
    case "STALE":
      return "Lock stale — needs review";
    case "NEEDS_REVIEW":
      return "Possible design overlap";
    default:
      return "Ready";
  }
}
