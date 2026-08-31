import type { ClaimDecision } from "./claim-decision-engine.ts";
import type { FundsEvidenceBundleDecision } from "./funds-evidence-bundle-decision.ts";

export interface MemberFundsEvidenceReadout {
  heading: string;
  summary: string;
  components: readonly {
    label: string;
    classification: ClaimDecision["classification"] | "unavailable";
    reason: ClaimDecision["reason"] | "bundle_unavailable";
  }[];
  limitations: readonly string[];
}

export function memberFundsEvidenceReadout(
  decision: FundsEvidenceBundleDecision
): MemberFundsEvidenceReadout {
  const components = decision.components
    ? [
        {
          label: "Account ownership check",
          classification: decision.components.bankAccountOwnership.classification,
          reason: decision.components.bankAccountOwnership.reason
        },
        {
          label: "Dated funds-threshold check",
          classification: decision.components.fundsThreshold.classification,
          reason: decision.components.fundsThreshold.reason
        }
      ]
    : [
        {
          label: "Account ownership check",
          classification: "unavailable" as const,
          reason: "bundle_unavailable" as const
        },
        {
          label: "Dated funds-threshold check",
          classification: "unavailable" as const,
          reason: "bundle_unavailable" as const
        }
      ];

  return {
    heading: decision.selectedEvidenceClass === "test"
      ? "Test-only funds evidence assembly"
      : "Funds evidence assembly",
    summary: decision.selectedEvidenceClass === "test"
      ? "Test-only evidence. It is not live and cannot be disclosed as counterparty funds proof."
      : decision.overall === "satisfied"
        ? "The newest reviewed assembly meets both narrow checks at the evaluation time."
        : "The newest reviewed assembly cannot support this funds proof at the evaluation time.",
    components,
    limitations: [...decision.limitations]
  };
}
