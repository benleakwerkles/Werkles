import {
  assertUnambiguousAssemblyOrdering,
  reconstructFundsEvidenceBundleAt,
  type FundsEvidenceBundleEvent,
  type FundsEvidenceBundleState,
  type FundsEvidenceTrustDomain,
  type ReviewedFundsEvidenceScopes
} from "./funds-evidence-bundle.ts";
import {
  evaluateFundsProofPolicy,
  type FundsProofPolicyDecision,
  type FundsProofPolicyRequirement
} from "./funds-proof-policy.ts";
import type { VerificationClaim } from "./claim-evidence-contract.ts";

export interface ImmutableFundsClaimEvidence {
  claim: VerificationClaim;
  contentDigest: string;
  limitations: readonly FundsEvidenceLimitation[];
}

export const FUNDS_EVIDENCE_LIMITATIONS = [
  "Ownership does not establish account safety.",
  "A dated threshold is not a current balance."
] as const;

export type FundsEvidenceLimitation = (typeof FUNDS_EVIDENCE_LIMITATIONS)[number];

export type FundsBundleShareGrant = {
  grantId: string;
  bundleId: string;
  subjectId: string;
  granteeId: string;
  purpose: string;
  state: "active" | "revoked";
  grantedAt: string;
  expiresAt: string;
  revokedAt?: string;
};

export type FundsBundleDisclosureRequest =
  | { audience: "member" }
  | {
      audience: "counterparty";
      granteeId: string;
      grant: FundsBundleShareGrant | undefined;
    };

export interface FundsEvidenceBundleDecisionRequirement {
  policy: FundsProofPolicyRequirement;
  approvedPolicyDigest: string;
  approvedPolicyDigests: readonly string[];
  reviewedScopes: ReviewedFundsEvidenceScopes;
  trustDomain: FundsEvidenceTrustDomain;
  maxObservationSkewSeconds: number;
  disclosure: FundsBundleDisclosureRequest;
}

export type FundsEvidenceBundleDecisionReason =
  | "bundle_satisfied"
  | "no_exact_lineage_bundle"
  | "invalid_lineage_bundle"
  | "ambiguous_newest_assembly"
  | "newest_bundle_open"
  | "newest_bundle_revoked"
  | "unapproved_policy_binding"
  | "bad_membership"
  | "claim_digest_mismatch"
  | "component_time_incoherent"
  | "observation_skew_exceeded"
  | "component_claim_failed"
  | "unapproved_limitation"
  | "nonproduction_disclosure_forbidden"
  | "share_grant_missing"
  | "share_grant_wrong_bundle"
  | "share_grant_invalid";

export interface FundsEvidenceBundleDecision {
  overall: "satisfied" | "fail_closed";
  reason: FundsEvidenceBundleDecisionReason;
  evaluatedAt: string;
  selectedBundleId?: string;
  selectedBundleStatus?: FundsEvidenceBundleState["status"];
  selectedEvidenceClass?: FundsEvidenceTrustDomain["evidenceClass"];
  components?: FundsProofPolicyDecision["components"];
  limitations: readonly string[];
  issues: readonly { code: string }[];
  disclosureAllowed: boolean;
}

const SHA256 = /^sha256:[0-9a-f]{64}$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function sameTrustDomain(a: FundsEvidenceTrustDomain, b: FundsEvidenceTrustDomain): boolean {
  return a.evidenceClass === b.evidenceClass && a.key === b.key;
}

function sameScopes(a: ReviewedFundsEvidenceScopes, b: ReviewedFundsEvidenceScopes): boolean {
  return a.reviewDigest === b.reviewDigest &&
    a.bankAccountOwnership === b.bankAccountOwnership &&
    a.fundsThreshold === b.fundsThreshold;
}

function isExactLineage(
  state: Pick<FundsEvidenceBundleState,
    "subjectId" | "purpose" | "approvedPolicyDigest" | "reviewedScopes" | "trustDomain">,
  requirement: FundsEvidenceBundleDecisionRequirement
): boolean {
  return state.subjectId === requirement.policy.subjectId &&
    state.purpose === requirement.policy.purpose &&
    state.approvedPolicyDigest === requirement.approvedPolicyDigest &&
    sameScopes(state.reviewedScopes, requirement.reviewedScopes) &&
    sameTrustDomain(state.trustDomain, requirement.trustDomain);
}

