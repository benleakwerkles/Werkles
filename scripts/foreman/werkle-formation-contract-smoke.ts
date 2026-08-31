import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createWerkleFormationDraft,
  restoreWerkleFormationDraft,
  werkleActiveStatement,
  werkleFormationSummary,
  werkleTopicStatus,
  type WerkleFormationDraft,
  type WerkleFormationSeed,
  type WerkleTopicDefinition,
  type WerkleTopicId
} from "../../lib/werkle/formation";

const ids = [
  "purpose", "first_customer", "thirty_day_test", "roles", "decision_rights", "contributions",
  "money_questions", "proof_needs", "exit", "ip", "confidentiality", "unknowns"
] as const;

const definitions: WerkleTopicDefinition[] = ids.map((id) => ({
  id,
  group: ["purpose", "first_customer", "thirty_day_test"].includes(id) ? "foundation" : ["roles", "decision_rights", "contributions"].includes(id) ? "working_agreement" : "hard_edges",
  label: id,
  question: `Question for ${id}`,
  why: `Why ${id} matters`,
  floor: ["purpose", "first_customer", "thirty_day_test", "roles", "decision_rights", "exit"].includes(id),
  adviserGate: ["contributions", "money_questions", "proof_needs", "exit", "ip", "confidentiality", "unknowns"].includes(id),
  ownerSource: { id: `owner-${id}`, author: "owner", text: `Owner ${id}`, origin: "Owner Workshop" },
  partnerSource: { id: `partner-${id}`, author: "partner", text: `Partner ${id}`, origin: "Partner Workshop" },
  partnerPosition: { choice: "combine", reason: `Partner reason for ${id}`, question: `Partner question for ${id}`, note: "" },
  suggestedJoint: `Joint ${id}`
}));

const seed: WerkleFormationSeed = {
  formationId: "formation-test",
  partnerId: "ghost_test",
  storageKey: "formation-test-key",
  ownerLabel: "You",
  partnerLabel: "Imani",
  partnerSynthetic: true,
  partnerProfile: {
    summary: "Synthetic test profile", workPace: "Steady", followThrough: "Written dates",
    decisionStyle: "Small tests", disagreementStyle: "Direct questions", availability: "Weekly",
    contributionPosture: "Skill and time", financialScenario: "Synthetic and unverified"
  },
  reasonForTable: "Complementary work",
  definitions
};

function withTopic(draft: WerkleFormationDraft, id: WerkleTopicId, patch: Record<string, unknown>): WerkleFormationDraft {
  return {
    ...draft,
    topics: { ...draft.topics, [id]: { ...draft.topics[id], ...patch } }
  } as WerkleFormationDraft;
}

let draft = createWerkleFormationDraft(seed);
assert.equal(werkleTopicStatus(draft.topics.purpose), "proposed", "A prefilled partner proposal is not mutual agreement");
assert.equal(werkleActiveStatement(definitions[0], draft.topics.purpose), null, "No one-sided proposal enters the shared floor");

draft = withTopic(draft, "purpose", {
  choices: { owner: "combine", partner: "combine" },
  acceptedRevision: { owner: null, partner: 1 }
});
assert.equal(werkleTopicStatus(draft.topics.purpose), "proposed", "Matching combine choices still require exact-text acceptance");

draft = withTopic(draft, "purpose", { acceptedRevision: { owner: 1, partner: 1 } });
assert.equal(werkleTopicStatus(draft.topics.purpose), "accepted");
assert.equal(werkleActiveStatement(definitions[0], draft.topics.purpose), "Joint purpose");

draft = withTopic(draft, "purpose", {
  jointText: "Rewritten purpose",
  revision: 2,
  acceptedRevision: { owner: null, partner: null }
});
assert.equal(werkleTopicStatus(draft.topics.purpose), "proposed", "A rewrite resets mutual acceptance");

draft = withTopic(draft, "decision_rights", { choices: { owner: "owner", partner: "partner" } });
assert.equal(werkleTopicStatus(draft.topics.decision_rights), "objected", "Different answers remain an explicit objection");
assert.equal(werkleActiveStatement(definitions[4], draft.topics.decision_rights), null, "Disputed language never enters the shared floor");

draft = withTopic(draft, "ip", { choices: { owner: "private", partner: "private" } });
assert.equal(werkleTopicStatus(draft.topics.ip), "private", "Mutual privacy keeps source material out of the Werkle");

const restored = restoreWerkleFormationDraft(JSON.parse(JSON.stringify(draft)), seed);
assert.ok(restored, "A valid versioned draft restores");
assert.equal(restored?.topics.decision_rights.choices.owner, "owner");
assert.equal(restoreWerkleFormationDraft({ ...draft, version: 99 }, seed), null, "Unknown versions fail closed");
assert.equal(restoreWerkleFormationDraft({ ...draft, formationId: "another-room" }, seed), null, "A draft cannot cross room identity");

const summary = werkleFormationSummary(seed, draft);
assert.equal(summary.counts.objected, 1);
assert.equal(summary.floorReady, false, "The floor cannot be ready while required topics remain unresolved");
assert.equal(summary.adviserReady, false, "Keeping an adviser-gate topic private cannot masquerade as a complete adviser handoff");

