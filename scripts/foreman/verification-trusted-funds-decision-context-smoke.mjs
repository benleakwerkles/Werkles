import assert from "node:assert/strict";

import { applyFundsEvidenceBundleCommand } from "../../lib/verification/funds-evidence-bundle.ts";
import {
  bindTrustedFundsDecisionContext,
  decideCounterpartyFundsWithTrustedContext
} from "../../lib/verification/trusted-funds-decision-context.ts";

const digest = (character) => `sha256:${character.repeat(64)}`;
const evaluatedAt = "2026-08-14T15:00:00Z";
const scopes = {
  reviewDigest: digest("2"),
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
const approvedPolicy = {
  policyRef: "approved:funds:v1",
  policy,
  approvedPolicyDigest: digest("1"),
  reviewedScopes: scopes,
  trustDomain,
  maxObservationSkewSeconds: 300
};

function claim(type, scope, id, observedAt) {
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
      sourceId: "not-for-readout",
      method: type,
      evidenceRef: `evidence:${id}`
    },
    evaluation: "satisfied",
    observedAt,
    expiresAt: "2026-09-14T13:00:00Z"
  };
}

const ownership = claim(
  "bank_account_ownership_matched",
  scopes.bankAccountOwnership,
  "claim:ownership:trusted",
  "2026-08-14T13:01:00Z"
);
const threshold = claim(
  "funds_threshold_observed",
  scopes.fundsThreshold,
  "claim:threshold:trusted",
  "2026-08-14T13:03:00Z"
);
const claimEvidence = [
  {
    claim: ownership,
    contentDigest: digest("3"),
    limitations: ["Ownership does not establish account safety."]
  },
  {
    claim: threshold,
    contentDigest: digest("4"),
    limitations: ["A dated threshold is not a current balance."]
  }
];

function base(bundleId, commandId, expectedVersion, serverOrder, occurredAt) {
  return {
    bundleId,
    commandId,
    commandDigest: `sha256:${serverOrder.padStart(64, "0")}`,
    expectedVersion,
    serverOrder,
    occurredAt
  };
}

function sealedBundle(bundleId, assemblyOrder, domain = trustDomain) {
  let events = [];
  const apply = (command) => {
    events = applyFundsEvidenceBundleCommand(events, command).events;
  };
  const order = BigInt(assemblyOrder);
  apply({
    ...base(bundleId, `${bundleId}:create`, 0, String(order), "2026-08-14T13:00:00Z"),
    kind: "create",
    subjectId: policy.subjectId,
    purpose: policy.purpose,
    approvedPolicyDigest: approvedPolicy.approvedPolicyDigest,
    reviewedScopes: scopes,
    trustDomain: domain
  });
  for (const [index, [role, item, itemDigest]] of [
    ["bankAccountOwnership", ownership, digest("3")],
    ["fundsThreshold", threshold, digest("4")]
  ].entries()) {
    apply({
      ...base(
        bundleId,
        `${bundleId}:${role}`,
        index + 1,
        String(order + BigInt(index + 1)),
        item.observedAt
      ),
      kind: "attach_claim",
      membership: {
        role,
        claimId: item.id,
        claimDigest: itemDigest,
        claimType: item.type,
        scope: item.scope,
        subjectId: item.subjectId,
        purpose: item.purpose,
        trustDomain: domain
      }
    });
  }
  apply({
    ...base(bundleId, `${bundleId}:seal`, 3, String(order + 3n), "2026-08-14T13:04:00Z"),
    kind: "seal"
  });
  return events;
}

const bundleId = "bundle:trusted";
const eventStreams = [sealedBundle(bundleId, "1")];
const grant = {
  grantId: "grant:trusted",
  bundleId,
  subjectId: policy.subjectId,
  granteeId: "counterparty:authenticated",
  purpose: policy.purpose,
  state: "active",
  grantedAt: "2026-08-14T14:00:00Z",
  expiresAt: "2026-08-15T14:00:00Z"
};
let serverClockReads = 0;
const sources = {
  authenticatedGranteeId: grant.granteeId,
  currentServerTime() {
    serverClockReads += 1;
    return evaluatedAt;
  },
  resolveApprovedPolicy(policyRef) {
    return policyRef === approvedPolicy.policyRef ? approvedPolicy : undefined;
  },
  resolveGrant(grantId) {
    return grantId === grant.grantId ? grant : undefined;
  },
  resolveBundleEvidence(resolvedBundleId) {
    return resolvedBundleId === bundleId ? { eventStreams, claimEvidence } : undefined;
  }
};
const context = bindTrustedFundsDecisionContext(sources);
const request = {
  policyRef: approvedPolicy.policyRef,
  grantId: grant.grantId,
  bundleId
};

const allowed = decideCounterpartyFundsWithTrustedContext(context, request);
assert.equal(allowed.outcome, "allowed");
assert.equal(allowed.evaluatedAt, evaluatedAt);
assert.equal(allowed.decision.selectedBundleId, bundleId);
assert.equal(serverClockReads, 1, "trusted time is captured exactly once per decision");