function looksLikeRequestedLineage(
  events: readonly FundsEvidenceBundleEvent[],
  requirement: FundsEvidenceBundleDecisionRequirement
): boolean {
  const created = events[0];
  if (created?.kind !== "bundle_created") return false;
  try {
    return isExactLineage(created, requirement);
  } catch {
    // A malformed create declaration for this subject and purpose cannot be
    // trusted as safely outside the requested lineage.
    return created.subjectId === requirement.policy.subjectId &&
      created.purpose === requirement.policy.purpose;
  }
}

function fail(
  reason: FundsEvidenceBundleDecisionReason,
  evaluatedAt: string,
  extras: Partial<FundsEvidenceBundleDecision> = {}
): FundsEvidenceBundleDecision {
  return {
    overall: "fail_closed",
    reason,
    evaluatedAt,
    limitations: [],
    issues: [{ code: reason }],
    disclosureAllowed: false,
    ...extras
  };
}

function validateRequirement(
  requirement: FundsEvidenceBundleDecisionRequirement,
  evaluatedAt: string
): void {
  if (!requirement || typeof requirement !== "object") throw new TypeError("requirement is required");
  if (!ISO_INSTANT.test(evaluatedAt) || Number.isNaN(Date.parse(evaluatedAt))) {
    throw new TypeError("evaluatedAt must be an ISO-8601 UTC instant");
  }
  if (!SHA256.test(requirement.approvedPolicyDigest) ||
      !SHA256.test(requirement.reviewedScopes.reviewDigest)) {
    throw new TypeError("policy and review digests must be sha256 digests");
  }
  if (!Number.isSafeInteger(requirement.maxObservationSkewSeconds) ||
      requirement.maxObservationSkewSeconds < 0) {
    throw new TypeError("maxObservationSkewSeconds must be a nonnegative integer");
  }
}

function grantFailure(
  request: FundsBundleDisclosureRequest,
  bundle: FundsEvidenceBundleState,
  evaluatedAt: string
): FundsEvidenceBundleDecisionReason | undefined {
  if (request.audience === "member") return undefined;
  const grant = request.grant;
  if (!grant) return "share_grant_missing";
  if (grant.bundleId !== bundle.bundleId) return "share_grant_wrong_bundle";
  const now = Date.parse(evaluatedAt);
  const grantedAt = Date.parse(grant.grantedAt);
  const expiresAt = Date.parse(grant.expiresAt);
  const revokedAt = grant.revokedAt === undefined ? undefined : Date.parse(grant.revokedAt);
  const sealedAt = bundle.sealedAt === undefined ? Number.NaN : Date.parse(bundle.sealedAt);
  if (grant.subjectId !== bundle.subjectId ||
      !grant.grantId.trim() ||
      grant.granteeId !== request.granteeId ||
      grant.purpose !== bundle.purpose ||
      !ISO_INSTANT.test(grant.grantedAt) ||
      !ISO_INSTANT.test(grant.expiresAt) ||
      !Number.isFinite(grantedAt) ||
      !Number.isFinite(expiresAt) ||
      !Number.isFinite(sealedAt) ||
      grantedAt < sealedAt ||
      grantedAt > now ||
      expiresAt <= grantedAt ||
      expiresAt <= now ||
      (grant.state !== "active" && grant.state !== "revoked") ||
      (grant.state === "active" && grant.revokedAt !== undefined) ||
      (grant.state === "revoked" &&
        (grant.revokedAt === undefined ||
          !ISO_INSTANT.test(grant.revokedAt) ||
          !Number.isFinite(revokedAt) ||
          (revokedAt as number) < grantedAt ||
          (revokedAt as number) > expiresAt ||
          (revokedAt as number) <= now))) {
    return "share_grant_invalid";
  }
  return undefined;
}

