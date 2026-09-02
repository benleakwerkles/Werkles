import assert from "node:assert/strict";

import { evaluateFundsProofPolicy } from "../../lib/verification/funds-proof-policy.ts";

const evaluatedAt = "2026-08-14T15:00:00Z";
const policy = {
  policyId: "funds-proof-v1",
  subjectId: "member_01",
  purpose: "payment_risk",
  reviewedScopes: {
    reviewRef: "review:funds-proof:v1",
    bankAccountOwnership: "bank-owner:connected-account:v1",
    fundsThreshold: "funds-threshold:usd-50000:v1"
  }
};

function claim(type, scope, overrides = {}) {
  return {
    id: `claim:${type}`,
    subjectId: policy.subjectId,
    purpose: policy.purpose,
    type,
    scope,
    consent: {
      basis: "affirmative_consent",
      capturedAt: "2026-08-14T13:00:00Z",
      version: "funds-proof-consent-v1",
      evidenceRef: `consent:${type}`
    },
    provenance: {
      sourceKind: "issuer",
      sourceId: "financial-data-source",
      method: type,
      evidenceRef: `evidence:${type}`
    },
    evaluation: "satisfied",
    observedAt: "2026-08-14T13:01:00Z",
    expiresAt: "2026-09-13T13:01:00Z",
    ...overrides
  };
}

const ownership = (overrides = {}) =>
  claim("bank_account_ownership_matched", policy.reviewedScopes.bankAccountOwnership, overrides);
const threshold = (overrides = {}) =>
  claim("funds_threshold_observed", policy.reviewedScopes.fundsThreshold, overrides);

const satisfied = evaluateFundsProofPolicy(policy, [ownership(), threshold()], evaluatedAt);
assert.equal(satisfied.overall, "satisfied");
assert.deepEqual(satisfied.failures, []);
assert.equal(satisfied.components.bankAccountOwnership.classification, "satisfied");
assert.equal(satisfied.components.bankAccountOwnership.reason, "claim_satisfied");
assert.equal(satisfied.components.fundsThreshold.classification, "satisfied");
assert.equal(satisfied.components.fundsThreshold.reason, "claim_satisfied");
assert.deepEqual(satisfied.policy, policy);
assert.notEqual(satisfied.policy.reviewedScopes, policy.reviewedScopes);

const bothMissing = evaluateFundsProofPolicy(policy, [], evaluatedAt);
assert.equal(bothMissing.overall, "fail_closed");
assert.deepEqual(bothMissing.failures, [
  {
    component: "bankAccountOwnership",
    classification: "missing",
    reason: "no_matching_claim"
  },
  {
    component: "fundsThreshold",
    classification: "missing",
    reason: "no_matching_claim"
  }
]);

for (const [mutatedThreshold, classification, reason] of [
  [undefined, "missing", "no_matching_claim"],
  [threshold({ evaluation: "pending" }), "missing", "claim_pending"],
  [threshold({ evaluation: "not_satisfied" }), "missing", "claim_not_satisfied"],
  [threshold({ expiresAt: "2026-08-14T14:59:59Z" }), "expired", "claim_expired"],
  [
    threshold({
      dispute: {
        status: "open",
        openedAt: "2026-08-14T14:00:00Z",
        disputeRef: "case:funds:1"
      }
    }),
    "disputed",
    "claim_disputed"
  ],
  [
    threshold({
      revokedAt: "2026-08-14T14:00:00Z",
      revocationReason: "evidence withdrawn"
    }),
    "revoked",
    "claim_revoked"
  ],
  [threshold({ evaluation: "inconclusive" }), "inconclusive", "claim_inconclusive"]
]) {
  const claims = [ownership(), ...(mutatedThreshold ? [mutatedThreshold] : [])];
  const decision = evaluateFundsProofPolicy(policy, claims, evaluatedAt);
  assert.equal(decision.overall, "fail_closed");
  assert.equal(decision.components.bankAccountOwnership.classification, "satisfied");
  assert.equal(decision.components.fundsThreshold.classification, classification);
  assert.equal(decision.components.fundsThreshold.reason, reason);
  assert.deepEqual(decision.failures, [
    { component: "fundsThreshold", classification, reason }
  ]);
}

