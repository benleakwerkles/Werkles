/** Shared types for Squibb Concierge Walkthrough v0 (display-only). */

export type ConfidenceLabel = "low" | "medium" | "high";

export type HumanGateSeverity = "info" | "warning" | "blocker";

export type HumanGateKind =
  | "none"
  | "operator_approval"
  | "petra_review"
  | "crucible_proof"
  | "legal_review"
  | "financial_commitment"
  | "external_intro";

export interface HumanGateRequirement {
  id: string;
  label: string;
  kind: HumanGateKind;
  severity: HumanGateSeverity;
  reason: string;
  benMustApprove: boolean;
}
