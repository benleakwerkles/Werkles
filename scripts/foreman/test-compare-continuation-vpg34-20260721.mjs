import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const card = read("components/squibb/recommendation-card.tsx");
const meter = read("components/squibb/confidence-meter.tsx");
const ruleSupport = read("lib/squibb/rule-support.ts");
const surface = read("components/squibb/recommendation-surface.tsx");
const delivery = read("components/squibb/personal-recommendation-delivery.tsx");

assert.match(ruleSupport, /export function ruleSupportBand\(label: ConfidenceLabel\)/);
assert.match(ruleSupport, /Stronger rule support[\s\S]*Moderate rule support[\s\S]*Limited rule support/);
assert.match(meter, /const band = ruleSupportBand\(label\)/);
assert.match(card, /const supportBand = ruleSupportBand\(recommendation\.confidence\.label\)/);
assert.match(card, /Math\.max\(0, Math\.min\(100, Math\.round\(recommendation\.confidence\.score\)\)\)/);
assert.match(card, /\{rulesScore\}\/100[\s\S]*\{supportBand\}/);
assert.match(card, /aria-label=\{`Rules score \$\{rulesScore\} out of 100\. \$\{supportBand\}\.``?\}/);
assert.match(meter, /Not a probability\./);

const meterIndex = surface.indexOf("<ConfidenceMeter");
const reasoningIndex = surface.indexOf("<ReasoningPanel");
const gatesIndex = surface.indexOf("<HumanGateStrip");
assert.ok(meterIndex > 0 && meterIndex < reasoningIndex && reasoningIndex < gatesIndex);

assert.match(surface, /continuationAction\?: \{[\s\S]*label: string;[\s\S]*href: string;/);
assert.match(surface, /href=\{continuationAction\.href\}[\s\S]*\{continuationAction\.label\}/);
assert.match(delivery, /delivery\.status === "signed_out"[\s\S]*label: "Get my own result"[\s\S]*#\$\{PERSONAL_RECOMMENDATION_CTA_ID\}/);
assert.match(delivery, /delivery\.status === "reauth_required"[\s\S]*label: "Sign in again"[\s\S]*href: "\/login\?next=%2Fbellows%2Frecommendations"/);
assert.match(delivery, /delivery\.status === "profile_required"[\s\S]*label: "Complete my profile"[\s\S]*href: "\/dashboard\/profile\?next=%2Fbellows%2Frecommendations"/);
assert.match(delivery, /: undefined;/);

const errorStart = delivery.indexOf('{delivery.status === "error" ? (');
const errorEnd = delivery.indexOf("</>", errorStart);
const errorSlice = delivery.slice(errorStart, errorEnd);
assert.match(errorSlice, /Try again/);
assert.doesNotMatch(errorSlice, /Profile Builder|\/login|\/signup/);
assert.doesNotMatch(delivery, /method:\s*"POST"|localStorage|sessionStorage/);

console.log(JSON.stringify({
  pass: true,
  checks: [
    "card_and_meter_share_support_band_formatter",
    "card_keeps_clamped_numeric_rules_score",
    "card_adds_compact_human_support_band",
    "score_disclaimer_remains_not_probability",
    "selected_score_precedes_optional_reasoning",
    "one_contextual_action_uses_existing_surface_group",
    "signed_out_reauth_and_profile_required_map_exactly",
    "loading_error_and_personal_inject_no_recovery_action",
    "generic_error_is_retry_only",
    "delivery_adds_no_post_or_browser_storage"
  ]
}, null, 2));
