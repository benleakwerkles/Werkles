/**
 * Focused source proof for VPG13 cockpit-law alignment and decision-path clarity.
 * Run: node scripts/foreman/test-matching-cockpit-decision-path-vpg13-20260717.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const css = read("app/bellows/recommendations/squibb-recommendations.css");
const surface = read("components/squibb/recommendation-surface.tsx");
const bellowsAvailability = read("lib/squibb/concierge-intake-availability.ts");
const discoveryAvailability = read("lib/discovery/intake-availability.ts");

for (const forbiddenLightSurface of [
  "#fbf8f1",
  "#f5ecde",
  "#eee2d1",
  "rgba(255, 252, 246",
  "#fbf6ed",
  "#fffdf8",
  "#edf6e8",
  "#f8f2e8",
  "#f2eadc",
  "#e8e2d8"
]) {
  assert.doesNotMatch(css, new RegExp(forbiddenLightSurface.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
}

assert.doesNotMatch(css, /#(?:fff(?:fff)?|000(?:000)?)\b/i);
assert.match(css, /--squibb-rec-accent: var\(--werkles-violet-bright, #672eed\)/);
assert.match(css, /--werkles-text-primary: #f4e2b1/);
assert.match(css, /--werkles-text-muted: #c9b896/);
assert.match(css, /--squibb-rec-on-light: #f4e2b1/);
assert.match(css, /--squibb-rec-muted-on-light: #c9b896/);
assert.match(css, /\.squibb-rec-page \{[\s\S]*var\(--werkles-forge-black, #050404\)/);
assert.match(css, /\.squibb-rec-surface > \.panel,[\s\S]*background: rgba\(25, 24, 23, 0\.97\)/);
assert.match(css, /\.squibb-rec-card \{[\s\S]*background: var\(--werkles-smoke, #2c231d\)/);
assert.match(css, /\.squibb-reasoning,[\s\S]*border-top: 1px solid var\(--werkles-iron, #3b342a\)[\s\S]*background: transparent/);
assert.match(css, /\.squibb-evidence,[\s\S]*border-top: 1px solid var\(--werkles-iron, #3b342a\)[\s\S]*background: transparent/);
assert.match(css, /\.squibb-rec-ledger__grid > div \{[\s\S]*background: transparent/);

assert.match(css, /\.squibb-rec-card--selected \{[\s\S]*var\(--werkles-violet-bright, #672eed\)/);
assert.match(css, /\.squibb-rec-card__flag \{[\s\S]*var\(--werkles-ember, #fbc368\)/);
assert.match(css, /\.squibb-gate--blocker \{[\s\S]*background: #4a2020/);
assert.match(css, /\.squibb-evidence__strength--verified \{[\s\S]*var\(--werkles-owl-eye-green, #5fd178\)/);
assert.match(css, /\.squibb-evidence__item--missing \{[\s\S]*var\(--werkles-iron, #3b342a\)/);
assert.match(css, /\.squibb-rec-detail__buttons \.button:disabled \{[\s\S]*var\(--werkles-workshop-night, #191817\)/);
assert.match(css, /\.squibb-confidence__fill \{[\s\S]*var\(--werkles-teal-deep, #015e51\)[\s\S]*var\(--werkles-teal-bright, #18c5ae\)/);
assert.match(css, /:focus-visible[\s\S]*outline: 3px solid var\(--werkles-ember, #fbc368\)/);

assert.match(surface, /const recommendationRailRef = useRef<HTMLDivElement>\(null\)/);
assert.match(surface, /const selectedStillAvailable = nextList\.some/);
assert.match(surface, /requestAnimationFrame\(\(\) => \{/);
assert.match(surface, /selectedCard\.scrollIntoView\(\{ behavior: "auto", block: "nearest", inline: "nearest" \}\)/);
assert.match(surface, /rail\?\.scrollTo\(\{ left: 0, behavior: "auto" \}\)/);
assert.match(surface, /Scroll sideways to compare options\. Selecting one updates the details below\./);
assert.match(surface, /role="region"[\s\S]*aria-label=\{`\$\{activeList\.length\} recommendation options`\}/);
assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.squibb-rec-surface__compare-cue \{[\s\S]*display: block/);

const gatesIndex = surface.indexOf("<HumanGateStrip gates={selected.humanGates} />");
const evidenceIndex = surface.indexOf("<EvidenceSection items={selected.evidence} />");
assert.ok(gatesIndex > -1 && evidenceIndex > gatesIndex, "review boundary must precede evidence in DOM order");

assert.equal(surface.match(/disabled=\{SAVE_CLOSED_BETA\}/g)?.length, 3);
assert.doesNotMatch(surface, /fetch\s*\(/);
assert.match(bellowsAvailability, /BELLOWS_INTAKE_SUBMISSION_OPEN = false/);
assert.match(discoveryAvailability, /DISCOVERY_INTAKE_SUBMISSION_OPEN = false/);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "canonical_dark_cockpit_foundation",
        "nested_decorative_wrappers_flattened",
        "selection_review_blocker_missing_disabled_states_are_distinct",
        "verified_green_is_reserved_for_success",
        "rules_score_uses_teal_only_gradient",
        "mobile_compare_cue_is_explicit",
        "deck_switch_resets_stale_mobile_scroll",
        "review_boundary_precedes_evidence",
        "closed_transports_remain_static"
      ]
    },
    null,
    2
  )
);
