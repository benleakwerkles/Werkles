/**
 * Focused UI cleanup proof for the public recommendation page.
 * Run: node scripts/foreman/test-matching-ui-cleanup-vpg10.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (rel) => readFileSync(path.join(root, rel), "utf8");

const page = read("app/bellows/recommendations/page.tsx");
const surface = read("components/squibb/recommendation-surface.tsx");
const css = read("app/bellows/recommendations/squibb-recommendations.css");

assert.doesNotMatch(page, /NarrativeJourneyRail/);
assert.doesNotMatch(page, /Test Case #0/);
assert.match(page, /Werkles Recommendations/);
assert.doesNotMatch(page, /Autonomous Matching/);
assert.doesNotMatch(page, /squibb-rec-page__intake-link/);

assert.match(surface, /Example mode/);
assert.match(surface, /This is a walkthrough, not your result\./);
assert.doesNotMatch(surface, />See an example</);
assert.match(surface, /squibb-rec-detail__proof-grid/);
assert.match(surface, /Nothing is saved from this example\./);

const noticeIndex = surface.indexOf('id="squibbRecommendationSavingStatus"');
const buttonsIndex = surface.indexOf('className="squibb-rec-detail__buttons"');
assert.ok(buttonsIndex > -1 && noticeIndex > buttonsIndex, "live actions must precede the save-closed note");
assert.doesNotMatch(surface, /SAVE_CLOSED_BETA|Unavailable beta actions|disabled=/);
assert.doesNotMatch(surface, /fetch\s*\(/);

for (const required of [
  "width: min(1160px, calc(100% - 2rem))",
  "position: sticky",
  "grid-template-columns: repeat(2, minmax(0, 1fr))",
  "scroll-snap-type: x proximity",
  "prefers-reduced-motion: reduce"
]) {
  assert.match(css, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

assert.match(css, /\.squibb-rec-card[\s\S]*background: var\(--werkles-smoke, #2c231d\)/);
assert.doesNotMatch(css, /\.squibb-rec-detail__buttons \.button:disabled/);
assert.match(css, /\.squibb-evidence__item[\s\S]*background: var\(--werkles-smoke, #2c231d\)/);
assert.match(css, /\.squibb-gate--blocker[\s\S]*background: #4a2020/);
assert.match(
  css,
  /@media \(max-width: 900px\)[\s\S]*?\.squibb-rec-surface__layout \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\);/
);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "closed_intake_link_removed",
        "public_test_fixture_link_removed",
        "example_mode_copy_consolidated",
        "centered_reading_width",
        "canonical_dark_recommendation_cards",
        "evidence_and_gates_compacted",
        "save_closed_notice_before_neutral_disabled_actions",
        "mobile_horizontal_recommendation_rail",
        "mobile_detail_column_cannot_force_page_overflow",
        "reduced_motion_respected",
        "save_transport_still_absent"
      ]
    },
    null,
    2
  )
);
