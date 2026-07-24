import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const surface = read("components/squibb/recommendation-surface.tsx");
const evidence = read("components/squibb/evidence-section.tsx");
const delivery = read("components/squibb/personal-recommendation-delivery.tsx");

assert.match(surface, /function reviewProofAndGaps\(\)/);
assert.match(surface, /details\.open = true/);
assert.match(surface, /summary\?\.focus\(\{ preventScroll: true \}\)/);
assert.match(surface, /aria-controls=\{RECOMMENDATION_EVIDENCE_ID\}/);
assert.match(surface, /onClick=\{reviewProofAndGaps\}/);
assert.match(surface, /Check proof and gaps/);
assert.doesNotMatch(surface, /Unavailable beta actions|Save this option|disabled=/);
assert.match(surface, /Saving is closed in this beta\. Nothing is sent\./);
assert.doesNotMatch(surface, /fetch\(|localStorage|sessionStorage/);
assert.match(evidence, /ref=\{detailsRef\} id=\{detailsId\}/);

assert.equal((delivery.match(/squibb-rec-delivery-cta__action-row/g) || []).length, 2);
assert.match(delivery, /New here: confirm your email, finish First Weld/);
assert.match(delivery, /Already a member: sign in and come straight back/);
assert.match(delivery, /href="\/signup\?next=%2Fbellows%2Frecommendations"/);
assert.match(delivery, /href="\/login\?next=%2Fbellows%2Frecommendations"/);
assert.match(delivery, /id=\{PERSONAL_RECOMMENDATION_CTA_ID\}[\s\S]*tabIndex=\{-1\}/);

console.log(JSON.stringify({
  pass: true,
  checks: [
    "proof_action_opens_and_focuses_existing_disclosure",
    "proof_action_adds_no_network_or_storage_path",
    "exactly_two_closed_beta_controls_remain",
    "account_paths_pair_each_link_with_its_own_helper",
    "account_doorway_is_a_focusable_fragment_target"
  ]
}, null, 2));
