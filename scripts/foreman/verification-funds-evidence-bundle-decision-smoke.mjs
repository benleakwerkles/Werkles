import assert from "node:assert/strict";

import { applyFundsEvidenceBundleCommand } from "../../lib/verification/funds-evidence-bundle.ts";
import { decideFundsEvidenceBundle } from "../../lib/verification/funds-evidence-bundle-decision.ts";
import { memberFundsEvidenceReadout } from "../../lib/verification/funds-evidence-bundle-readout.ts";

const D = {
  policy: `sha256:${"1".repeat(64)}`,
  review: `sha256:${"2".repeat(64)}`,
  ownership: `sha256:${"3".repeat(64)}`,
  threshold: `sha256:${"4".repeat(64)}`
};
const evaluatedAt = "2026-08-14T15:00:00Z";
const scopes = {
  reviewDigest: D.review,
  bankAccountOwnership: "bank-owner:connected-account:v1",
  fundsThreshold: "funds-threshold:usd-50000:v1"
};
const trustDomain = { evidenceClass: "production", key: "funds-evidence:v1" };
const policy = {
  policyId: "funds-proof-v1",
  subjectId: "member_01",
  purpose: "payment_risk",
  reviewedScopes: {
    reviewRef: "review:funds-proof:v1",
    bankAccountOwnership: scopes.bankAccountOwnership,
    fundsThreshold: scopes.fundsThreshold
  }
};
const requirement = {
  policy,
  approvedPolicyDigest: D.policy,
  approvedPolicyDigests: [D.policy],
  reviewedScopes: scopes,
  trustDomain,
  maxObservationSkewSeconds: 300,
  disclosure: { audience: "member" }
};

function claim(type, scope, id, observedAt, overrides = {}) {
  return {
    id,
    subjectId: policy.subjectId,
    purpose: policy.purpose,
    type,
    scope,
    consent: {
      basis: "affirmative_consent",
      capturedAt: "2026-08-14T13:00:00Z",
      version: "funds-proof-consent-v1",
      evidenceRef: `consent:${id}`
    },
    provenance: {
      sourceKind: "issuer",
      sourceId: "source-hidden-from-readout",
      method: type,
      evidenceRef: `evidence:${id}`
    },
    evaluation: "satisfied",
    observedAt,
    expiresAt: "2026-09-14T13:00:00Z",
    ...overrides
  };
}

const ownershipClaim = claim(
  "bank_account_ownership_matched",
  scopes.bankAccountOwnership,
  "claim:ownership:1",
  "2026-08-14T13:01:00Z"
);
const thresholdClaim = claim(
  "funds_threshold_observed",
  scopes.fundsThreshold,
  "claim:threshold:1",
  "2026-08-14T13:03:00Z"
);
const evidence = [
  { claim: ownershipClaim, contentDigest: D.ownership, limitations: ["Ownership does not establish account safety."] },
  { claim: thresholdClaim, contentDigest: D.threshold, limitations: ["A dated threshold is not a current balance."] }
];

function commandBase(bundleId, commandId, expectedVersion, serverOrder, occurredAt) {
  return {
    bundleId,
    commandId,
    commandDigest: `sha256:${serverOrder.padStart(64, "0")}`,
    expectedVersion,
    serverOrder,
    occurredAt
  };
}

function bundle({
  bundleId,
  assemblyOrder,
  status = "sealed",
  domain = trustDomain,
  policyDigest = D.policy
}) {
  let events = [];
  const apply = (command) => {
    events = applyFundsEvidenceBundleCommand(events, command).events;
  };
  const n = BigInt(assemblyOrder);
  apply({
    ...commandBase(bundleId, `${bundleId}:create`, 0, String(n), "2026-08-14T13:00:00Z"),
    kind: "create",
    subjectId: policy.subjectId,
    purpose: policy.purpose,
    approvedPolicyDigest: policyDigest,
    reviewedScopes: scopes,
    trustDomain: domain
  });
  apply({
    ...commandBase(bundleId, `${bundleId}:ownership`, 1, String(n + 1n), "2026-08-14T13:01:00Z"),
    kind: "attach_claim",
    membership: {
      role: "bankAccountOwnership",
      claimId: ownershipClaim.id,
      claimDigest: D.ownership,
      claimType: ownershipClaim.type,
      scope: ownershipClaim.scope,
      subjectId: ownershipClaim.subjectId,
      purpose: ownershipClaim.purpose,
      trustDomain: domain
    }
  });
  apply({
    ...commandBase(bundleId, `${bundleId}:threshold`, 2, String(n + 2n), "2026-08-14T13:03:00Z"),
    kind: "attach_claim",
    membership: {
      role: "fundsThreshold",
      claimId: thresholdClaim.id,
      claimDigest: D.threshold,
      claimType: thresholdClaim.type,
      scope: thresholdClaim.scope,
      subjectId: thresholdClaim.subjectId,
      purpose: thresholdClaim.purpose,
      trustDomain: domain
    }
  });
  if (status !== "open") {
    apply({
      ...commandBase(bundleId, `${bundleId}:seal`, 3, String(n + 3n), "2026-08-14T13:04:00Z"),
      kind: "seal"
    });
  }
  if (status === "revoked") {
    apply({
      ...commandBase(bundleId, `${bundleId}:revoke`, 4, String(n + 4n), "2026-08-14T14:00:00Z"),
      kind: "revoke",
      reason: "assembly integrity withdrawn"
    });
  }
  return events;
}

