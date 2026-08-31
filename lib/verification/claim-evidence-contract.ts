export const VERIFICATION_CLAIM_TYPES = [
  "government_id_document_authentic",
  "selfie_matches_government_id",
  "contact_channel_possession_confirmed",
  "bank_account_ownership_matched",
  "funds_threshold_observed",
  "background_screening_completed",
  "role_credential_current",
  "network_attestation_recorded"
] as const;

export type VerificationClaimType = (typeof VERIFICATION_CLAIM_TYPES)[number];

export const VERIFICATION_PURPOSES = [
  "account_security",
  "marketplace_eligibility",
  "payment_risk",
  "role_eligibility",
  "employment_screening",
  "network_reputation"
] as const;

export type VerificationPurpose = (typeof VERIFICATION_PURPOSES)[number];

export type ClaimEvaluation =
  | "pending"
  | "satisfied"
  | "not_satisfied"
  | "inconclusive";

export type EffectiveClaimStatus =
  | ClaimEvaluation
  | "expired"
  | "revoked"
  | "disputed";

export type ConsentRecord =
  | {
      basis: "affirmative_consent";
      capturedAt: string;
      version: string;
      evidenceRef: string;
    }
  | {
      basis: "not_required";
      rationale: string;
    };

export interface EvidenceProvenance {
  sourceKind: "provider" | "issuer" | "member" | "werkles";
  sourceId: string;
  method: string;
  evidenceRef: string;
}

export interface VerificationClaim {
  id: string;
  subjectId: string;
  type: VerificationClaimType;
  scope: string;
  purpose: VerificationPurpose;
  consent: ConsentRecord;
  provenance: EvidenceProvenance;
  evaluation: ClaimEvaluation;
  observedAt: string;
  expiresAt: string;
  revokedAt?: string;
  revocationReason?: string;
  dispute?:
    | { status: "open"; openedAt: string; disputeRef: string }
    | {
        status: "resolved";
        openedAt: string;
        disputeRef: string;
        resolvedAt: string;
        resolutionRef: string;
        disposition: "claim_restored" | "claim_not_restored";
      };
}

export type ClaimReceiptEvent =
  | {
      kind: "observed";
      at: string;
      evaluation: ClaimEvaluation;
      evidenceRef: string;
    }
  | { kind: "revoked"; at: string; reason: string }
  | { kind: "disputed"; at: string; disputeRef: string }
  | {
      kind: "dispute_resolved";
      at: string;
      resolutionRef: string;
      disposition: "claim_restored" | "claim_not_restored";
    };

export interface VerificationReceipt {
  id: string;
  claimId: string;
  subjectId: string;
  purpose: VerificationPurpose;
  type: VerificationClaimType;
  scope: string;
  recordedAt: string;
  events: readonly ClaimReceiptEvent[];
}

export interface ContractIssue {
  path: string;
  code: string;
}

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function validInstant(value: string): boolean {
  return ISO_INSTANT.test(value) && !Number.isNaN(Date.parse(value));
}

function requireText(
  issues: ContractIssue[],
  path: string,
  value: string | undefined
): void {
  if (!value?.trim()) issues.push({ path, code: "required" });
}

function isMember(value: string, allowed: readonly string[]): boolean {
  return allowed.includes(value);
}

export function effectiveClaimStatus(
  claim: VerificationClaim,
  at: string
): EffectiveClaimStatus {
  if (!validInstant(at)) throw new TypeError("at must be an ISO-8601 UTC instant");
  const issues = validateVerificationClaim(claim);
  if (issues.length > 0) throw new TypeError("claim must satisfy the verification contract");
  if (claim.revokedAt && Date.parse(claim.revokedAt) <= Date.parse(at)) return "revoked";
  if (claim.dispute && Date.parse(claim.dispute.openedAt) <= Date.parse(at)) {
    if (
      claim.dispute.status === "open" ||
      Date.parse(claim.dispute.resolvedAt) > Date.parse(at)
    ) return "disputed";
    if (claim.dispute.disposition !== "claim_restored") return "inconclusive";
  }
  if (Date.parse(claim.expiresAt) <= Date.parse(at)) return "expired";
  return claim.evaluation;
}

