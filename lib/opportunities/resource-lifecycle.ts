import type { BusinessOpportunityCandidate } from "@/lib/opportunities/types";

export const RESOURCE_SURFACES = ["bellows", "workshop", "werkle"] as const;

export type ResourceSurface = (typeof RESOURCE_SURFACES)[number];

export type ResourceLifecycleState =
  | "lead"
  | "private_comparison"
  | "investigation"
  | "shared_proposal"
  | "accepted_for_shared_work"
  | "dismissed";

export type ResourceLifecycleRecord = Readonly<{
  resourceId: BusinessOpportunityCandidate["id"];
  state: ResourceLifecycleState;
  owner: string | null;
  nextQuestion: string | null;
  participantDecisions: Readonly<Record<string, "undecided" | "interested" | "not_for_us">>;
}>;

export function sharedDecisionState(
  decisions: ResourceLifecycleRecord["participantDecisions"]
): ResourceLifecycleState {
  const values = Object.values(decisions);
  if (values.length > 1 && values.every((value) => value === "interested")) {
    return "accepted_for_shared_work";
  }
  if (values.some((value) => value === "not_for_us")) return "dismissed";
  return "shared_proposal";
}

export function surfaceResponsibility(surface: ResourceSurface): string {
  if (surface === "bellows") return "Understand the option privately before it becomes work.";
  if (surface === "workshop") return "Give the investigation an owner and one answerable question.";
  return "Share only the proposal, then let every participant decide explicitly.";
}
