import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { getRecommendationPageState } from "../../lib/squibb/recommendation-page-state.ts";

const repoRoot = process.cwd();
const surface = readFileSync(path.join(repoRoot, "components/squibb/recommendation-surface.tsx"), "utf8");
const card = readFileSync(path.join(repoRoot, "components/squibb/recommendation-card.tsx"), "utf8");
const css = readFileSync(path.join(repoRoot, "app/bellows/recommendations/squibb-recommendations.css"), "utf8");
const publicLoader = readFileSync(
  path.join(repoRoot, "lib/squibb/public-recommendation-session-server.ts"),
  "utf8"
);
const page = readFileSync(path.join(repoRoot, "app/bellows/recommendations/page.tsx"), "utf8");
const recommendations = readFileSync(path.join(repoRoot, "lib/squibb/recommendations.ts"), "utf8");

assert.deepEqual(
  getRecommendationPageState({ source: { mode: "demo" }, rankedCount: 0, hasPublishedSourceDocument: false }),
  {
    state: "empty",
    eyebrow: "Tell Werkles about your goal first",
    body:
      "Personalized options stay empty until you answer the Werkles questions. All options is the general catalog, not a personal list.",
    actionLabel: "Tell Werkles About My Goal"
  }
);
assert.equal(
  getRecommendationPageState({
    source: { mode: "latest_intake" },
    rankedCount: 0,
    hasPublishedSourceDocument: false
  }).state,
  "intake"
);
assert.equal(
  getRecommendationPageState({
    source: { mode: "latest_intake" },
    rankedCount: 3,
    hasPublishedSourceDocument: false
  }).body,
  ""
);
assert.match(
  getRecommendationPageState({ source: { mode: "demo" }, rankedCount: 3, hasPublishedSourceDocument: true }).body,
  /published source document.*not a personal intake/
);

assert.doesNotMatch(surface, /Example only/i);
assert.doesNotMatch(publicLoader, /Example only/i);
assert.doesNotMatch(page, /test-case-0|Test Case #0/);
assert.doesNotMatch(recommendations, /This example is not yet grounded/);
assert.match(recommendations, /This option is not grounded in your intake yet/);
assert.match(surface, /className="squibb-rec-surface__state" data-state=\{pageState\.state\}/);
assert.doesNotMatch(surface, /role="tablist"|role="tab"|aria-selected=/);
assert.match(surface, /role="group" aria-label="Recommendation deck view"/);
assert.match(surface, /aria-pressed=\{view === "ranked"\}/);
assert.match(surface, /aria-pressed=\{view === "catalog"\}/);
assert.doesNotMatch(surface, /if \(!selected\) return null/);
assert.match(surface, /No recommendation options are available/);
assert.match(surface, /Use the path below to leave with something useful/);
assert.match(surface, /This page can build, save on this device, and copy your working draft/);
assert.match(surface, /It does not contact a provider, submit an application, or start an introduction/);
assert.match(surface, /className="squibb-rec-surface__detail squibb-rec-surface__detail--selected panel"/);
assert.match(surface, /className="squibb-rec-detail__selection-note" role="status"/);
assert.doesNotMatch(surface, /Save this option|Ask what proof is needed|aria-label="Recommendation actions"/);
assert.match(surface, /nothing is sent to anyone/);
assert.match(surface, /Open My Workshop/);
assert.match(surface, /Or Compare People in Match Deck/);

assert.match(card, /<button[\s\S]*aria-pressed=\{selected\}/);
assert.match(card, /className="squibb-rec-card__action" aria-hidden="true"/);
assert.match(card, /selected \? "Selected readout" : "View readout"/);

assert.match(css, /\.squibb-rec-card\s*\{[^}]*background: #332820[^}]*cursor: pointer/);
assert.doesNotMatch(css.match(/\.squibb-rec-card\s*\{[^}]*\}/)?.[0] ?? "", /linear-gradient|box-shadow/);
assert.match(css, /\.squibb-rec-card__action\s*\{[^}]*border-radius: 999px[^}]*font-weight: 700/);
assert.match(css, /\.squibb-rec-card--selected\s*\{[^}]*border: 2px solid[^}]*background: #263b2b[^}]*transform:/);
assert.match(css, /\.squibb-rec-surface__detail--selected\s*\{[^}]*border: 2px solid[^}]*box-shadow:/);
assert.match(css, /\.squibb-rec-detail__selection-note\s*\{[^}]*background:/);
assert.match(surface, /className="squibb-rec-compass"/);
assert.match(surface, /people-partners-cafe\.png/);
assert.match(surface, /Two people comparing ideas together/);
assert.match(card, /className="squibb-rec-card__medallion"/);

console.log("Recommendation selection UX contract: PASS");
