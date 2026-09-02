import assert from "node:assert/strict";

import {
  effectiveClaimStatus,
  validateVerificationClaim,
  validateVerificationReceipt
} from "../../lib/verification/claim-evidence-contract.ts";

const claim = {
  id: "claim_bank_owner_01",
  subjectId: "member_01",
  type: "bank_account_ownership_matched",
  scope: "connected_account_ending_1234",
  purpose: "payment_risk",
  consent: {
    basis: "affirmative_consent",
    capturedAt: "2026-08-13T14:00:00Z",
    version: "bank-link-v1",
    evidenceRef: "consent:bank-link:01"
  },
  provenance: {
    sourceKind: "provider",
    sourceId: "provider-neutral-bank-source",
    method: "account-owner-match",
    evidenceRef: "provider-result:opaque-01"
  },
  evaluation: "satisfied",
  observedAt: "2026-08-13T14:01:00Z",
  expiresAt: "2026-09-12T14:01:00Z"
};

assert.deepEqual(validateVerificationClaim(claim), []);
assert.equal(effectiveClaimStatus(claim, "2026-08-13T14:02:00Z"), "satisfied");
assert.equal(effectiveClaimStatus(claim, "2026-09-12T14:01:00Z"), "expired");
assert.equal(
  effectiveClaimStatus(
    { ...claim, dispute: { status: "open", openedAt: "2026-08-14T00:00:00Z", disputeRef: "case:1" } },
    "2026-08-14T00:00:01Z"
  ),
  "disputed"
);
assert.equal(
  effectiveClaimStatus(
    {
      ...claim,
      dispute: {
        status: "resolved",
        openedAt: "2026-08-14T00:00:00Z",
        disputeRef: "case:1",
        resolvedAt: "2026-08-14T01:00:00Z",
        resolutionRef: "case:1:resolution",
        disposition: "claim_restored"
      }
    },
    "2026-08-14T01:00:01Z"
  ),
  "satisfied"
);
assert.equal(
  effectiveClaimStatus(
    {
      ...claim,
      dispute: { status: "open", openedAt: "2026-08-14T00:00:00Z", disputeRef: "case:1" },
      revokedAt: "2026-08-15T00:00:00Z",
      revocationReason: "source withdrew evidence"
    },
    "2026-08-15T00:00:01Z"
  ),
  "revoked"
);

const invalidClaim = {
  ...claim,
  expiresAt: claim.observedAt,
  consent: { ...claim.consent, capturedAt: "2026-08-13T15:00:00Z" },
  revokedAt: "2026-08-14T00:00:00Z"
};
assert.deepEqual(
  validateVerificationClaim(invalidClaim).map((issue) => issue.code).sort(),
  ["must_follow_observed_at", "must_not_follow_observation", "required"]
);

const receipt = {
  id: "receipt_01",
  claimId: claim.id,
  subjectId: claim.subjectId,
  purpose: claim.purpose,
  type: claim.type,
  scope: claim.scope,
  recordedAt: "2026-08-16T00:00:00Z",
  events: [
    {
      kind: "observed",
      at: claim.observedAt,
      evaluation: claim.evaluation,
      evidenceRef: claim.provenance.evidenceRef
    },
    { kind: "disputed", at: "2026-08-14T00:00:00Z", disputeRef: "case:1" },
    {
      kind: "dispute_resolved",
      at: "2026-08-15T00:00:00Z",
      resolutionRef: "case:1:resolution",
      disposition: "claim_restored"
    },
    { kind: "revoked", at: "2026-08-16T00:00:00Z", reason: "source withdrew evidence" }
  ]
};
const receiptClaim = {
  ...claim,
  dispute: {
    status: "resolved",
    openedAt: "2026-08-14T00:00:00Z",
    disputeRef: "case:1",
    resolvedAt: "2026-08-15T00:00:00Z",
    resolutionRef: "case:1:resolution",
    disposition: "claim_restored"
  },
  revokedAt: "2026-08-16T00:00:00Z",
  revocationReason: "source withdrew evidence"
};
assert.deepEqual(validateVerificationReceipt(receipt, receiptClaim), []);

const invalidReceipt = {
  ...receipt,
  events: [
    {
      kind: "dispute_resolved",
      at: "2026-08-15T00:00:00Z",
      resolutionRef: "case:none",
      disposition: "claim_restored"
    },
    { kind: "revoked", at: "2026-08-14T00:00:00Z", reason: "withdrawn" },
    { kind: "disputed", at: "2026-08-16T00:00:00Z", disputeRef: "case:late" }
  ]
};
assert.deepEqual(
  validateVerificationReceipt(invalidReceipt, claim).map((issue) => issue.code).sort(),
  ["claim_lifecycle_mismatch", "event_after_revocation", "must_begin_with_observed", "no_open_dispute", "out_of_order"]
);

const mismatchedReceipt = {
  ...receipt,
  events: [
    {
      kind: "observed",
      at: "2026-08-13T14:01:01Z",
      evaluation: "inconclusive",
      evidenceRef: "provider-result:wrong"
    }
  ]
};
assert.deepEqual(
  validateVerificationReceipt(mismatchedReceipt, claim).map((issue) => issue.code).sort(),
  ["claim_lifecycle_mismatch", "evaluation_mismatch", "evidence_mismatch", "observation_time_mismatch"]
);

const runtimeInvalid = {
  ...claim,
  type: "person_verified",
  purpose: "global_trust",
  evaluation: "safe",
  provenance: { ...claim.provenance, sourceKind: "magic" }
};
assert.deepEqual(
  validateVerificationClaim(runtimeInvalid).map((issue) => issue.code),
  ["unknown_enum", "unknown_enum", "unknown_enum", "unknown_enum"]
);
assert.throws(
  () => effectiveClaimStatus(runtimeInvalid, "2026-08-13T14:02:00Z"),
  /must satisfy the verification contract/
);

const notRestored = {
  ...claim,
  dispute: {
    status: "resolved",
    openedAt: "2026-08-14T00:00:00Z",
    disputeRef: "case:2",
    resolvedAt: "2026-08-14T01:00:00Z",
    resolutionRef: "case:2:resolution",
    disposition: "claim_not_restored"
  }
};
assert.equal(effectiveClaimStatus(notRestored, "2026-08-14T01:00:01Z"), "inconclusive");

assert.deepEqual(
  validateVerificationClaim({
    ...claim,
    revokedAt: "2026-08-14T00:30:00Z",
    revocationReason: "withdrawn",
    dispute: {
      status: "resolved",
      openedAt: "2026-08-14T00:00:00Z",
      disputeRef: "case:3",
      resolvedAt: "2026-08-14T01:00:00Z",
      resolutionRef: "case:3:resolution",
      disposition: "claim_restored"
    }
  }).map((issue) => issue.code),
  ["must_not_follow_revocation"]
);

console.log("Verification claim/evidence/receipt contract: PASS");
