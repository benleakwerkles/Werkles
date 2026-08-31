import {
  decideFundsEvidenceBundle,
  type FundsBundleShareGrant,
  type FundsEvidenceBundleDecision,
  type ImmutableFundsClaimEvidence
} from "./funds-evidence-bundle-decision.ts";
import type {
  FundsEvidenceBundleEvent,
  FundsEvidenceTrustDomain,
  ReviewedFundsEvidenceScopes
} from "./funds-evidence-bundle.ts";
import type { FundsProofPolicyRequirement } from "./funds-proof-policy.ts";

export interface ResolverApprovedFundsPolicy {
  policyRef: string;
  policy: FundsProofPolicyRequirement;
  approvedPolicyDigest: string;
  reviewedScopes: ReviewedFundsEvidenceScopes;
  trustDomain: FundsEvidenceTrustDomain;
  maxObservationSkewSeconds: number;
}

export interface TrustedFundsDecisionSources {
  authenticatedGranteeId: string;
  currentServerTime(): string;
  resolveApprovedPolicy(policyRef: string): ResolverApprovedFundsPolicy | undefined;
  resolveGrant(grantId: string): FundsBundleShareGrant | undefined;
  resolveBundleEvidence(bundleId: string): {
    eventStreams: readonly (readonly FundsEvidenceBundleEvent[])[];
    claimEvidence: readonly ImmutableFundsClaimEvidence[];
  } | undefined;
}

const TRUSTED_CONTEXT = Symbol("trusted-funds-decision-context");
const TRUSTED_CONTEXTS = new WeakSet<object>();

export interface TrustedFundsDecisionContext {
  readonly [TRUSTED_CONTEXT]: true;
  readonly authenticatedGranteeId: string;
  readonly currentServerTime: TrustedFundsDecisionSources["currentServerTime"];
  readonly resolveApprovedPolicy: TrustedFundsDecisionSources["resolveApprovedPolicy"];
  readonly resolveGrant: TrustedFundsDecisionSources["resolveGrant"];
  readonly resolveBundleEvidence: TrustedFundsDecisionSources["resolveBundleEvidence"];
}

/**
 * Server composition roots use this binder after authentication. It is not an
 * authentication function and must never be exposed as a client request parser.
 */
export function bindTrustedFundsDecisionContext(
  sources: TrustedFundsDecisionSources
): TrustedFundsDecisionContext {
  if (!sources || typeof sources !== "object" || !sources.authenticatedGranteeId?.trim()) {
    throw new TypeError("authenticatedGranteeId must come from trusted authentication");
  }
  if (typeof sources.currentServerTime !== "function" ||
      typeof sources.resolveApprovedPolicy !== "function" ||
      typeof sources.resolveGrant !== "function" ||
      typeof sources.resolveBundleEvidence !== "function") {
    throw new TypeError("trusted decision resolvers are required");
  }
  const context = Object.freeze({
    [TRUSTED_CONTEXT]: true as const,
    authenticatedGranteeId: sources.authenticatedGranteeId,
    currentServerTime: sources.currentServerTime,
    resolveApprovedPolicy: sources.resolveApprovedPolicy,
    resolveGrant: sources.resolveGrant,
    resolveBundleEvidence: sources.resolveBundleEvidence
  });
  TRUSTED_CONTEXTS.add(context);
  return context;
}

export interface CounterpartyFundsDecisionRequest {
  policyRef: string;
  grantId: string;
  bundleId: string;
}

export type TrustedCounterpartyFundsDecision =
  | {
      outcome: "allowed";
      reason: "trusted_context_decision_allowed";
      evaluatedAt: string;
      decision: FundsEvidenceBundleDecision;
    }
  | {
      outcome: "denied";
      reason:
        | "untrusted_decision_context"
        | "caller_supplied_trust_material"
        | "approved_policy_not_resolved"
        | "grant_not_resolved"
        | "bundle_evidence_not_resolved"
        | "grant_reference_mismatch"
        | "invalid_trusted_server_time"
        | "bundle_lineage_mismatch"
        | "funds_decision_failed";
      evaluatedAt?: string;
      decision?: FundsEvidenceBundleDecision;
    };

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const CALLER_FORBIDDEN_FIELDS = [
  "approvedPolicyDigest",
  "approvedPolicyDigests",
  "approvedPolicy",
  "grant",
  "granteeId",
  "authenticatedGranteeId",
  "evaluatedAt",
  "currentServerTime",
  "disclosure"
] as const;

function hasTrustedBrand(context: TrustedFundsDecisionContext): boolean {
  return Boolean(context && TRUSTED_CONTEXTS.has(context));
}