// Client material cannot override any of the three trust inputs.
for (const injected of [
  { evaluatedAt: "2099-01-01T00:00:00Z" },
  { approvedPolicyDigests: [digest("9")] },
  { approvedPolicy },
  { grant: { ...grant, granteeId: "attacker" } },
  { granteeId: grant.granteeId },
  { authenticatedGranteeId: grant.granteeId },
  { currentServerTime: () => "2099-01-01T00:00:00Z" },
  { disclosure: { audience: "member" } },
  { eventStreams },
  { claimEvidence }
]) {
  const denied = decideCounterpartyFundsWithTrustedContext(context, { ...request, ...injected });
  assert.equal(denied.outcome, "denied");
  assert.equal(denied.reason, "caller_supplied_trust_material");
}

assert.deepEqual(
  decideCounterpartyFundsWithTrustedContext({}, request),
  { outcome: "denied", reason: "untrusted_decision_context" }
);

const copiedBrand = Object.getOwnPropertySymbols(context)[0];
assert.equal(
  decideCounterpartyFundsWithTrustedContext({
    ...context,
    [copiedBrand]: true,
    authenticatedGranteeId: "counterparty:attacker"
  }, request).reason,
  "untrusted_decision_context"
);
assert.equal(
  decideCounterpartyFundsWithTrustedContext(context, { ...request, unknown: true }).reason,
  "caller_supplied_trust_material"
);
const inheritedRequest = Object.create(request);
assert.equal(
  decideCounterpartyFundsWithTrustedContext(context, inheritedRequest).reason,
  "caller_supplied_trust_material"
);
assert.equal(
  decideCounterpartyFundsWithTrustedContext(
    bindTrustedFundsDecisionContext({ ...sources, resolveApprovedPolicy: () => undefined }),
    request
  ).reason,
  "approved_policy_not_resolved"
);
assert.equal(
  decideCounterpartyFundsWithTrustedContext(
    bindTrustedFundsDecisionContext({ ...sources, resolveGrant: () => undefined }),
    request
  ).reason,
  "grant_not_resolved"
);
assert.equal(
  decideCounterpartyFundsWithTrustedContext(
    bindTrustedFundsDecisionContext({ ...sources, resolveBundleEvidence: () => undefined }),
    request
  ).reason,
  "bundle_evidence_not_resolved"
);
assert.equal(
  decideCounterpartyFundsWithTrustedContext(
    bindTrustedFundsDecisionContext({ ...sources, currentServerTime: () => {
      throw new Error("clock unavailable");
    } }),
    request
  ).reason,
  "invalid_trusted_server_time"
);
assert.equal(
  decideCounterpartyFundsWithTrustedContext(
    bindTrustedFundsDecisionContext({ ...sources, resolveGrant: () => {
      throw new Error("grant lookup unavailable");
    } }),
    request
  ).reason,
  "grant_not_resolved"
);
assert.equal(
  decideCounterpartyFundsWithTrustedContext(
    bindTrustedFundsDecisionContext({ ...sources, authenticatedGranteeId: "counterparty:other" }),
    request
  ).reason,
  "grant_reference_mismatch"
);
assert.equal(
  decideCounterpartyFundsWithTrustedContext(
    bindTrustedFundsDecisionContext({ ...sources, currentServerTime: () => "not-an-instant" }),
    request
  ).reason,
  "invalid_trusted_server_time"
);

// An exact grant for an older assembly cannot disclose a newer lineage assembly.
const newerBundle = sealedBundle("bundle:newer", "10");
const newerContext = bindTrustedFundsDecisionContext({
  ...sources,
  resolveBundleEvidence: () => ({
    eventStreams: [...eventStreams, newerBundle],
    claimEvidence
  })
});
const newerResolved = decideCounterpartyFundsWithTrustedContext(newerContext, request);
assert.equal(newerResolved.outcome, "denied");
assert.equal(newerResolved.reason, "bundle_lineage_mismatch");
assert.equal(newerResolved.decision.selectedBundleId, "bundle:newer");

// A member may inspect clearly labeled test evidence elsewhere, but the trusted
// counterparty adapter never turns it into a discloseable proof.
const testDomain = { evidenceClass: "test", key: trustDomain.key };
const testPolicy = { ...approvedPolicy, trustDomain: testDomain };
const testBundleId = "bundle:test-only";
const testGrant = { ...grant, bundleId: testBundleId };
const testContext = bindTrustedFundsDecisionContext({
  ...sources,
  resolveApprovedPolicy: () => testPolicy,
  resolveGrant: () => testGrant,
  resolveBundleEvidence: () => ({
    eventStreams: [sealedBundle(testBundleId, "20", testDomain)],
    claimEvidence
  })
});
const testDecision = decideCounterpartyFundsWithTrustedContext(testContext, {
  ...request,
  bundleId: testBundleId
});
assert.equal(testDecision.outcome, "denied");
assert.equal(testDecision.reason, "funds_decision_failed");
assert.equal(testDecision.decision.reason, "nonproduction_disclosure_forbidden");

assert.equal(
  decideCounterpartyFundsWithTrustedContext(
    bindTrustedFundsDecisionContext({ ...sources, currentServerTime: () => "2026-02-31T15:00:00Z" }),
    request
  ).reason,
  "invalid_trusted_server_time"
);

assert.throws(
  () => bindTrustedFundsDecisionContext({ ...sources, authenticatedGranteeId: " " }),
  /authenticatedGranteeId/
);

console.log("Verification trusted funds decision context: PASS");
