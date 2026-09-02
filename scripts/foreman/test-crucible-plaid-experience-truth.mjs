import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PLAID_CONFIGURED_EXPERIENCE_TRUTH,
  plaidExperienceTruthFor
} from "../../lib/crucible-plaid-experience-truth.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

assert.equal(
  plaidExperienceTruthFor("funds", true),
  "Requests the configured Plaid sandbox experience; availability checked on open."
);
assert.equal(plaidExperienceTruthFor("funds", false), null);
assert.equal(plaidExperienceTruthFor("identity", true), null);
assert.equal(plaidExperienceTruthFor("funds_reverification", true), null);
assert.ok(PLAID_CONFIGURED_EXPERIENCE_TRUTH.length < 80, "experience truth must remain one concise line");
assert.equal(
  (PLAID_CONFIGURED_EXPERIENCE_TRUTH.match(/sandbox/gi) ?? []).length,
  1,
  "sandbox must be explicit exactly once"
);
for (const forbidden of [
  /proof|verified|verification/i,
  /safe|trust/i,
  /production|live/i,
  /saved|connected|connection/i,
  /account|balance|financial data/i,
  /color|branding/i
]) {
  assert.doesNotMatch(PLAID_CONFIGURED_EXPERIENCE_TRUTH, forbidden);
}

const card = await readFile(
  path.join(repoRoot, "components/crucible/verification-card.tsx"),
  "utf8"
);
const copySource = await readFile(path.join(repoRoot, "lib/copy.ts"), "utf8");
const humanGatesSource = await readFile(path.join(repoRoot, "lib/product-human-gates.ts"), "utf8");
assert.match(
  card,
  /plaidExperienceTruthFor\(check\.key, action\.enabled\)/,
  "truth must be limited to an actionable Funds card"
);
assert.match(card, /className="muted verification-plaid-experience-truth" role="note"/);
assert.match(card, /\{plaidExperienceTruth\}/);
assert.match(copySource, /This sandbox demo keeps no funds result or account numbers/);
assert.match(copySource, /fails closed if it is unavailable/);
assert.doesNotMatch(copySource, /Funds uses Plaid Link when configured, otherwise sandbox stub/);
assert.doesNotMatch(humanGatesSource, /public_token exchange updates funds_status/);
assert.doesNotMatch(humanGatesSource, /otherwise sandbox stub/);
assert.match(humanGatesSource, /public-token exchange and funds-status proof remain disabled/);

console.log("Crucible configured Plaid experience truth contract: PASS");
