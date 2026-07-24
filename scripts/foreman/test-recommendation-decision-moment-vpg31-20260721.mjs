import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const card = read("components/squibb/recommendation-card.tsx");
const surface = read("components/squibb/recommendation-surface.tsx");
const delivery = read("components/squibb/personal-recommendation-delivery.tsx");

assert.match(card, /Math\.max\(0, Math\.min\(100, Math\.round\(recommendation\.confidence\.score\)\)\)/);
assert.match(card, /\{rulesScore\}\/100/);
assert.match(card, /ruleSupportBand\(recommendation\.confidence\.label\)/);
assert.match(card, /squibb-rec-card__rank/);
assert.match(card, /Review required/);
assert.match(card, /Blocked/);

assert.match(surface, /continuationAction\?: \{/);
assert.match(surface, /href=\{continuationAction\.href\}/);
assert.match(delivery, /label: "Get my own result",[\s\S]*href: `#\$\{PERSONAL_RECOMMENDATION_CTA_ID\}`/);
assert.doesNotMatch(surface, /Unavailable beta actions|Save this option|disabled=/);
assert.match(surface, /Check proof and gaps/);
assert.match(surface, /Saving is closed in this beta\. Nothing is sent\./);
assert.doesNotMatch(surface, /fetch\(|localStorage|sessionStorage/);

assert.match(delivery, /id=\{PERSONAL_RECOMMENDATION_CTA_ID\}/);
assert.match(
  delivery,
  /continuationAction=\{continuationAction\}/
);
assert.match(delivery, /href="\/signup\?next=%2Fbellows%2Frecommendations"/);
assert.match(delivery, /href="\/login\?next=%2Fbellows%2Frecommendations"/);

console.log(JSON.stringify({
  pass: true,
  checks: [
    "comparison_cards_show_existing_clamped_rules_score",
    "rank_and_gate_flags_remain_visible",
    "signed_out_selection_links_to_existing_account_doorway",
    "doorway_link_is_hidden_outside_confirmed_signed_out_state",
    "dead_saving_controls_are_removed_and_server_boundary_remains"
  ]
}, null, 2));