const futureRestoration = evaluateFundsProofPolicy(
  policy,
  [
    ownership(),
    threshold({
      dispute: {
        status: "resolved",
        openedAt: "2026-08-14T14:00:00Z",
        disputeRef: "case:funds:future-resolution",
        resolvedAt: "2026-08-14T15:00:01Z",
        resolutionRef: "resolution:funds:future",
        disposition: "claim_restored"
      }
    })
  ],
  evaluatedAt
);
assert.equal(futureRestoration.overall, "fail_closed");
assert.equal(futureRestoration.components.fundsThreshold.classification, "disputed");
assert.equal(futureRestoration.components.fundsThreshold.reason, "claim_disputed");

// Cross-subject mixing cannot assemble a satisfied pair.
const crossSubject = evaluateFundsProofPolicy(
  policy,
  [ownership(), threshold({ subjectId: "member_02" })],
  evaluatedAt
);
assert.equal(crossSubject.overall, "fail_closed");
assert.equal(crossSubject.components.fundsThreshold.reason, "no_matching_claim");

// Cross-scope and cross-purpose claims are ignored even when individually satisfied.
for (const attackClaim of [
  threshold({ scope: "funds-threshold:usd-1000:v1" }),
  threshold({ purpose: "marketplace_eligibility" })
]) {
  const decision = evaluateFundsProofPolicy(policy, [ownership(), attackClaim], evaluatedAt);
  assert.equal(decision.overall, "fail_closed");
  assert.equal(decision.components.fundsThreshold.classification, "missing");
  assert.equal(decision.components.fundsThreshold.reason, "no_matching_claim");
}

// A correct threshold cannot substitute for a wrong-subject ownership claim.
const ownershipMix = evaluateFundsProofPolicy(
  policy,
  [ownership({ subjectId: "member_02" }), threshold()],
  evaluatedAt
);
assert.equal(ownershipMix.overall, "fail_closed");
assert.equal(ownershipMix.components.bankAccountOwnership.reason, "no_matching_claim");

// A same-instant second threshold claim cannot use its id to choose which
// result becomes effective.
const ambiguousThreshold = evaluateFundsProofPolicy(
  policy,
  [
    ownership(),
    threshold({ id: "claim:threshold:b" }),
    threshold({ id: "claim:threshold:a", evaluation: "inconclusive" })
  ],
  evaluatedAt
);
assert.equal(ambiguousThreshold.overall, "fail_closed");
assert.equal(
  ambiguousThreshold.components.fundsThreshold.reason,
  "ambiguous_newest_claim"
);

// A claim observed after the decision instant cannot satisfy the policy early.
const futureThreshold = evaluateFundsProofPolicy(
  policy,
  [
    ownership(),
    threshold({
      consent: {
        basis: "affirmative_consent",
        capturedAt: "2026-08-14T15:00:01Z",
        version: "funds-proof-consent-v1",
        evidenceRef: "consent:future-threshold"
      },
      observedAt: "2026-08-14T15:00:01Z",
      expiresAt: "2026-09-13T15:00:01Z"
    })
  ],
  evaluatedAt
);
assert.equal(futureThreshold.overall, "fail_closed");
assert.equal(futureThreshold.components.fundsThreshold.reason, "invalid_matching_claim");

for (const [invalidPolicy, expected] of [
  [null, /policy must be an object/],
  [{ ...policy, policyId: " " }, /policyId/],
  [{ ...policy, subjectId: "" }, /subjectId/],
  [{ ...policy, reviewedScopes: null }, /reviewedScopes must be an object/],
  [{ ...policy, purpose: "global_trust" }, /known verification purpose/],
  [{ ...policy, reviewedScopes: { ...policy.reviewedScopes, reviewRef: "" } }, /reviewRef/],
  [
    {
      ...policy,
      reviewedScopes: {
        ...policy.reviewedScopes,
        fundsThreshold: policy.reviewedScopes.bankAccountOwnership
      }
    },
    /separate reviewed scope keys/
  ]
]) {
  assert.throws(() => evaluateFundsProofPolicy(invalidPolicy, [], evaluatedAt), expected);
}
assert.throws(
  () => evaluateFundsProofPolicy(policy, [], "not-an-instant"),
  /evaluatedAt must be an ISO-8601 UTC instant/
);
assert.throws(
  () => evaluateFundsProofPolicy(policy, null, evaluatedAt),
  /claims must be an array/
);

console.log("Verification funds-proof policy: PASS");