const formationPage = readFileSync(new URL("../../app/dashboard/werkles/formation/page.tsx", import.meta.url), "utf8");
const formationCss = readFileSync(new URL("../../app/dashboard/werkles/formation/werkle-formation.css", import.meta.url), "utf8");
const formationWorkbench = readFileSync(new URL("../../components/werkle/formation-workbench.tsx", import.meta.url), "utf8");
const perspectiveExercise = readFileSync(new URL("../../components/werkle/partner-perspective-exercise.tsx", import.meta.url), "utf8");
assert.match(formationPage, /self-reported, not verified/, "member Intake sources must remain visibly self-reported");
assert.match(formationPage, /practice profile, not verified/, "synthetic partner sources must remain visibly unverified");
assert.doesNotMatch(
  formationPage,
  /suggestedJoint: `We are testing whether \$\{ownerPurpose/,
  "raw Intake prose must not be spliced into polished-looking joint language"
);
for (const id of ["owner-authority", "owner-money", "owner-exit", "owner-ip", "owner-confidentiality"]) {
  assert.match(
    formationPage,
    new RegExp(`source\\("${id}", "owner", "", ownerOrigin`),
    `${id} must stay unanswered instead of attributing a Werkles-authored statement to the member`
  );
}

assert.match(formationCss, /--wf-copper-bright:\s*#f2b66d/, "dark formation surfaces need a high-contrast copper signal");
assert.match(formationCss, /\.werkle-formation-page \.workshop-eyebrow[\s\S]*?color:\s*var\(--wf-copper-bright\) !important/, "global eyebrow styles must not turn formation labels dark on purple");
assert.doesNotMatch(formationCss, /font-size:\s*0\.78rem/, "formation labels must not regress to the old 12.48px size");
for (const selector of ["werkle-dashboard__readiness small", "werkle-studio__state small", "werkle-merge-canvas__source > small", "werkle-floor__statement small", "werkle-save small"]) {
  assert.match(formationCss, new RegExp(`\\.${selector.replace(" ", "\\s+")}[^{]*\\{[^}]*font-size:\\s*1rem`), `${selector} must remain readable at 16px or larger`);
}
assert.match(formationWorkbench, /className="werkle-trust-rail"/, "the long formation room needs a persistent trust hierarchy");
assert.match(formationWorkbench, /Only exact wording accepted by both people enters the shared room/, "the mutual-consent rule must stay visible");
assert.match(formationWorkbench, /No compatibility score is calculated/, "the qualitative formation readout must not imply a compatibility score");
assert.match(formationWorkbench, /activeStatus === "accepted" \? "Mutual wording" : "Not mutual yet"/, "the active topic must expose whether wording is actually mutual");
assert.match(formationWorkbench, /function withdrawPendingChoice/, "a proposer must be able to retract a pending answer before mutual acceptance");
assert.match(formationWorkbench, /eventNow\(topicId, actor, "withdraw"/, "withdrawal must remain in formation history");
assert.match(formationWorkbench, /eventNow\(topicId, actor, "note", note\)/, "an objection note must remain in formation history after the topic later changes state");
assert.match(formationWorkbench, /className="werkle-topic-index"/, "all formation topics must remain reachable through a visible index");
assert.match(formationWorkbench, /Your Workshop[\s\S]*What \{seed\.partnerLabel\} says[\s\S]*Shared Werkle/, "the formation canvas must visibly preserve the member source, synthetic partner answer, and shared Werkle");
assert.match(formationWorkbench, /PartnerPerspectiveExercise/, "formation must include the private partner-perspective exercise");
assert.match(formationWorkbench, /You answer for you\. \{seed\.partnerLabel\} answers from a fictional profile/, "the member must never be asked to impersonate the synthetic partner");
assert.match(formationWorkbench, /you cannot edit or impersonate them/, "the synthetic-partner custody boundary must be explicit");
assert.match(formationWorkbench, /Generated practice opinion · synthetic and unverified/, "every visible Ghost opinion must carry a point-of-use disclosure");
assert.doesNotMatch(formationWorkbench, /Try \{seed\.partnerLabel\}.*side \(practice only\)/, "the old tester impersonation switch must not return");
assert.doesNotMatch(formationWorkbench, />Review as \{seed\.partnerLabel\}/, "real-looking review-as-partner language must not return");
assert.match(perspectiveExercise, /window\.sessionStorage/, "private predictions must stay in tab-session custody");
assert.doesNotMatch(perspectiveExercise, /window\.localStorage/, "private predictions must not silently persist in localStorage");
assert.match(perspectiveExercise, /Your side/, "practice writing must be attributed to the member");
assert.match(perspectiveExercise, /Generated practice data/, "generated content must be framed as practice data rather than another person's answer");
assert.match(perspectiveExercise, /never presented as something \{partnerLabel\} said/, "generated content must explicitly deny that it is the other person's answer");
assert.match(perspectiveExercise, /not supplied by \{partnerLabel\}/, "synthetic answers must stay visibly synthetic");
assert.match(perspectiveExercise, /not a score, compatibility claim/, "the exercise must reject aggregate scoring");
assert.match(perspectiveExercise, /Clear my exercise/, "the member must be able to delete the tab-local exercise immediately");

console.log("PASS Werkle formation contract: provenance sources honest; raw Intake not laundered into joint copy; unilateral proposals excluded; exact-text consent required; rewrites reset approval; objections and privacy remain explicit; private predictions remain session-bound and never impersonate the synthetic partner; restore fails closed; formation labels remain readable and the trust hierarchy stays visible.");