export function validateVerificationClaim(claim: VerificationClaim): ContractIssue[] {
  const issues: ContractIssue[] = [];
  requireText(issues, "id", claim.id);
  requireText(issues, "subjectId", claim.subjectId);
  requireText(issues, "scope", claim.scope);
  if (!isMember(claim.type, VERIFICATION_CLAIM_TYPES)) issues.push({ path: "type", code: "unknown_enum" });
  if (!isMember(claim.purpose, VERIFICATION_PURPOSES)) issues.push({ path: "purpose", code: "unknown_enum" });
  if (!isMember(claim.evaluation, ["pending", "satisfied", "not_satisfied", "inconclusive"])) {
    issues.push({ path: "evaluation", code: "unknown_enum" });
  }
  if (!isMember(claim.provenance.sourceKind, ["provider", "issuer", "member", "werkles"])) {
    issues.push({ path: "provenance.sourceKind", code: "unknown_enum" });
  }
  requireText(issues, "provenance.sourceId", claim.provenance.sourceId);
  requireText(issues, "provenance.method", claim.provenance.method);
  requireText(issues, "provenance.evidenceRef", claim.provenance.evidenceRef);

  if (!validInstant(claim.observedAt)) issues.push({ path: "observedAt", code: "invalid_instant" });
  if (!validInstant(claim.expiresAt)) issues.push({ path: "expiresAt", code: "invalid_instant" });
  if (
    validInstant(claim.observedAt) &&
    validInstant(claim.expiresAt) &&
    Date.parse(claim.expiresAt) <= Date.parse(claim.observedAt)
  ) {
    issues.push({ path: "expiresAt", code: "must_follow_observed_at" });
  }

  if (claim.consent.basis === "affirmative_consent") {
    requireText(issues, "consent.version", claim.consent.version);
    requireText(issues, "consent.evidenceRef", claim.consent.evidenceRef);
    if (!validInstant(claim.consent.capturedAt)) {
      issues.push({ path: "consent.capturedAt", code: "invalid_instant" });
    } else if (
      validInstant(claim.observedAt) &&
      Date.parse(claim.consent.capturedAt) > Date.parse(claim.observedAt)
    ) {
      issues.push({ path: "consent.capturedAt", code: "must_not_follow_observation" });
    }
  } else {
    requireText(issues, "consent.rationale", claim.consent.rationale);
  }

  if (claim.revokedAt) {
    if (!validInstant(claim.revokedAt)) issues.push({ path: "revokedAt", code: "invalid_instant" });
    requireText(issues, "revocationReason", claim.revocationReason);
    if (
      validInstant(claim.revokedAt) &&
      validInstant(claim.observedAt) &&
      Date.parse(claim.revokedAt) < Date.parse(claim.observedAt)
    ) issues.push({ path: "revokedAt", code: "must_not_precede_observation" });
  } else if (claim.revocationReason) {
    issues.push({ path: "revocationReason", code: "requires_revoked_at" });
  }

  if (claim.dispute) {
    requireText(issues, "dispute.disputeRef", claim.dispute.disputeRef);
    if (!validInstant(claim.dispute.openedAt)) {
      issues.push({ path: "dispute.openedAt", code: "invalid_instant" });
    } else if (
      validInstant(claim.observedAt) &&
      Date.parse(claim.dispute.openedAt) < Date.parse(claim.observedAt)
    ) {
      issues.push({ path: "dispute.openedAt", code: "must_not_precede_observation" });
    }
    if (claim.dispute.status === "resolved") {
      requireText(issues, "dispute.resolutionRef", claim.dispute.resolutionRef);
      if (!validInstant(claim.dispute.resolvedAt)) {
        issues.push({ path: "dispute.resolvedAt", code: "invalid_instant" });
      } else if (
        validInstant(claim.dispute.openedAt) &&
        Date.parse(claim.dispute.resolvedAt) < Date.parse(claim.dispute.openedAt)
      ) {
        issues.push({ path: "dispute.resolvedAt", code: "must_not_precede_open" });
      }
      if (!isMember(claim.dispute.disposition, ["claim_restored", "claim_not_restored"])) {
        issues.push({ path: "dispute.disposition", code: "unknown_enum" });
      }
    }
    if (
      claim.revokedAt &&
      validInstant(claim.revokedAt) &&
      validInstant(claim.dispute.openedAt) &&
      Date.parse(claim.dispute.openedAt) > Date.parse(claim.revokedAt)
    ) {
      issues.push({ path: "dispute.openedAt", code: "must_not_follow_revocation" });
    }
    if (
      claim.revokedAt &&
      claim.dispute.status === "resolved" &&
      validInstant(claim.revokedAt) &&
      validInstant(claim.dispute.resolvedAt) &&
      Date.parse(claim.dispute.resolvedAt) > Date.parse(claim.revokedAt)
    ) {
      issues.push({ path: "dispute.resolvedAt", code: "must_not_follow_revocation" });
    }
  }

  return issues;
}

