import assert from "node:assert/strict";

import {
  applyFundsEvidenceBundleCommand,
  assertUnambiguousAssemblyOrdering,
  reconstructFundsEvidenceBundleAt,
  validateFundsEvidenceBundleEvents
} from "../../lib/verification/funds-evidence-bundle.ts";

const digests = {
  policy: `sha256:${"1".repeat(64)}`,
  review: `sha256:${"2".repeat(64)}`,
  ownership: `sha256:${"3".repeat(64)}`,
  threshold: `sha256:${"4".repeat(64)}`,
  create: `sha256:${"a".repeat(64)}`,
  attachOwnership: `sha256:${"b".repeat(64)}`,
  attachThreshold: `sha256:${"c".repeat(64)}`,
  seal: `sha256:${"d".repeat(64)}`,
  revoke: `sha256:${"e".repeat(64)}`
};
const bundleId = "bundle:funds:01";
const subjectId = "member_01";
const purpose = "payment_risk";
const reviewedScopes = {
  reviewDigest: digests.review,
  bankAccountOwnership: "bank-owner:connected-account:v1",
  fundsThreshold: "funds-threshold:usd-50000:v1"
};
const trustDomain = { evidenceClass: "test", key: "sandbox-demonstration:v1" };

let events = [];
const create = {
  kind: "create",
  bundleId,
  commandId: "command:create:01",
  commandDigest: digests.create,
  expectedVersion: 0,
  serverOrder: "100",
  occurredAt: "2026-08-14T15:00:00Z",
  subjectId,
  purpose,
  approvedPolicyDigest: digests.policy,
  reviewedScopes,
  trustDomain
};

let result = applyFundsEvidenceBundleCommand(events, create);
events = result.events;
assert.equal(result.state.status, "open");
assert.equal(result.state.assemblyOrder, "100");
assert.equal(result.state.approvedPolicyDigest, digests.policy);
assert.equal(result.appended, true);
assert.equal(Object.isFrozen(result.state), true);
assert.equal(Object.isFrozen(result.events), true);
assert.equal(Object.isFrozen(result.events[0]), true);
assert.equal(Object.isFrozen(result.events[0].reviewedScopes), true);

const ownershipMembership = {
  role: "bankAccountOwnership",
  claimId: "claim:ownership:01",
  claimDigest: digests.ownership,
  claimType: "bank_account_ownership_matched",
  scope: reviewedScopes.bankAccountOwnership,
  subjectId,
  purpose,
  trustDomain
};
const thresholdMembership = {
  role: "fundsThreshold",
  claimId: "claim:threshold:01",
  claimDigest: digests.threshold,
  claimType: "funds_threshold_observed",
  scope: reviewedScopes.fundsThreshold,
  subjectId,
  purpose,
  trustDomain
};

result = applyFundsEvidenceBundleCommand(events, {
  kind: "attach_claim",
  bundleId,
  commandId: "command:attach:ownership:01",
  commandDigest: digests.attachOwnership,
  expectedVersion: 1,
  serverOrder: "101",
  occurredAt: "2026-08-14T15:01:00Z",
  membership: ownershipMembership
});
events = result.events;
result = applyFundsEvidenceBundleCommand(events, {
  kind: "attach_claim",
  bundleId,
  commandId: "command:attach:threshold:01",
  commandDigest: digests.attachThreshold,
  expectedVersion: 2,
  serverOrder: "102",
  occurredAt: "2026-08-14T15:02:00Z",
  membership: thresholdMembership
});
events = result.events;
result = applyFundsEvidenceBundleCommand(events, {
  kind: "seal",
  bundleId,
  commandId: "command:seal:01",
  commandDigest: digests.seal,
  expectedVersion: 3,
  serverOrder: "103",
  occurredAt: "2026-08-14T15:03:00Z"
});
events = result.events;
assert.equal(result.state.status, "sealed");
assert.deepEqual(Object.keys(result.state.memberships).sort(), [
  "bankAccountOwnership",
  "fundsThreshold"
]);
assert.equal(result.state.memberships.bankAccountOwnership.claimDigest, digests.ownership);

// Exact command replay is idempotent despite its old expected version.
const replay = applyFundsEvidenceBundleCommand(events, {
  kind: "seal",
  bundleId,
  commandId: "command:seal:01",
  commandDigest: digests.seal,
  expectedVersion: 3,
  serverOrder: "103",
  occurredAt: "2026-08-14T15:03:00Z"
});
assert.equal(replay.appended, false);
assert.deepEqual(replay.events, events);
assert.equal(replay.events.length, events.length);