const sealed = bundle({ bundleId: "bundle:sealed", assemblyOrder: "1" });
const satisfied = decideFundsEvidenceBundle(requirement, [sealed], evidence, evaluatedAt);
assert.equal(satisfied.overall, "satisfied");
assert.equal(satisfied.reason, "bundle_satisfied");
assert.equal(satisfied.components.bankAccountOwnership.reason, "claim_satisfied");
assert.equal(satisfied.components.fundsThreshold.reason, "claim_satisfied");
assert.deepEqual(satisfied.limitations, [
  "Ownership does not establish account safety.",
  "A dated threshold is not a current balance."
]);

// Selection happens across every state. A newer incomplete or revoked assembly
// blocks reuse of the older favorable one.
const newerOpen = bundle({ bundleId: "bundle:newer-open", assemblyOrder: "20", status: "open" });
assert.equal(
  decideFundsEvidenceBundle(requirement, [sealed, newerOpen], evidence, evaluatedAt).reason,
  "newest_bundle_open"
);
const newerRevoked = bundle({ bundleId: "bundle:newer-revoked", assemblyOrder: "30", status: "revoked" });
assert.equal(
  decideFundsEvidenceBundle(requirement, [sealed, newerRevoked], evidence, evaluatedAt).reason,
  "newest_bundle_revoked"
);

const equalNewest = bundle({ bundleId: "bundle:equal", assemblyOrder: "1" });
assert.equal(
  decideFundsEvidenceBundle(requirement, [sealed, equalNewest], evidence, evaluatedAt).reason,
  "ambiguous_newest_assembly"
);

assert.equal(
  decideFundsEvidenceBundle(requirement, [sealed], [
    evidence[0],
    { ...evidence[1], contentDigest: `sha256:${"9".repeat(64)}` }
  ], evaluatedAt).reason,
  "claim_digest_mismatch"
);

const testDomainBundle = bundle({
  bundleId: "bundle:test-domain",
  assemblyOrder: "40",
  domain: { evidenceClass: "test", key: trustDomain.key }
});
assert.equal(
  decideFundsEvidenceBundle(requirement, [testDomainBundle], evidence, evaluatedAt).reason,
  "no_exact_lineage_bundle"
);

const testRequirement = {
  ...requirement,
  trustDomain: { evidenceClass: "test", key: trustDomain.key }
};
const testMemberDecision = decideFundsEvidenceBundle(
  testRequirement,
  [testDomainBundle],
  evidence,
  evaluatedAt
);
assert.equal(testMemberDecision.overall, "satisfied");
const testReadout = memberFundsEvidenceReadout(testMemberDecision);
assert.match(testReadout.heading, /Test-only/);
assert.match(testReadout.summary, /not live/);
assert.equal(
  decideFundsEvidenceBundle(
    {
      ...testRequirement,
      disclosure: {
        audience: "counterparty",
        granteeId: "counterparty:1",
        grant: {
          grantId: "grant:test",
          bundleId: "bundle:test-domain",
          subjectId: policy.subjectId,
          granteeId: "counterparty:1",
          purpose: policy.purpose,
          state: "active",
          grantedAt: "2026-08-14T14:00:00Z",
          expiresAt: "2026-08-15T14:00:00Z"
        }
      }
    },
    [testDomainBundle],
    evidence,
    evaluatedAt
  ).reason,
  "nonproduction_disclosure_forbidden"
);

assert.equal(
  decideFundsEvidenceBundle(
    { ...requirement, approvedPolicyDigests: [] },
    [sealed],
    evidence,
    evaluatedAt
  ).reason,
  "unapproved_policy_binding"
);

const corruptedMembership = structuredClone(sealed);
corruptedMembership[1].membership.claimType = "funds_threshold_observed";
assert.equal(
  decideFundsEvidenceBundle(requirement, [sealed, corruptedMembership], evidence, evaluatedAt).reason,
  "invalid_lineage_bundle"
);

