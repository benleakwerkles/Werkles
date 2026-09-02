import assert from "node:assert/strict";

import { decideClaim } from "../../lib/verification/claim-decision-engine.ts";

const evaluatedAt = "2026-08-13T16:00:00Z";
const requirement = {
  subjectId: "member_01",
  purpose: "payment_risk",
  type: "bank_account_ownership_matched",
  scope: "connected_account_ending_1234"
};

function claim(overrides = {}) {
  return {
    id: "claim_01",
    ...requirement,
    consent: {
      basis: "affirmative_consent",
      capturedAt: "2026-08-13T14:00:00Z",
      version: "bank-link-v1",
      evidenceRef: "consent:01"
    },
    provenance: {
      sourceKind: "provider",
      sourceId: "provider-neutral-bank-source",
      method: "account-owner-match",
      evidenceRef: "result:01"
    },
    evaluation: "satisfied",
    observedAt: "2026-08-13T14:01:00Z",
    expiresAt: "2026-09-12T14:01:00Z",
    ...overrides
  };
}

function expectDecision(claims, classification, reason, selectedClaimId) {
  const decision = decideClaim(requirement, claims, evaluatedAt);
  assert.equal(decision.classification, classification);
  assert.equal(decision.reason, reason);
  assert.equal(decision.selectedClaimId, selectedClaimId);
  assert.deepEqual(decision.binding, requirement);
  assert.deepEqual(
    Object.keys(decision).sort(),
    ["binding", "classification", "evaluatedAt", "issues", "reason", ...(selectedClaimId ? ["selectedClaimId"] : [])].sort()
  );
  return decision;
}

expectDecision([claim()], "satisfied", "claim_satisfied", "claim_01");
expectDecision([], "missing", "no_matching_claim", undefined);
expectDecision([claim({ evaluation: "pending" })], "missing", "claim_pending", "claim_01");
expectDecision(
  [claim({ evaluation: "not_satisfied" })],
  "missing",
  "claim_not_satisfied",
  "claim_01"
);
expectDecision(
  [claim({ expiresAt: "2026-08-13T15:59:59Z" })],
  "expired",
  "claim_expired",
  "claim_01"
);
expectDecision(
  [
    claim({
      dispute: {
        status: "open",
        openedAt: "2026-08-13T15:00:00Z",
        disputeRef: "case:01"
      }
    })
  ],
  "disputed",
  "claim_disputed",
  "claim_01"
);
expectDecision(
  [
    claim({
      revokedAt: "2026-08-13T15:00:00Z",
      revocationReason: "source withdrew evidence"
    })
  ],
  "revoked",
  "claim_revoked",
  "claim_01"
);
expectDecision(
  [claim({ evaluation: "inconclusive" })],
  "inconclusive",
  "claim_inconclusive",
  "claim_01"
);

// A stored future resolution does not restore a claim before resolvedAt.
expectDecision(
  [
    claim({
      dispute: {
        status: "resolved",
        openedAt: "2026-08-13T15:00:00Z",
        disputeRef: "case:future-resolution",
        resolvedAt: "2026-08-13T16:00:01Z",
        resolutionRef: "resolution:future",
        disposition: "claim_restored"
      }
    })
  ],
  "disputed",
  "claim_disputed",
  "claim_01"
);

// Every binding dimension is mandatory: near matches are missing.
for (const mismatch of [
  { subjectId: "member_02" },
  { purpose: "account_security" },
  { type: "funds_threshold_observed" },
  { scope: "connected_account_ending_9876" }
]) {
  expectDecision([claim(mismatch)], "missing", "no_matching_claim", undefined);
}

// Latest observation wins; equal timestamps fail closed instead of allowing an
// attacker-controlled claim id to choose the effective claim.
expectDecision(
  [
    claim({ id: "claim_old", observedAt: "2026-08-13T14:01:00Z", evaluation: "satisfied" }),
    claim({ id: "claim_new", observedAt: "2026-08-13T14:02:00Z", evaluation: "inconclusive" })
  ],
  "inconclusive",
  "claim_inconclusive",
  "claim_new"
);
const ambiguousNewest = expectDecision(
  [claim({ id: "claim_b" }), claim({ id: "claim_a", evaluation: "inconclusive" })],
  "inconclusive",
  "ambiguous_newest_claim",
  undefined
);
assert.deepEqual(ambiguousNewest.issues, [
  { path: "claims", code: "ambiguous_newest_observation" }
]);

const futureObserved = expectDecision(
  [
    claim({
      id: "claim_future",
      consent: {
        basis: "affirmative_consent",
        capturedAt: "2026-08-13T16:00:01Z",
        version: "bank-link-v1",
        evidenceRef: "consent:future"
      },
      observedAt: "2026-08-13T16:00:01Z",
      expiresAt: "2026-09-12T16:00:01Z"
    })
  ],
  "inconclusive",
  "invalid_matching_claim",
  undefined
);
assert.deepEqual(futureObserved.issues, [
  { path: "claims.claim_future.observedAt", code: "must_not_follow_evaluated_at" }
]);

const invalid = expectDecision(
  [claim({ expiresAt: "2026-08-13T14:01:00Z" })],
  "inconclusive",
  "invalid_matching_claim",
  undefined
);
assert.deepEqual(invalid.issues, [
  { path: "claims.claim_01.expiresAt", code: "must_follow_observed_at" }
]);

assert.throws(
  () => decideClaim(requirement, [claim()], "not-an-instant"),
  /evaluatedAt must be an ISO-8601 UTC instant/
);
for (const [invalidRequirement, message] of [
  [{ ...requirement, subjectId: " " }, /subjectId is required/],
  [{ ...requirement, scope: "" }, /scope is required/],
  [{ ...requirement, purpose: "global_trust" }, /known verification purpose/],
  [{ ...requirement, type: "person_verified" }, /known verification claim type/]
]) {
  assert.throws(() => decideClaim(invalidRequirement, [], evaluatedAt), message);
}

console.log("Verification claim decision engine: PASS");
