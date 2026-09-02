import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  crucibleProofBoundaries,
  proofBoundaryFor
} from "../../lib/crucible-proof-boundaries.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const expectedKeys = [
  "identity",
  "identity_reverification",
  "phone",
  "funds",
  "funds_reverification",
  "license",
  "reference",
  "employment",
  "background_basic",
  "background_essential",
  "background_complete",
  "continuous_monitoring"
];

assert.deepEqual(Object.keys(crucibleProofBoundaries).sort(), expectedKeys.sort());
for (const key of expectedKeys) {
  const boundary = proofBoundaryFor(key);
  assert.ok(boundary.establishes.length > 20, `${key} needs a concrete establishes boundary`);
  assert.ok(boundary.doesNotEstablish.length > 20, `${key} needs a concrete exclusion boundary`);
  assert.ok(boundary.establishes.length < 125, `${key} establishes copy is too long`);
  assert.ok(boundary.doesNotEstablish.length < 105, `${key} exclusion copy is too long`);
}

const combinedCopy = JSON.stringify(crucibleProofBoundaries).toLowerCase();
for (const bannedClaim of [
  "is trustworthy",
  "is safe",
  "guaranteed safe",
  "fully verified",
  "legal approval",
  "we vouch"
]) {
  assert.doesNotMatch(combinedCopy, new RegExp(bannedClaim), `unbounded claim: ${bannedClaim}`);
}

const fundsBoundary = proofBoundaryFor("funds");
assert.match(fundsBoundary.establishes, /with a dated provider receipt/i);
assert.match(fundsBoundary.doesNotEstablish, /creditworthiness/i);

const card = await readFile(
  path.join(repoRoot, "components/crucible/verification-card.tsx"),
  "utf8"
);
assert.match(card, /proofBoundaryFor\(check\.key\)/);
assert.match(card, /<dl className="verification-proof-boundary"/);
assert.match(card, /aria-label=\{`\$\{check\.title\} proof boundary`\}/);
assert.match(card, /<dt>What a completed check can establish<\/dt>/);
assert.match(card, /<dt>Cannot establish<\/dt>/);
assert.match(card, /<dt>What happens next<\/dt>/);
assert.match(card, /viewing this card proves nothing/);
assert.match(card, /does not contact a provider or create a result/);

const page = await readFile(
  path.join(repoRoot, "app/dashboard/crucible/page.tsx"),
  "utf8"
);
assert.match(page, /Your current Intake/);
assert.match(page, /latest saved Intake/);
assert.match(page, /none is running/);

console.log("Crucible proof boundaries contract: PASS");
