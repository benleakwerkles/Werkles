import assert from "node:assert/strict";

import {
  canonicalizeVerificationDigestValue,
  computeFundsEvidenceBundleCommandDigest,
  computeImmutableVerificationClaimDigest,
  membershipMatchesImmutableClaim,
  verifyFundsEvidenceBundleCommandDigest,
  verifyImmutableVerificationClaimDigest
} from "../../lib/verification/verification-digests.ts";

const sha = (character) => `sha256:${character.repeat(64)}`;
const trustDomain = { evidenceClass: "test", key: "sandbox-demonstration:v1" };
const commandContent = {
  kind: "create",
  bundleId: "bundle:funds:01",
  commandId: "command:create:01",
  expectedVersion: 0,
  serverOrder: "100",
  occurredAt: "2026-08-14T15:00:00Z",
  subjectId: "member_01",
  purpose: "payment_risk",
  approvedPolicyDigest: sha("1"),
  reviewedScopes: {
    reviewDigest: sha("2"),
    bankAccountOwnership: "bank-owner:connected-account:v1",
    fundsThreshold: "funds-threshold:usd-50000:v1"
  },
  trustDomain
};

const claim = {
  id: "claim:ownership:01",
  subjectId: "member_01",
  type: "bank_account_ownership_matched",
  scope: "bank-owner:connected-account:v1",
  purpose: "payment_risk",
  consent: {
    basis: "affirmative_consent",
    capturedAt: "2026-08-14T14:58:00Z",
    version: "funds-proof:v1",
    evidenceRef: "consent:01"
  },
  provenance: {
    sourceKind: "provider",
    sourceId: "provider:bank-data",
    method: "account-owner-match",
    evidenceRef: "evidence:ownership:01"
  },
  evaluation: "satisfied",
  observedAt: "2026-08-14T14:59:00Z",
  expiresAt: "2026-08-15T14:59:00Z"
};

assert.equal(
  canonicalizeVerificationDigestValue({ z: [3, { b: true, a: null }], a: "Werkles" }),
  '{"a":"Werkles","z":[3,{"a":null,"b":true}]}'
);
assert.equal(
  canonicalizeVerificationDigestValue({ b: 2, a: 1 }),
  canonicalizeVerificationDigestValue({ a: 1, b: 2 })
);
assert.throws(() => canonicalizeVerificationDigestValue([, "hole"]), /array_hole/);
const arrayWithProperty = ["item"];
arrayWithProperty.unapproved = true;
assert.throws(() => canonicalizeVerificationDigestValue(arrayWithProperty), /array_property/);
assert.throws(() => canonicalizeVerificationDigestValue({ bad: undefined }), /object|undefined/);
assert.throws(() => canonicalizeVerificationDigestValue(-0), /number/);
assert.throws(() => canonicalizeVerificationDigestValue(Number.MAX_SAFE_INTEGER + 1), /number/);
assert.throws(() => canonicalizeVerificationDigestValue("e\u0301"), /unicode_normalization/);
assert.throws(
  () => canonicalizeVerificationDigestValue(String.fromCharCode(0xd800)),
  /unicode/
);
assert.equal(canonicalizeVerificationDigestValue("é"), '"é"');
assert.throws(
  () => canonicalizeVerificationDigestValue(Object.defineProperty({}, "hidden", { value: true })),
  /non_json_key/
);
assert.throws(
  () => canonicalizeVerificationDigestValue(Object.defineProperty({}, "unstable", {
    enumerable: true,
    get: () => Math.random()
  })),
  /accessor/
);

const commandDigest = computeFundsEvidenceBundleCommandDigest(commandContent);
const claimDigest = computeImmutableVerificationClaimDigest(claim);
assert.match(commandDigest, /^sha256:[0-9a-f]{64}$/);
assert.match(claimDigest, /^sha256:[0-9a-f]{64}$/);
assert.equal(verifyFundsEvidenceBundleCommandDigest({ ...commandContent, commandDigest }), true);
assert.equal(
  verifyFundsEvidenceBundleCommandDigest({
    ...commandContent,
    occurredAt: "2026-08-14T15:00:01Z",
    commandDigest
  }),
  false
);
assert.equal(verifyImmutableVerificationClaimDigest(claim, claimDigest), true);
assert.equal(
  verifyImmutableVerificationClaimDigest({ ...claim, scope: "bank-owner:different:v1" }, claimDigest),
  false
);

const membership = {
  role: "bankAccountOwnership",
  claimId: claim.id,
  claimDigest,
  claimType: claim.type,
  scope: claim.scope,
  subjectId: claim.subjectId,
  purpose: claim.purpose,
  trustDomain
};
assert.equal(membershipMatchesImmutableClaim(membership, claim), true);
assert.equal(membershipMatchesImmutableClaim({ ...membership, claimDigest: sha("9") }, claim), false);

assert.throws(
  () => computeFundsEvidenceBundleCommandDigest({ ...commandContent, unapproved: true }),
  /unapproved.unknown/
);
assert.throws(
  () => computeFundsEvidenceBundleCommandDigest({
    ...commandContent,
    occurredAt: "2026-02-31T15:00:00Z"
  }),
  /occurredAt.instant/
);
assert.throws(
  () => computeImmutableVerificationClaimDigest({
    ...claim,
    provenance: { ...claim.provenance, rawProviderPayload: "must-not-enter-digest-contract" }
  }),
  /rawProviderPayload.unknown/
);

// Published offline vectors lock the domain separator, UTF-8 encoding, and canonical form.
assert.equal(commandDigest, "sha256:e6dadfe87c7d095531dee1a4b640f6450858ff5fd168e7e0a51699b1e2904d2e");
assert.equal(claimDigest, "sha256:b2e59316181aa7ac4514ee0ce06d5e46c507af7c76c2d3fca8df5cf5b17f56aa");

console.log("Verification canonical digests: PASS");