export function validateVerificationReceipt(
  receipt: VerificationReceipt,
  claim: VerificationClaim
): ContractIssue[] {
  const issues: ContractIssue[] = [];
  requireText(issues, "id", receipt.id);
  if (receipt.claimId !== claim.id) issues.push({ path: "claimId", code: "claim_mismatch" });
  if (receipt.subjectId !== claim.subjectId) issues.push({ path: "subjectId", code: "subject_mismatch" });
  if (receipt.purpose !== claim.purpose) issues.push({ path: "purpose", code: "purpose_mismatch" });
  if (receipt.type !== claim.type) issues.push({ path: "type", code: "type_mismatch" });
  if (receipt.scope !== claim.scope) issues.push({ path: "scope", code: "scope_mismatch" });
  if (!validInstant(receipt.recordedAt)) issues.push({ path: "recordedAt", code: "invalid_instant" });
  if (receipt.events.length === 0 || receipt.events[0]?.kind !== "observed") {
    issues.push({ path: "events", code: "must_begin_with_observed" });
  }

  let previousAt = Number.NEGATIVE_INFINITY;
  let revoked = false;
  let disputed = false;

  receipt.events.forEach((event, index) => {
    const path = `events.${index}`;
    if (!validInstant(event.at)) {
      issues.push({ path: `${path}.at`, code: "invalid_instant" });
      return;
    }
    const eventAt = Date.parse(event.at);
    if (eventAt < previousAt) issues.push({ path: `${path}.at`, code: "out_of_order" });
    previousAt = eventAt;
    if (validInstant(receipt.recordedAt) && eventAt > Date.parse(receipt.recordedAt)) {
      issues.push({ path: `${path}.at`, code: "must_not_follow_recorded_at" });
    }

    if (revoked) issues.push({ path, code: "event_after_revocation" });
    if (event.kind === "observed") {
      requireText(issues, `${path}.evidenceRef`, event.evidenceRef);
      if (index > 0) issues.push({ path, code: "observation_must_be_first" });
      if (index === 0 && event.at !== claim.observedAt) {
        issues.push({ path: `${path}.at`, code: "observation_time_mismatch" });
      }
      if (index === 0 && event.evaluation !== claim.evaluation) {
        issues.push({ path: `${path}.evaluation`, code: "evaluation_mismatch" });
      }
      if (index === 0 && event.evidenceRef !== claim.provenance.evidenceRef) {
        issues.push({ path: `${path}.evidenceRef`, code: "evidence_mismatch" });
      }
    } else if (event.kind === "revoked") {
      requireText(issues, `${path}.reason`, event.reason);
      revoked = true;
    } else if (event.kind === "disputed") {
      requireText(issues, `${path}.disputeRef`, event.disputeRef);
      if (disputed) issues.push({ path, code: "already_disputed" });
      disputed = true;
    } else {
      requireText(issues, `${path}.resolutionRef`, event.resolutionRef);
      if (!isMember(event.disposition, ["claim_restored", "claim_not_restored"])) {
        issues.push({ path: `${path}.disposition`, code: "unknown_enum" });
      }
      if (!disputed) issues.push({ path, code: "no_open_dispute" });
      disputed = false;
    }
  });

  const expectedLifecycle: ClaimReceiptEvent[] = [
    {
      kind: "observed",
      at: claim.observedAt,
      evaluation: claim.evaluation,
      evidenceRef: claim.provenance.evidenceRef
    }
  ];
  if (claim.dispute) {
    expectedLifecycle.push({
      kind: "disputed",
      at: claim.dispute.openedAt,
      disputeRef: claim.dispute.disputeRef
    });
    if (claim.dispute.status === "resolved") {
      expectedLifecycle.push({
        kind: "dispute_resolved",
        at: claim.dispute.resolvedAt,
        resolutionRef: claim.dispute.resolutionRef,
        disposition: claim.dispute.disposition
      });
    }
  }
  if (claim.revokedAt) {
    expectedLifecycle.push({
      kind: "revoked",
      at: claim.revokedAt,
      reason: claim.revocationReason ?? ""
    });
  }
  if (JSON.stringify(receipt.events) !== JSON.stringify(expectedLifecycle)) {
    issues.push({ path: "events", code: "claim_lifecycle_mismatch" });
  }

  return issues;
}