assert.equal(
  decideFundsEvidenceBundle(
    { ...requirement, maxObservationSkewSeconds: 60 },
    [sealed],
    evidence,
    evaluatedAt
  ).reason,
  "observation_skew_exceeded"
);

const postSealEvidence = [
  evidence[0],
  {
    ...evidence[1],
    claim: {
      ...thresholdClaim,
      consent: {
        ...thresholdClaim.consent,
        capturedAt: "2026-08-14T13:04:01Z"
      },
      observedAt: "2026-08-14T13:04:01Z"
    }
  }
];
assert.equal(
  decideFundsEvidenceBundle(requirement, [sealed], postSealEvidence, evaluatedAt).reason,
  "component_time_incoherent"
);

assert.equal(
  decideFundsEvidenceBundle(requirement, [sealed], [
    evidence[0],
    { ...evidence[1], limitations: ["Provider account ending 1234."] }
  ], evaluatedAt).reason,
  "unapproved_limitation"
);

for (const mutation of [
  { expiresAt: "2026-08-14T14:59:59Z" },
  { dispute: { status: "open", openedAt: "2026-08-14T14:00:00Z", disputeRef: "case:1" } },
  { revokedAt: "2026-08-14T14:00:00Z", revocationReason: "withdrawn" }
]) {
  const failed = decideFundsEvidenceBundle(requirement, [sealed], [
    evidence[0],
    { ...evidence[1], claim: { ...thresholdClaim, ...mutation } }
  ], evaluatedAt);
  assert.equal(failed.reason, "component_claim_failed");
  assert.notEqual(failed.components.fundsThreshold.reason, "claim_satisfied");
  assert.equal(failed.limitations[1], "A dated threshold is not a current balance.");
}

const grant = {
  grantId: "grant:1",
  bundleId: "bundle:sealed",
  subjectId: policy.subjectId,
  granteeId: "counterparty:1",
  purpose: policy.purpose,
  state: "active",
  grantedAt: "2026-08-14T14:00:00Z",
  expiresAt: "2026-08-15T14:00:00Z"
};
const counterparty = (grantValue) => ({
  ...requirement,
  disclosure: { audience: "counterparty", granteeId: "counterparty:1", grant: grantValue }
});
assert.equal(
  decideFundsEvidenceBundle(counterparty(undefined), [sealed], evidence, evaluatedAt).reason,
  "share_grant_missing"
);
assert.equal(
  decideFundsEvidenceBundle(counterparty({ ...grant, bundleId: "bundle:other" }), [sealed], evidence, evaluatedAt).reason,
  "share_grant_wrong_bundle"
);
for (const invalidGrant of [
  { ...grant, granteeId: "counterparty:other" },
  { ...grant, state: "revoked", revokedAt: "2026-08-14T14:30:00Z" },
  { ...grant, expiresAt: "2026-08-14T14:59:59Z" },
  { ...grant, grantedAt: "2026-08-14T15:00:01Z" },
  { ...grant, revokedAt: "not-an-instant" },
  { ...grant, expiresAt: "2026-08-14T13:30:00Z" },
  { ...grant, grantedAt: "2026-08-14T13:03:59Z" },
  {
    ...grant,
    state: "revoked",
    revokedAt: "2026-08-16T14:00:00Z"
  }
]) {
  assert.equal(
    decideFundsEvidenceBundle(counterparty(invalidGrant), [sealed], evidence, evaluatedAt).reason,
    "share_grant_invalid"
  );
}
// Historical audit reconstructs grant effectiveness at evaluatedAt. Live
// disclosure callers must supply trusted current server time, never a client time.
assert.equal(
  decideFundsEvidenceBundle(counterparty({
    ...grant,
    state: "revoked",
    revokedAt: "2026-08-14T15:00:01Z"
  }), [sealed], evidence, evaluatedAt).disclosureAllowed,
  true
);
assert.equal(
  decideFundsEvidenceBundle(counterparty(grant), [sealed], evidence, evaluatedAt).disclosureAllowed,
  true
);

const readout = memberFundsEvidenceReadout(satisfied);
assert.equal(readout.components.length, 2);
assert.match(readout.summary, /both narrow checks/);
const serializedReadout = JSON.stringify(readout);
for (const forbidden of [
  ownershipClaim.provenance.sourceId,
  ownershipClaim.provenance.evidenceRef,
  ownershipClaim.id,
  "bundle:sealed",
  "safe member",
  "verified member",
  "account balance"
]) {
  assert.equal(serializedReadout.includes(forbidden), false, `readout leaked: ${forbidden}`);
}

console.log("Verification funds evidence-bundle decision/readout: PASS");
