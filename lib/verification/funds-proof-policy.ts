import {
  VERIFICATION_PURPOSES,
  type VerificationClaim,
  type VerificationPurpose
} from "./claim-evidence-contract.ts";
import {
  decideClaim,
  type ClaimDecision,
  type ClaimDecisionClassification,
  type ClaimDecisionReason
} from "./claim-decision-engine.ts";

export interface ReviewedFundsProofScopes {
  reviewRef: string;
  bankAccountOwnership: string;
  fundsThreshold: string;
}

export interface FundsProofPolicyRequirement {
  policyId: string;
  subjectId: string;
  purpose: VerificationPurpose;
  reviewedScopes: ReviewedFundsProofScopes;
}

export type FundsProofComponent = "bankAccountOwnership" | "fundsThreshold";
export type FundsProofOverall = "satisfied" | "fail_closed";

export interface FundsProofFailure {
  component: FundsProofComponent;
  classification: Exclude<ClaimDecisionClassification, "satisfied">;
  reason: Exclude<ClaimDecisionReason, "claim_satisfied">;
}

export interface FundsProofPolicyDecision {
  policy: FundsProofPolicyRequirement;
  evaluatedAt: string;
  overall: FundsProofOverall;
  components: {
    bankAccountOwnership: ClaimDecision;
    fundsThreshold: ClaimDecision;
  };
  failures: readonly FundsProofFailure[];
}

const POLICY_KEY = /^[A-Za-z0-9][A-Za-z0-9:._/-]{0,199}$/;

function requirePolicyKey(name: string, value: unknown): asserts value is string {
  if (typeof value !== "string" || value !== value.trim() || !POLICY_KEY.test(value)) {
    throw new TypeError(`${name} must be an explicit nonblank reviewed policy key`);
  }
}

function assertValidPolicy(policy: FundsProofPolicyRequirement): void {
  if (!policy || typeof policy !== "object") {
    throw new TypeError("policy must be an object");
  }
  requirePolicyKey("policyId", policy.policyId);
  requirePolicyKey("subjectId", policy.subjectId);
  if (!policy.reviewedScopes || typeof policy.reviewedScopes !== "object") {
    throw new TypeError("reviewedScopes must be an object");
  }
  requirePolicyKey("reviewedScopes.reviewRef", policy.reviewedScopes.reviewRef);
  requirePolicyKey(
    "reviewedScopes.bankAccountOwnership",
    policy.reviewedScopes.bankAccountOwnership
  );
  requirePolicyKey("reviewedScopes.fundsThreshold", policy.reviewedScopes.fundsThreshold);
  if (policy.reviewedScopes.bankAccountOwnership === policy.reviewedScopes.fundsThreshold) {
    throw new TypeError("ownership and funds claims require separate reviewed scope keys");
  }
  if (!VERIFICATION_PURPOSES.includes(policy.purpose)) {
    throw new TypeError("purpose must be a known verification purpose");
  }
}

function failureFor(
  component: FundsProofComponent,
  decision: ClaimDecision
): FundsProofFailure | undefined {
  if (decision.classification === "satisfied") return undefined;
  return {
    component,
    classification: decision.classification,
    reason: decision.reason as Exclude<ClaimDecisionReason, "claim_satisfied">
  };
}

export function evaluateFundsProofPolicy(
  policy: FundsProofPolicyRequirement,
  claims: readonly VerificationClaim[],
  evaluatedAt: string
): FundsProofPolicyDecision {
  assertValidPolicy(policy);
  if (!Array.isArray(claims)) throw new TypeError("claims must be an array");

  const bankAccountOwnership = decideClaim(
    {
      subjectId: policy.subjectId,
      purpose: policy.purpose,
      type: "bank_account_ownership_matched",
      scope: policy.reviewedScopes.bankAccountOwnership
    },
    claims,
    evaluatedAt
  );
  const fundsThreshold = decideClaim(
    {
      subjectId: policy.subjectId,
      purpose: policy.purpose,
      type: "funds_threshold_observed",
      scope: policy.reviewedScopes.fundsThreshold
    },
    claims,
    evaluatedAt
  );

  const failures = [
    failureFor("bankAccountOwnership", bankAccountOwnership),
    failureFor("fundsThreshold", fundsThreshold)
  ].filter((failure): failure is FundsProofFailure => failure !== undefined);

  return {
    policy: {
      ...policy,
      reviewedScopes: { ...policy.reviewedScopes }
    },
    evaluatedAt,
    overall: failures.length === 0 ? "satisfied" : "fail_closed",
    components: { bankAccountOwnership, fundsThreshold },
    failures
  };
}
