import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const surface = read("components/squibb/recommendation-surface.tsx");
const delivery = read("components/squibb/personal-recommendation-delivery.tsx");

const heroStart = surface.indexOf('<header className="squibb-rec-surface__hero panel">');
const heroEnd = surface.indexOf("</header>", heroStart);
const detailHeader = surface.indexOf('<header className="squibb-rec-detail__header">');
const noteIndex = surface.indexOf("{selected.squibbNote}");
assert.equal((surface.match(/\{selected\.squibbNote\}/g) || []).length, 1);
assert.ok(noteIndex > detailHeader);
assert.ok(noteIndex > heroEnd);
assert.match(surface, /<p className="eyebrow">Selected<\/p>[\s\S]*\{selected\.title\}[\s\S]*\{selected\.headline\}[\s\S]*\{selected\.squibbNote\}/);

const availableActions = surface.indexOf('aria-label="Available recommendation actions"');
const savingStatus = surface.indexOf('id="squibbRecommendationSavingStatus"');
assert.ok(availableActions > 0 && availableActions < savingStatus);
assert.doesNotMatch(surface, /Unavailable beta actions|Save this option|disabled=/);
assert.match(surface, /id="squibbRecommendationSavingStatus"[\s\S]*role="note"/);
assert.match(surface, /href=\{continuationAction\.href\}/);
assert.match(delivery, /label: "Get my own result"/);
assert.match(surface, /Check proof and gaps/);

const responseStatusCheck = delivery.indexOf("response.status === 401");
const payloadParse = delivery.indexOf("await response.json()");
const contractCheck = delivery.indexOf("classifyPersonalRecommendationResponse");
assert.ok(contractCheck > 0 && responseStatusCheck > 0 && responseStatusCheck < payloadParse);
assert.match(delivery, /status: "reauth_required"/);
assert.match(delivery, /href="\/login\?next=%2Fbellows%2Frecommendations">Sign in again/);
assert.match(delivery, /deliveryStatusRef = useRef<HTMLDivElement>\(null\)/);
assert.match(delivery, /focusStatusAfterRetryRef\.current = true[\s\S]*setDelivery\(\{ status: "loading" \}\)/);
assert.match(delivery, /deliveryStatusRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
assert.doesNotMatch(delivery, /method:\s*"POST"|localStorage|sessionStorage/);

console.log(JSON.stringify({
  pass: true,
  checks: [
    "selected_note_lives_once_with_selected_detail",
    "selected_title_headline_and_warm_note_stay_together",
    "live_actions_precede_closed_saving_notice",
    "dead_disabled_actions_are_absent_after_closed_notice",
    "proof_doorway_and_closed_boundaries_remain",
    "explicit_401_is_classified_before_payload_acceptance",
    "reauth_uses_exact_safe_login_return",
    "retry_focus_moves_to_stable_status_only_after_invocation",
    "malformed_and_non_401_responses_keep_contract_error_path",
    "delivery_adds_no_post_or_browser_storage"
  ]
}, null, 2));
