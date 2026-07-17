/**
 * Focused source proof for VPG12 example custody and closed-intake clarity.
 * Run: node scripts/foreman/test-matching-example-custody-intake-clarity-vpg12-20260717.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const surface = read("components/squibb/recommendation-surface.tsx");
const reasoning = read("components/squibb/reasoning-panel.tsx");
const meter = read("components/squibb/confidence-meter.tsx");
const recommendations = read("lib/squibb/recommendations.ts");
const bellowsPage = read("app/bellows/intake/page.tsx");
const bellowsForm = read("components/squibb/concierge-intake-form.tsx");
const discoveryForm = read("app/discovery/discovery-intake-form.tsx");
const bellowsAvailability = read("lib/squibb/concierge-intake-availability.ts");
const discoveryAvailability = read("lib/discovery/intake-availability.ts");

const demoRanked = recommendations.slice(
  recommendations.indexOf("const rankedDeck"),
  recommendations.indexOf("export function buildLiveIntakeRankedDeck")
);
const liveRanked = recommendations.slice(
  recommendations.indexOf("export function buildLiveIntakeRankedDeck"),
  recommendations.indexOf("const catalogDeck")
);
const demoCatalog = recommendations.slice(
  recommendations.indexOf("const catalogDeck"),
  recommendations.indexOf("export function loadSquibbRecommendationSession")
);
const visitorOwnership = /You said|what you entered|Your intake|on file/i;

assert.doesNotMatch(demoRanked, visitorOwnership);
assert.doesNotMatch(demoCatalog, visitorOwnership);
assert.match(liveRanked, /source: "Your intake"/);

assert.match(surface, /const isExample = source\.mode === "demo"/);
assert.match(surface, /\{isExample \? "Example need" : "What you need"\}/);
assert.match(surface, /<ReasoningPanel reasoning=\{selected\.reasoning\} isExample=\{isExample\}/);
assert.match(surface, /isExample=\{isExample\}/);
assert.doesNotMatch(surface, /showIntakePrompt|Start an intake|to create the first one/);
assert.match(surface, /Review the closed intake questions/);
assert.match(reasoning, /isExample \? "Example scenario" : "You said"/);
assert.match(meter, /EXAMPLE_RULES_SCORE_DISCLAIMER/);
assert.match(meter, /LIVE_RULES_SCORE_DISCLAIMER/);

assert.match(recommendations, /export function buildLiveIntakeRankedDeck/);

assert.doesNotMatch(bellowsPage, /intakeGuideTitle|concierge-intake-page__guide/);
const h1Index = bellowsForm.indexOf("<h1>Name what you are carrying</h1>");
const guideIndex = bellowsForm.indexOf('<h2 id="intakeGuideTitle">');
const formIndex = bellowsForm.indexOf('<form\n        className="concierge-intake__form panel"');
assert.ok(h1Index > -1 && guideIndex > h1Index && formIndex > guideIndex);
assert.equal(bellowsForm.match(/<h1(?:\s|>)/g)?.length, 1);
assert.match(bellowsForm, /aria-labelledby="intakeGuideTitle"/);

assert.match(discoveryForm, /<span>Email<\/span>/);
assert.match(
  discoveryForm,
  /<input name="contact" type="email" inputMode="email" autoComplete="email" maxLength=\{160\} required \/>/
);
assert.match(discoveryForm, /contact: String\(form\.get\("contact"\)/);

assert.match(bellowsAvailability, /BELLOWS_INTAKE_SUBMISSION_OPEN = false/);
assert.match(discoveryAvailability, /DISCOVERY_INTAKE_SUBMISSION_OPEN = false/);
assert.doesNotMatch(surface, /fetch\s*\(/);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "demo_copy_does_not_claim_visitor_ownership",
        "latest_intake_keeps_truthful_personal_copy",
        "live_ranked_builder_remains_distinct_from_demo_catalog",
        "empty_ledger_does_not_define_example_mode",
        "bellows_heading_order_is_h1_then_h2",
        "discovery_contact_purpose_is_consistently_email",
        "closed_intake_and_save_boundaries_remain_static"
      ]
    },
    null,
    2
  )
);