export function decideFundsEvidenceBundle(
  requirement: FundsEvidenceBundleDecisionRequirement,
  eventStreams: readonly (readonly FundsEvidenceBundleEvent[])[],
  claimEvidence: readonly ImmutableFundsClaimEvidence[],
  evaluatedAt: string
): FundsEvidenceBundleDecision {
  validateRequirement(requirement, evaluatedAt);
  if (!Array.isArray(eventStreams) || !Array.isArray(claimEvidence)) {
    throw new TypeError("eventStreams and claimEvidence must be arrays");
  }

  const lineageStates: FundsEvidenceBundleState[] = [];
  for (const stream of eventStreams) {
    try {
      const state = reconstructFundsEvidenceBundleAt(stream, evaluatedAt);
      if (state && isExactLineage(state, requirement)) lineageStates.push(state);
    } catch {
      // An invalid stream that declares this exact lineage must block favorable fallback.
      if (looksLikeRequestedLineage(stream, requirement)) {
        return fail("invalid_lineage_bundle", evaluatedAt);
      }
    }
  }
  if (lineageStates.length === 0) return fail("no_exact_lineage_bundle", evaluatedAt);

  try {
    assertUnambiguousAssemblyOrdering(lineageStates);
  } catch {
    return fail("ambiguous_newest_assembly", evaluatedAt);
  }

  const newestOrder = lineageStates.reduce(
    (max, state) => BigInt(state.assemblyOrder) > max ? BigInt(state.assemblyOrder) : max,
    BigInt(0)
  );
  const selected = lineageStates.find((state) => BigInt(state.assemblyOrder) === newestOrder)!;
  const selectedContext = {
    selectedBundleId: selected.bundleId,
    selectedBundleStatus: selected.status,
    selectedEvidenceClass: selected.trustDomain.evidenceClass
  } as const;

  if (!requirement.approvedPolicyDigests.includes(selected.approvedPolicyDigest)) {
    return fail("unapproved_policy_binding", evaluatedAt, selectedContext);
  }
  if (selected.status === "open") return fail("newest_bundle_open", evaluatedAt, selectedContext);
  if (selected.status === "revoked") return fail("newest_bundle_revoked", evaluatedAt, selectedContext);
  if (
    requirement.disclosure.audience === "counterparty" &&
    selected.trustDomain.evidenceClass !== "production"
  ) {
    return fail("nonproduction_disclosure_forbidden", evaluatedAt, selectedContext);
  }

  const ownershipBinding = selected.memberships.bankAccountOwnership;
  const thresholdBinding = selected.memberships.fundsThreshold;
  if (!ownershipBinding || !thresholdBinding ||
      Object.keys(selected.memberships).length !== 2) {
    return fail("bad_membership", evaluatedAt, selectedContext);
  }

  const resolve = (claimId: string, digest: string): ImmutableFundsClaimEvidence | undefined => {
    const matches = claimEvidence.filter((evidence) => evidence.claim.id === claimId);
    if (matches.length !== 1 || matches[0].contentDigest !== digest || !SHA256.test(digest)) {
      return undefined;
    }
    return matches[0];
  };
  const ownership = resolve(ownershipBinding.claimId, ownershipBinding.claimDigest);
  const threshold = resolve(thresholdBinding.claimId, thresholdBinding.claimDigest);
  if (!ownership || !threshold) {
    return fail("claim_digest_mismatch", evaluatedAt, selectedContext);
  }

  const sealedAt = Date.parse(selected.sealedAt!);
  if (
    Date.parse(ownership.claim.observedAt) > sealedAt ||
    Date.parse(threshold.claim.observedAt) > sealedAt
  ) {
    return fail("component_time_incoherent", evaluatedAt, selectedContext);
  }

  const allLimitations = [...ownership.limitations, ...threshold.limitations];
  if (allLimitations.some((limitation) => !FUNDS_EVIDENCE_LIMITATIONS.includes(limitation))) {
    return fail("unapproved_limitation", evaluatedAt, selectedContext);
  }

  const skewSeconds = Math.abs(
    Date.parse(ownership.claim.observedAt) - Date.parse(threshold.claim.observedAt)
  ) / 1000;
  if (!Number.isFinite(skewSeconds) || skewSeconds > requirement.maxObservationSkewSeconds) {
    return fail("observation_skew_exceeded", evaluatedAt, selectedContext);
  }

  const components = evaluateFundsProofPolicy(
    requirement.policy,
    [ownership.claim, threshold.claim],
    evaluatedAt
  );
  const limitations = [...new Set(allLimitations)];
  if (components.overall !== "satisfied") {
    return fail("component_claim_failed", evaluatedAt, {
      ...selectedContext,
      components: components.components,
      limitations,
      issues: components.failures.map((failure) => ({
        code: `${failure.component}.${failure.reason}`
      }))
    });
  }

  const grantReason = grantFailure(requirement.disclosure, selected, evaluatedAt);
  if (grantReason) {
    return fail(grantReason, evaluatedAt, {
      ...selectedContext,
      components: components.components,
      limitations
    });
  }

  return {
    overall: "satisfied",
    reason: "bundle_satisfied",
    evaluatedAt,
    ...selectedContext,
    components: components.components,
    limitations,
    issues: [],
    disclosureAllowed: true
  };
}