export function decideCounterpartyFundsWithTrustedContext(
  context: TrustedFundsDecisionContext,
  request: CounterpartyFundsDecisionRequest
): TrustedCounterpartyFundsDecision {
  if (!hasTrustedBrand(context)) return { outcome: "denied", reason: "untrusted_decision_context" };
  const requestPrototype = request && typeof request === "object"
    ? Object.getPrototypeOf(request)
    : undefined;
  const requestKeys = request && typeof request === "object" ? Reflect.ownKeys(request) : [];
  if (!request || typeof request !== "object" ||
      (requestPrototype !== Object.prototype && requestPrototype !== null) ||
      requestKeys.some((key) =>
        typeof key !== "string" || !Object.prototype.propertyIsEnumerable.call(request, key)
      ) ||
      requestKeys.length !== 3 ||
      !["policyRef", "grantId", "bundleId"].every((field) => Object.hasOwn(request, field)) ||
      CALLER_FORBIDDEN_FIELDS.some((field) => Object.hasOwn(request, field))) {
    return { outcome: "denied", reason: "caller_supplied_trust_material" };
  }

  let evaluatedAt: string;
  try {
    evaluatedAt = context.currentServerTime();
  } catch {
    return { outcome: "denied", reason: "invalid_trusted_server_time" };
  }
  const normalizedTime = evaluatedAt.includes(".")
    ? evaluatedAt
    : evaluatedAt.replace("Z", ".000Z");
  if (!ISO_INSTANT.test(evaluatedAt) || Number.isNaN(Date.parse(evaluatedAt)) ||
      new Date(evaluatedAt).toISOString() !== normalizedTime) {
    return { outcome: "denied", reason: "invalid_trusted_server_time" };
  }

  let approvedPolicy: ResolverApprovedFundsPolicy | undefined;
  try {
    approvedPolicy = context.resolveApprovedPolicy(request.policyRef);
  } catch {
    return { outcome: "denied", reason: "approved_policy_not_resolved", evaluatedAt };
  }
  if (!approvedPolicy || approvedPolicy.policyRef !== request.policyRef) {
    return { outcome: "denied", reason: "approved_policy_not_resolved", evaluatedAt };
  }
  let grant: FundsBundleShareGrant | undefined;
  try {
    grant = context.resolveGrant(request.grantId);
  } catch {
    return { outcome: "denied", reason: "grant_not_resolved", evaluatedAt };
  }
  if (!grant) return { outcome: "denied", reason: "grant_not_resolved", evaluatedAt };
  if (grant.grantId !== request.grantId || grant.bundleId !== request.bundleId ||
      grant.granteeId !== context.authenticatedGranteeId) {
    return { outcome: "denied", reason: "grant_reference_mismatch", evaluatedAt };
  }

  let bundleEvidence: ReturnType<TrustedFundsDecisionSources["resolveBundleEvidence"]>;
  try {
    bundleEvidence = context.resolveBundleEvidence(request.bundleId);
  } catch {
    return { outcome: "denied", reason: "bundle_evidence_not_resolved", evaluatedAt };
  }
  if (!bundleEvidence) {
    return { outcome: "denied", reason: "bundle_evidence_not_resolved", evaluatedAt };
  }

  let decision: FundsEvidenceBundleDecision;
  try {
    decision = decideFundsEvidenceBundle(
      {
        policy: approvedPolicy.policy,
        approvedPolicyDigest: approvedPolicy.approvedPolicyDigest,
        approvedPolicyDigests: [approvedPolicy.approvedPolicyDigest],
        reviewedScopes: approvedPolicy.reviewedScopes,
        trustDomain: approvedPolicy.trustDomain,
        maxObservationSkewSeconds: approvedPolicy.maxObservationSkewSeconds,
        disclosure: {
          audience: "counterparty",
          granteeId: context.authenticatedGranteeId,
          grant
        }
      },
      bundleEvidence.eventStreams,
      bundleEvidence.claimEvidence,
      evaluatedAt
    );
  } catch {
    return { outcome: "denied", reason: "funds_decision_failed", evaluatedAt };
  }

  if (decision.selectedBundleId !== request.bundleId) {
    return {
      outcome: "denied",
      reason: "bundle_lineage_mismatch",
      evaluatedAt,
      decision
    };
  }
  if (decision.overall !== "satisfied" || !decision.disclosureAllowed) {
    return { outcome: "denied", reason: "funds_decision_failed", evaluatedAt, decision };
  }
  return {
    outcome: "allowed",
    reason: "trusted_context_decision_allowed",
    evaluatedAt,
    decision
  };
}
