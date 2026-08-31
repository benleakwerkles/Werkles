import {
  VERIFICATION_CLAIM_TYPES,
  VERIFICATION_PURPOSES,
  effectiveClaimStatus,
  validateVerificationClaim,
  type ContractIssue,
  type VerificationClaim,
  type VerificationClaimType,
  type VerificationPurpose
} from "./claim-evidence-contract.ts";

export const CLAIM_DECISION_CLASSIFICATIONS = [
  "satisfied",
  "missing",
  "expired",
  "disputed",
  "revoked",
  "inconclusive"
] as const;

export type ClaimDecisionClassification =
  (typeof CLAIM_DECISION_CLASSIFICATIONS)[number];

export interface ClaimRequirement {
  subjectId: string;
  purpose: VerificationPurpose;
  type: VerificationClaimType;
  scope: string;
}

export type ClaimDecisionReason =
  | "claim_satisfied"
  | "no_matching_claim"
  | "claim_pending"
  | "claim_not_satisfied"
  | "claim_expired"
  | "claim_disputed"
  | "claim_revoked"
  | "claim_inconclusive"
  | "ambiguous_newest_claim"
  | "invalid_matching_claim";

export interface ClaimDecision {
  binding: ClaimRequirement;
  classification: ClaimDecisionClassification;
  reason: ClaimDecisionReason;
  evaluatedAt: string;
  selectedClaimId?: string;
  issues: readonly ContractIssue[];
}

function matchesRequirement(
  claim: VerificationClaim,
  requirement: ClaimRequirement
): boolean {
  return claim.subjectId === requirement.subjectId &&
    claim.purpose === requirement.purpose &&
    claim.type === requirement.type &&
    claim.scope === requirement.scope;
}

function assertValidRequirement(
  requirement: ClaimRequirement,
  evaluatedAt: string
): void {
  if (!requirement.subjectId.trim()) throw new TypeError("subjectId is required");
  if (!requirement.scope.trim()) throw new TypeError("scope is required");
  if (!VERIFICATION_PURPOSES.includes(requirement.purpose)) {
    throw new TypeError("purpose must be a known verification purpose");
  }
  if (!VERIFICATION_CLAIM_TYPES.includes(requirement.type)) {
    throw new TypeError("type must be a known verification claim type");
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(evaluatedAt) ||
      Number.isNaN(Date.parse(evaluatedAt))) {
    throw new TypeError("evaluatedAt must be an ISO-8601 UTC instant");
  }
}

function sortNewestFirst(a: VerificationClaim, b: VerificationClaim): number {
  const observedDifference = Date.parse(b.observedAt) - Date.parse(a.observedAt);
  return observedDifference || a.id.localeCompare(b.id);
}

export function decideClaim(
  requirement: ClaimRequirement,
  claims: readonly VerificationClaim[],
  evaluatedAt: string
): ClaimDecision {
  assertValidRequirement(requirement, evaluatedAt);
  const matchingClaims = claims.filter((claim) => matchesRequirement(claim, requirement));

  if (matchingClaims.length === 0) {
    return {
      binding: { ...requirement },
      classification: "missing",
      reason: "no_matching_claim",
      evaluatedAt,
      issues: []
    };
  }

  const invalidIssues = matchingClaims.flatMap((claim) =>
    [
      ...validateVerificationClaim(claim),
      ...(Date.parse(claim.observedAt) > Date.parse(evaluatedAt)
        ? [{ path: "observedAt", code: "must_not_follow_evaluated_at" }]
        : [])
    ].map((issue) => ({
      path: `claims.${claim.id}.${issue.path}`,
      code: issue.code
    }))
  );
  if (invalidIssues.length > 0) {
    return {
      binding: { ...requirement },
      classification: "inconclusive",
      reason: "invalid_matching_claim",
      evaluatedAt,
      issues: invalidIssues
    };
  }

  const newestFirst = [...matchingClaims].sort(sortNewestFirst);
  const selected = newestFirst[0];
  if (
    newestFirst.length > 1 &&
    newestFirst[1].observedAt === selected.observedAt
  ) {
    return {
      binding: { ...requirement },
      classification: "inconclusive",
      reason: "ambiguous_newest_claim",
      evaluatedAt,
      issues: [{ path: "claims", code: "ambiguous_newest_observation" }]
    };
  }
  const status = effectiveClaimStatus(selected, evaluatedAt);
  const common = {
    binding: { ...requirement },
    evaluatedAt,
    selectedClaimId: selected.id,
    issues: []
  } as const;

  switch (status) {
    case "satisfied":
      return { ...common, classification: "satisfied", reason: "claim_satisfied" };
    case "expired":
      return { ...common, classification: "expired", reason: "claim_expired" };
    case "disputed":
      return { ...common, classification: "disputed", reason: "claim_disputed" };
    case "revoked":
      return { ...common, classification: "revoked", reason: "claim_revoked" };
    case "inconclusive":
      return { ...common, classification: "inconclusive", reason: "claim_inconclusive" };
    case "pending":
      return { ...common, classification: "missing", reason: "claim_pending" };
    case "not_satisfied":
      return { ...common, classification: "missing", reason: "claim_not_satisfied" };
  }
}
