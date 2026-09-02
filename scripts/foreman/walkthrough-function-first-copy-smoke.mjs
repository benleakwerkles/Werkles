import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

const intakePage = read("app/bellows/intake/page.tsx");
const intakeForm = read("components/squibb/concierge-intake-form.tsx");
const intakeModel = read("lib/squibb/concierge-intake-v0.ts");
const recommendations = read("components/squibb/recommendation-surface.tsx");
const snapshot = read("components/squibb/source-document-panel.tsx");
const shadowAdapter = read("lib/matching/shadow-to-recommendations.ts");
const matchDeck = read("app/dashboard/intros/page.tsx");
const workshop = read("app/dashboard/blueprints/page.tsx");
const workshopState = read("components/workshop/account-aware-workshop-state.tsx");

assert.match(intakePage, /people-boxes-through-door\.jpg/);
assert.match(intakePage, /concierge-intake-page__guide-photo/);
assert.match(intakeModel, /CONCIERGE_INTAKE_GOAL_FIELD_LIMIT = 1600/);
assert.match(intakeForm, /maxLength=\{INTAKE_GOAL_FIELD_MAX\}/);

assert.doesNotMatch(recommendations, /Intake:<\/strong> received and used/);
assert.match(recommendations, /Ideas Based on Your Answers|pageState\.eyebrow/);
assert.match(recommendations, /Open My Workshop/);
assert.match(recommendations, /Open My Bellows/);
assert.match(recommendations, /Choose what this recommendation needs next\./);
assert.doesNotMatch(recommendations, /Or Compare People in Match Deck/);
assert.doesNotMatch(recommendations, /<SourceDocumentPanel/);
assert.doesNotMatch(recommendations, /No recommendation options saved yet/);
assert.match(recommendations, /Working recommendation drafts stay on this device/);
assert.match(recommendations, /Why this came first/);
assert.match(recommendations, /Start here/);
assert.doesNotMatch(recommendations, /Why This Came First|What held it down|Selected option readout/);
assert.doesNotMatch(snapshot, /Werkles received it and used it/);
assert.doesNotMatch(shadowAdapter, /Your local Pooka/);

const candidatesIndex = matchDeck.indexOf('<div id="match-deck-candidates">');
const explanationIndex = matchDeck.indexOf("<AccountAwareIntrosReadout");
assert.ok(candidatesIndex >= 0 && candidatesIndex < explanationIndex, "Match candidates must precede the explanation readout");

const currentWorkshopIndex = workshop.indexOf('<div id="current-workshop">');
const workshopExplainerIndex = workshop.indexOf('<section className="workshop-room"');
assert.ok(
  currentWorkshopIndex >= 0 && currentWorkshopIndex < workshopExplainerIndex,
  "The member's current Workshop must precede the generic Workshop explainer"
);
assert.match(workshop, /Use the work already in your Workshop/);
assert.match(workshopState, /Any money available for this work has not been checked yet/);
assert.doesNotMatch(workshopState, /Intros comes later|rule-derived, not a diagnosis|Unknown stays unknown/);

console.log("Walkthrough function-first copy contract: PASS");
