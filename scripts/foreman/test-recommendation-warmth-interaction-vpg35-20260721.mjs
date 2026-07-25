import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");
const require = createRequire(import.meta.url);
const ts = require("typescript");

function loadTs(source, localRequire = (specifier) => require(specifier)) {
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "exports", "module", output)(localRequire, loaded.exports, loaded);
  return loaded.exports;
}

const delivery = read("components/squibb/personal-recommendation-delivery.tsx");
const surface = read("components/squibb/recommendation-surface.tsx");
const css = read("app/bellows/recommendations/squibb-recommendations.css");
const focus = loadTs(read("lib/squibb/continuation-focus.ts"));
const recommendations = loadTs(read("lib/squibb/recommendations.ts"));
const disclosure = loadTs(read("lib/matching/personal-recommendation-disclosure.ts"));
const gates = loadTs(read("lib/matching/public-recommendation-gates.ts"));
const contract = loadTs(
  read("lib/matching/personal-recommendation-contract.ts"),
  (specifier) => {
    if (specifier === "@/lib/squibb/recommendations") return recommendations;
    if (specifier === "@/lib/matching/personal-recommendation-disclosure") return disclosure;
    if (specifier === "@/lib/matching/public-recommendation-gates") return gates;
    return require(specifier);
  }
);

for (const status of ["loading", "signed_out", "reauth_required", "profile_required", "personal", "error"]) {
  assert.match(delivery, new RegExp(`status: "${status}"`));
  assert.match(delivery, new RegExp(`delivery\\.status === "${status}"`));
}
assert.match(delivery, /Looking for your profile\. You can explore the example while we check\./);
assert.match(delivery, /Your profile needs a goal or project detail\./);
assert.match(delivery, /We could not load your result, so the example stays here\./);
assert.doesNotMatch(delivery, /Inputs: goal/);
assert.match(surface, /This is a walkthrough, not your result\./);
assert.match(surface, /Fixed rules, private result\./);
assert.match(surface, /personalGeneration\?\.explanation/);
const deliveryStatusPredicate = delivery.slice(
  delivery.indexOf("const showDeliveryStatus"),
  delivery.indexOf("const continuationAction")
);
assert.doesNotMatch(deliveryStatusPredicate, /signed_out|personal/);
assert.match(surface, /Swipe or scroll, then pick one to explore\./);
assert.match(surface, /id="squibbRecommendationCompareCue"/);
assert.match(surface, /aria-describedby="squibbRecommendationCompareCue"/);
assert.match(css, /\.squibb-rec-stack\s*\{[\s\S]*overflow-x:\s*auto/);

let prevented = 0;
let focused = 0;
let scrolled = 0;
const target = {
  focus(options) {
    focused += 1;
    assert.deepEqual(options, { preventScroll: true });
  },
  scrollIntoView(options) {
    scrolled += 1;
    assert.deepEqual(options, { behavior: "auto", block: "nearest" });
  }
};
const event = { preventDefault: () => (prevented += 1) };
assert.equal(focus.followContinuationTarget("personalRecommendationDoorway", event, () => target), true);
assert.deepEqual({ prevented, focused, scrolled }, { prevented: 1, focused: 1, scrolled: 1 });
assert.equal(focus.followContinuationTarget("missing", event, () => null), false);
assert.equal(focus.followContinuationTarget(undefined, event, () => target), false);
assert.deepEqual({ prevented, focused, scrolled }, { prevented: 1, focused: 1, scrolled: 1 });
assert.match(delivery, /focusTargetId: PERSONAL_RECOMMENDATION_CTA_ID/);
assert.match(surface, /onClick=\{followContinuation\}/);

const profile = { success: true, persisted: false, status: "profile_required" };
const ranked = recommendations.loadSquibbRecommendationSession().ranked.map((item, index) => ({
  ...item,
  rank: index + 1,
  title: recommendations.RECOMMENDATION_KIND_LABELS[item.kind],
  squibbNote:
    index === 0
      ? "This is the highest-ranked path not ruled out by the current rules."
      : "This is another path not ruled out by the current rules to compare before deciding what to do.",
  confidence: {
    ...item.confidence,
    why: "Rules-based path score from what you entered and the proof gaps recorded here. It is not a probability of success or eligibility."
  },
  humanGates: gates.publicMatchingHumanGates(item.kind),
  suggestedAgent: "Werkles human review",
  suggestedTool: undefined,
  keepOriginalPathLabel: "Keep my current approach"
}));
const session = {
  version: "v1",
  statedNeed: "I need a next step.",
  operatorContext: disclosure.PERSONAL_RECOMMENDATION_OPERATOR_CONTEXT,
  squibbIntro: disclosure.PERSONAL_RECOMMENDATION_INTRO,
  source: {
    mode: "authenticated_profile",
    label: disclosure.PERSONAL_RECOMMENDATION_SOURCE_LABEL,
    detail: disclosure.PERSONAL_RECOMMENDATION_SOURCE_DETAIL
  },
  generation: { ...disclosure.PERSONAL_RECOMMENDATION_GENERATION },
  ranked,
  catalog: structuredClone(ranked)
};
const personal = { success: true, persisted: false, status: "personal", session };
const decide = (status, ok, payload) =>
  contract.classifyPersonalRecommendationResponse({ status, ok, payload });

assert.deepEqual(decide(401, false, null), { status: "reauth_required" });
assert.deepEqual(decide(401, false, personal), { status: "reauth_required" });
assert.equal(decide(200, true, profile), profile);
assert.equal(decide(200, true, personal), personal);
assert.deepEqual(decide(200, true, { status: "personal" }), { status: "error" });
assert.deepEqual(decide(403, false, personal), { status: "error" });
assert.deepEqual(decide(503, false, profile), { status: "error" });
assert.ok(delivery.indexOf("response.status === 401") < delivery.indexOf("await response.json()"));
assert.doesNotMatch(delivery, /method:\s*"POST"|localStorage|sessionStorage/);

console.log(JSON.stringify({
  pass: true,
  checks: [
    "six_delivery_states_keep_short_transient_copy",
    "stable_custody_notes_keep_profile_provenance_and_custody",
    "comparison_cue_is_short_and_still_describes_the_rail",
    "signed_out_activation_focuses_and_scrolls_exactly_once",
    "missing_or_absent_fragment_target_keeps_native_fallback",
    "classifier_maps_401_before_payload_acceptance",
    "classifier_accepts_only_valid_200_profile_or_personal",
    "classifier_rejects_malformed_200_and_valid_looking_403_503",
    "delivery_remains_get_only_without_browser_storage"
  ]
}, null, 2));
