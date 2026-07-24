/**
 * Focused VPG11 proof for the public mobile shell and Matching interaction semantics.
 * Run: node scripts/foreman/test-matching-mobile-semantics-vpg11-20260717.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const globals = read("app/globals.css");
const intakeForm = read("components/squibb/concierge-intake-form.tsx");
const recommendationSurface = read("components/squibb/recommendation-surface.tsx");
const recommendationCard = read("components/squibb/recommendation-card.tsx");
const bellowsAvailability = read("lib/squibb/concierge-intake-availability.ts");
const discoveryAvailability = read("lib/discovery/intake-availability.ts");
const vercelConfig = JSON.parse(read("vercel.json"));

const mobileHeaderStart = globals.indexOf("@media (max-width: 820px) {");
const mobileHeaderEnd = globals.indexOf(".static-proof-shell", mobileHeaderStart);
assert.ok(mobileHeaderStart > -1 && mobileHeaderEnd > mobileHeaderStart);
const mobileHeader = globals.slice(mobileHeaderStart, mobileHeaderEnd);
assert.match(mobileHeader, /\.site-header,[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
assert.match(mobileHeader, /\.site-header nav \{[\s\S]*flex-wrap: wrap/);
assert.match(mobileHeader, /overflow-x: visible/);
assert.match(mobileHeader, /min-height: 44px/);
assert.match(mobileHeader, /\.site-header a:focus-visible[\s\S]*outline: 3px solid/);
assert.match(globals, /@media \(max-width: 620px\)[\s\S]*\.discovery-hero > \* \{[\s\S]*min-width: 0/);
assert.match(globals, /\.discovery-hero \.hero-actions \{[\s\S]*flex-wrap: wrap/);

const contentSecurityPolicy = vercelConfig.headers[0].headers.find(
  (header) => header.key === "Content-Security-Policy"
)?.value;
assert.match(contentSecurityPolicy, /style-src[^;]*https:\/\/fonts\.googleapis\.com/);
assert.match(contentSecurityPolicy, /font-src 'self' https:\/\/fonts\.gstatic\.com/);
assert.doesNotMatch(contentSecurityPolicy, /vercel\.live/);

assert.match(intakeForm, /const hintId = `\$\{question\.id\}-hint`/);
assert.match(intakeForm, /const countId = `\$\{question\.id\}-count`/);
assert.match(intakeForm, /aria-describedby=\{`\$\{hintId\} \$\{countId\}`\}/);
assert.doesNotMatch(intakeForm, /concierge-intake__count" aria-live/);

assert.match(recommendationSurface, /role="group" aria-label="Recommendation deck view"/);
assert.equal(recommendationSurface.match(/aria-pressed=\{view ===/g)?.length, 2);
assert.equal(recommendationSurface.match(/aria-controls=\{RECOMMENDATION_COLLECTION_ID\}/g)?.length, 2);
assert.doesNotMatch(recommendationSurface, /role="tab(?:list)?"|aria-selected/);
assert.match(recommendationSurface, /role="status" aria-atomic="true"/);
assert.doesNotMatch(recommendationSurface, /role="status" aria-live=/);
assert.match(recommendationSurface, /\{selectionAnnouncement\}/);
assert.match(recommendationSurface, /id=\{RECOMMENDATION_COLLECTION_ID\}/);
assert.match(recommendationSurface, /id=\{RECOMMENDATION_DETAIL_ID\}/);
assert.match(recommendationCard, /aria-controls=\{detailId\}/);
assert.match(recommendationCard, /aria-describedby=\{descriptionIds\}/);

assert.match(bellowsAvailability, /BELLOWS_INTAKE_SUBMISSION_OPEN = false/);
assert.match(discoveryAvailability, /DISCOVERY_INTAKE_SUBMISSION_OPEN = false/);
assert.doesNotMatch(recommendationSurface, /fetch\s*\(/);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "mobile_header_stacks_without_new_navigation",
        "mobile_header_targets_are_44px",
        "mobile_header_focus_is_explicit",
        "discovery_hero_is_contained_at_phone_width",
        "font_csp_matches_declared_google_font_sources",
        "bellows_hints_and_counts_are_described",
        "bellows_counters_are_not_live_regions",
        "recommendation_switcher_uses_native_pressed_buttons",
        "recommendation_collection_and_detail_are_associated",
        "closed_intake_and_save_boundaries_remain_static"
      ]
    },
    null,
    2
  )
);
