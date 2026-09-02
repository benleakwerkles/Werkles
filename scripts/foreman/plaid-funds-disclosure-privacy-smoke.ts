import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  toFundsVerificationFreshnessView,
  type FundsVerificationReceipt,
  type MutualFundsDisclosure
} from "../../lib/plaid/types.ts";

async function main() {
const now = new Date("2026-08-21T12:00:00.000Z");
const receipt: FundsVerificationReceipt = {
  id: "receipt-1",
  userId: "owner-1",
  kind: "snapshot",
  status: "verified",
  evaluatedMinimumCents: 100_000_00,
  currency: "USD",
  observedAt: "2026-08-21T10:00:00.000Z",
  expiresAt: "2026-09-20T10:00:00.000Z",
  evidenceStrength: "provider_verified",
  provider: "plaid",
  providerEnv: "production",
  consentId: "consent-1",
  providerReceiptRef: "opaque-ref",
  limitations: ["Dated result; not current balance or investment quality."]
};

const freshness = toFundsVerificationFreshnessView(receipt, now);
assert.deepEqual(freshness, {
  label: "Funds verified",
  verifiedAt: receipt.observedAt,
  expiresAt: receipt.expiresAt,
  provider: "plaid"
});
assert.ok(freshness && Object.isFrozen(freshness));
for (const forbidden of ["amount", "minimum", "threshold", "balance", "band", "currency"]) {
  assert.equal(Object.keys(freshness ?? {}).some((key) => key.toLowerCase().includes(forbidden)), false);
}

for (const status of ["not_verified", "inconclusive", "expired", "disputed", "revoked"] as const) {
  assert.equal(toFundsVerificationFreshnessView({ ...receipt, status }, now), null, `${status} cannot create a badge`);
}
assert.equal(
  toFundsVerificationFreshnessView({ ...receipt, expiresAt: "2026-08-21T11:00:00.000Z" }, now),
  null,
  "stale verification cannot create a badge"
);
assert.equal(
  toFundsVerificationFreshnessView({ ...receipt, evidenceStrength: "self_reported" }, now),
  null,
  "self-report cannot create a provider-verified badge"
);

const disclosure: MutualFundsDisclosure = {
  id: "share-1",
  receiptId: receipt.id,
  ownerUserId: receipt.userId,
  recipientUserId: "recipient-1",
  ownerConsentId: "owner-consent",
  recipientConsentId: "recipient-consent",
  disclosedMinimumCents: 100_000_00,
  currency: "USD",
  verifiedAt: receipt.observedAt,
  expiresAt: receipt.expiresAt,
  sharedAt: "2026-08-21T12:00:00.000Z",
  revokedAt: null
};
assert.notEqual(disclosure.ownerUserId, disclosure.recipientUserId);
assert.ok(disclosure.ownerConsentId && disclosure.recipientConsentId);

const homepage = readFileSync("app/page.tsx", "utf8");
assert.match(homepage, /verified · Aug 21/);
assert.doesNotMatch(homepage, /<em>threshold met<\/em>/);

const brief = readFileSync("foreman/plaid/PLAID_PRODUCTION_ONBOARDING_BRIEF_V1.md", "utf8");
assert.match(brief, /Funds verified · \[date\]/);
assert.match(brief, /private one-to-one exchange/i);
assert.match(brief, /Both named members must agree/i);
assert.match(brief, /must not claim control over Plaid's independent retention/i);

console.log("Plaid funds disclosure privacy contract: PASS");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
