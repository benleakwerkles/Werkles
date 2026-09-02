import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  cardStateForStoredVerificationStatus,
  normalizeStoredVerificationStatus,
  ownerVerificationStatusFromProfile
} from "../../lib/crucible-owner-status.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

assert.deepEqual(ownerVerificationStatusFromProfile(null), {
  identity: "none",
  funds: "none"
});
assert.deepEqual(
  ownerVerificationStatusFromProfile({
    id_status: "live_verified",
    funds_status: "sandbox_verified"
  }),
  { identity: "live_verified", funds: "legacy_unbacked" }
);
assert.equal(ownerVerificationStatusFromProfile({ funds_status: "sandbox_pending" }).funds, "legacy_unbacked");
assert.equal(ownerVerificationStatusFromProfile({ funds_status: "live_verified" }).funds, "legacy_unbacked");
assert.equal(normalizeStoredVerificationStatus("sandbox_pending"), "sandbox_pending");
assert.equal(normalizeStoredVerificationStatus("invented_status"), "none");
assert.equal(cardStateForStoredVerificationStatus("none"), "ready_to_start");
assert.equal(cardStateForStoredVerificationStatus("sandbox_verified"), "sandbox_verified");
assert.equal(cardStateForStoredVerificationStatus("live_verified"), "live_verified");
assert.equal(cardStateForStoredVerificationStatus("legacy_unbacked"), "legacy_unbacked");

const route = await readFile(
  path.join(repoRoot, "app/api/verification/status/route.ts"),
  "utf8"
);
assert.match(route, /requireUser\(request\)/);
assert.match(route, /\.select\("id_status, funds_status"\)/);
assert.match(route, /\.eq\("id", auth\.user\.id\)/);
assert.match(route, /Cache-Control/);
assert.match(route, /private, no-store/);
assert.doesNotMatch(route, /PLAID_|STRIPE_|createPlaid|createStripe|exchangePlaid/);

const panel = await readFile(
  path.join(repoRoot, "components/crucible/crucible-panel.tsx"),
  "utf8"
);
assert.match(panel, /fetch\("\/api\/verification\/status"/);
assert.match(panel, /Authorization: `Bearer \$\{token\}`/);
assert.match(panel, /normalizeStoredVerificationStatus\(raw\?\.identity\)/);
assert.match(panel, /raw\?\.funds === "legacy_unbacked"/);
assert.match(panel, /state=\{ownerCheckStates\[check\.key\] \?\? check\.state\}/);

console.log("Crucible owner verification status contract: PASS");