assert.throws(
  () => applyFundsEvidenceBundleCommand(events, {
    kind: "seal",
    bundleId,
    commandId: "command:seal:01",
    commandDigest: `sha256:${"f".repeat(64)}`,
    expectedVersion: 4,
    serverOrder: "104",
    occurredAt: "2026-08-14T15:04:00Z"
  }),
  /command.idempotency_conflict/
);
assert.throws(
  () => applyFundsEvidenceBundleCommand(events, {
    kind: "unknown_command",
    bundleId,
    commandId: "command:unknown:01",
    commandDigest: digests.seal,
    expectedVersion: 5,
    serverOrder: "105",
    occurredAt: "2026-08-14T15:05:00Z"
  }),
  /command.kind/
);
assert.throws(
  () => applyFundsEvidenceBundleCommand(events, {
    kind: "seal",
    bundleId,
    commandId: "command:invalid-date:01",
    commandDigest: digests.seal,
    expectedVersion: 5,
    serverOrder: "105",
    occurredAt: "2026-02-31T15:05:00Z"
  }),
  /command.occurred_at/
);
assert.throws(
  () => applyFundsEvidenceBundleCommand(events, {
    kind: "seal",
    bundleId,
    commandId: "command:seal:01",
    commandDigest: digests.seal,
    expectedVersion: 3,
    serverOrder: "103",
    occurredAt: "2026-08-14T15:03:01Z"
  }),
  /command.idempotency_conflict/
);
assert.throws(
  () => applyFundsEvidenceBundleCommand(events, {
    kind: "revoke",
    bundleId,
    commandId: "command:revoke:wrong-version",
    commandDigest: digests.revoke,
    expectedVersion: 2,
    serverOrder: "104",
    occurredAt: "2026-08-14T15:04:00Z",
    reason: "assembly integrity failure"
  }),
  /command.expected_version_conflict/
);
assert.throws(
  () => applyFundsEvidenceBundleCommand(events, {
    kind: "attach_claim",
    bundleId,
    commandId: "command:attach:late",
    commandDigest: `sha256:${"6".repeat(64)}`,
    expectedVersion: 4,
    serverOrder: "104",
    occurredAt: "2026-08-14T15:04:00Z",
    membership: { ...thresholdMembership, claimId: "claim:threshold:02", claimDigest: `sha256:${"7".repeat(64)}` }
  }),
  /membership_after_seal/
);

// Historical reconstruction follows the event canon at the supplied instant.
assert.equal(reconstructFundsEvidenceBundleAt(events, "2026-08-14T14:59:59Z"), undefined);
assert.equal(reconstructFundsEvidenceBundleAt(events, "2026-08-14T15:00:00Z").version, 1);
assert.equal(reconstructFundsEvidenceBundleAt(events, "2026-08-14T15:01:30Z").version, 2);
assert.equal(reconstructFundsEvidenceBundleAt(events, "2026-08-14T15:03:00Z").status, "sealed");

result = applyFundsEvidenceBundleCommand(events, {
  kind: "revoke",
  bundleId,
  commandId: "command:revoke:01",
  commandDigest: digests.revoke,
  expectedVersion: 4,
  serverOrder: "104",
  occurredAt: "2026-08-14T15:04:00Z",
  reason: "assembly integrity failure"
});
events = result.events;
assert.equal(result.state.status, "revoked");
assert.equal(reconstructFundsEvidenceBundleAt(events, "2026-08-14T15:03:59Z").status, "sealed");
assert.equal(reconstructFundsEvidenceBundleAt(events, "2026-08-14T15:04:00Z").status, "revoked");
assert.throws(
  () => applyFundsEvidenceBundleCommand(events, {
    kind: "revoke",
    bundleId,
    commandId: "command:after-revoke",
    commandDigest: `sha256:${"8".repeat(64)}`,
    expectedVersion: 5,
    serverOrder: "105",
    occurredAt: "2026-08-14T15:05:00Z",
    reason: "second revocation"
  }),
  /after_revocation/
);

// Seal requires exactly one ownership and one threshold membership.
const openOnly = applyFundsEvidenceBundleCommand([], create).events;
assert.throws(
  () => applyFundsEvidenceBundleCommand(openOnly, {
    kind: "seal",
    bundleId,
    commandId: "command:seal:partial",
    commandDigest: `sha256:${"9".repeat(64)}`,
    expectedVersion: 1,
    serverOrder: "101",
    occurredAt: "2026-08-14T15:01:00Z"
  }),
  /seal_requires_exact_membership/
);

for (const [membership, error] of [
  [{ ...ownershipMembership, subjectId: "member_02" }, /membership.subject_mismatch/],
  [{ ...ownershipMembership, purpose: "marketplace_eligibility" }, /membership.purpose_mismatch/],
  [{ ...ownershipMembership, scope: reviewedScopes.fundsThreshold }, /membership.scope_mismatch/],
  [{ ...ownershipMembership, claimType: "funds_threshold_observed" }, /membership.claim_type_mismatch/],
  [{ ...ownershipMembership, trustDomain: { evidenceClass: "production", key: trustDomain.key } }, /membership.trust_domain_mismatch/]
]) {
  assert.throws(
    () => applyFundsEvidenceBundleCommand(openOnly, {
      kind: "attach_claim",
      bundleId,
      commandId: `command:attack:${error.source}`,
      commandDigest: `sha256:${"5".repeat(64)}`,
      expectedVersion: 1,
      serverOrder: "101",
      occurredAt: "2026-08-14T15:01:00Z",
      membership
    }),
    error
  );
}

const malformedOrder = events.map((event) => ({ ...event }));
malformedOrder[2].serverOrder = "101";
assert.throws(() => validateFundsEvidenceBundleEvents(malformedOrder), /server_order_sequence/);

const firstState = reconstructFundsEvidenceBundleAt(events, "2026-08-14T15:00:00Z");
assert.throws(
  () => assertUnambiguousAssemblyOrdering([firstState, { ...firstState, bundleId: "bundle:funds:02" }]),
  /ambiguous_assembly_order/
);
assert.doesNotThrow(() =>
  assertUnambiguousAssemblyOrdering([
    firstState,
    { ...firstState, bundleId: "bundle:funds:02", assemblyOrder: "200" }
  ])
);

console.log("Verification funds evidence-bundle lifecycle: PASS");
