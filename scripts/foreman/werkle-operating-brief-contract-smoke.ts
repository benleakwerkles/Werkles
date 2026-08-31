import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createWerkleFormationDraft,
  type WerkleFormationDraft,
  type WerkleFormationSeed,
  type WerkleTopicDefinition,
  type WerkleTopicId
} from "../../lib/werkle/formation";
import { createWerkleOperatingBrief, firstSharedStepFromOperatingBrief, isWerkleOperatingBriefCurrent, openTopicsForOperatingBriefSection, WERKLE_OPERATING_BRIEF_BOUNDARY } from "../../lib/werkle/operating-brief";
import {
  createStoredWerkleOperatingBrief,
  storedWerkleOperatingBriefFrom,
  storedWerkleOperatingBriefHref
} from "../../lib/werkle/operating-brief-device";

const ids = [
  "purpose", "first_customer", "thirty_day_test", "roles", "decision_rights", "contributions",
  "money_questions", "proof_needs", "exit", "ip", "confidentiality", "unknowns"
] as const;

const definitions: WerkleTopicDefinition[] = ids.map((id) => ({
  id,
  group: ["purpose", "first_customer", "thirty_day_test"].includes(id)
    ? "foundation"
    : ["roles", "decision_rights", "contributions"].includes(id)
      ? "working_agreement"
      : "hard_edges",
  label: id,
  question: `Question for ${id}`,
  why: `Why ${id} matters`,
  floor: false,
  adviserGate: ["money_questions", "exit", "ip"].includes(id),
  ownerSource: { id: `owner-${id}`, author: "owner", text: `Owner ${id}`, origin: "Owner Workshop · self-reported" },
  partnerSource: { id: `partner-${id}`, author: "partner", text: `Partner ${id}`, origin: "Partner Workshop · generated practice profile" },
  partnerPosition: { choice: "combine", reason: `Partner reason for ${id}`, question: `Partner question for ${id}`, note: "" },
  suggestedJoint: `Generated joint ${id}`
}));

const seed: WerkleFormationSeed = {
  formationId: "operating-brief-test",
  partnerId: "ghost_test",
  storageKey: "operating-brief-test",
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

function patchTopic(
  draft: WerkleFormationDraft,
  id: WerkleTopicId,
  patch: Record<string, unknown>
): WerkleFormationDraft {
  return {
    ...draft,
    topics: { ...draft.topics, [id]: { ...draft.topics[id], ...patch } }
  } as WerkleFormationDraft;
}

let draft = createWerkleFormationDraft(seed);

draft = patchTopic(draft, "purpose", {
  choices: { owner: "owner", partner: "owner" },
  acceptedRevision: { owner: null, partner: null }
});
draft = patchTopic(draft, "roles", {
  choices: { owner: "partner", partner: "partner" },
  acceptedRevision: { owner: null, partner: null }
});
draft = patchTopic(draft, "decision_rights", {
  choices: { owner: "combine", partner: "combine" },
  acceptedRevision: { owner: 1, partner: 1 }
});
draft = patchTopic(draft, "contributions", {
  choices: { owner: "combine", partner: "combine" },
  jointText: "We will compare the time and tools each person can contribute before promising ownership.",
  revision: 2,
  acceptedRevision: { owner: 2, partner: 2 },
  notes: { owner: "PRIVATE_OWNER_NOTE", partner: "PRIVATE_PARTNER_NOTE" }
});
draft = patchTopic(draft, "money_questions", {
  choices: { owner: "owner", partner: "partner" }
});

const brief = createWerkleOperatingBrief(seed, draft);
const rows = brief.sections.flatMap((section) => section.rows);

assert.equal(brief.title, "Werkle Operating Brief");
assert.equal(brief.browserLocal, true);
assert.equal(brief.boundaryCopy, WERKLE_OPERATING_BRIEF_BOUNDARY);
assert.deepEqual(brief.sections.map((section) => section.label), [
  "Purpose / Customer / Test",
  "Who Does What",
  "Contributions / Shared Wording",
  "What We Said About Ideas & Privacy",
  "Pause / Exit / Open Unknowns"
]);
assert.ok(brief.sections.every((section) => section.emptyMessage === "Not yet written by both people."), "empty sections must remain explicit instead of inviting generated filler");
assert.deepEqual(rows.map((row) => row.topicId), ["purpose", "contributions"]);
assert.equal(rows[0].text, "Owner purpose", "a mutually selected member-authored source may enter the brief");
assert.deepEqual(rows[0].sourceTrail, ["Owner Workshop · self-reported"]);
assert.equal(rows[1].revision, 2, "a human-rewritten joint result keeps its real revision");
assert.deepEqual(rows[1].sourceTrail, ["Owner Workshop · self-reported", "Partner Workshop · generated practice profile"]);
assert.deepEqual(brief.sections.find((section) => section.id === "contributions_financial_proof")?.rows.map((row) => row.topicId), ["contributions"]);
assert.deepEqual(
  openTopicsForOperatingBriefSection("purpose_customer_test", seed, draft).map((topic) => [topic.topicId, topic.status]),
  [["first_customer", "proposed"], ["thirty_day_test", "proposed"]],
  "a partly completed section must expose its remaining conversations without copying their private content"
);
assert.deepEqual(
  openTopicsForOperatingBriefSection("contributions_financial_proof", seed, draft).map((topic) => [topic.topicId, topic.status]),
  [["money_questions", "objected"], ["proof_needs", "proposed"]],
  "accepted rows must not hide unresolved topics in the same section"
);
assert.deepEqual(firstSharedStepFromOperatingBrief(brief), {
  topicId: "purpose",
  label: "purpose",
  text: "Owner purpose",
  revision: 1,
  sourceTrail: ["Owner Workshop · self-reported"]
}, "the first shared step must repeat the first exact accepted row without inventing an owner or deadline");
assert.equal(firstSharedStepFromOperatingBrief(createWerkleOperatingBrief(seed, createWerkleFormationDraft(seed))), null, "no accepted row means no generated first step");

const serialized = JSON.stringify(brief);
assert.doesNotMatch(serialized, /Partner roles/, "synthetic partner-source wording must not enter the brief");
assert.doesNotMatch(serialized, /Generated joint decision_rights/, "an untouched generated joint suggestion must not enter the brief");
assert.doesNotMatch(serialized, /PRIVATE_OWNER_NOTE|PRIVATE_PARTNER_NOTE/, "private notes must not enter the brief");
assert.doesNotMatch(serialized, /money_questions/, "objected adviser topics must not enter the brief");
assert.doesNotMatch(serialized, /acceptedRevision|choices|events/, "the brief must not expose internal consent mechanics or history");
assert.doesNotMatch(serialized, /Weekly sync|Daily check-in|30-day notice|either party may exit/i, "the brief must not invent cadence or exit defaults");
assert.equal(JSON.stringify(createWerkleOperatingBrief(seed, draft)), serialized, "composition must be deterministic");

const sourceRevisionKey = brief.sourceRevisionKey;
const changedDraft = patchTopic(draft, "purpose", {
  choices: { owner: "combine", partner: "combine" },
  jointText: "A changed member-authored purpose.",
  revision: 2,
  acceptedRevision: { owner: 2, partner: 2 }
});
assert.notEqual(createWerkleOperatingBrief(seed, changedDraft).sourceRevisionKey, sourceRevisionKey, "a changed accepted source must produce a new refresh key");
assert.equal(isWerkleOperatingBriefCurrent(brief, seed, draft), true, "the current source snapshot must validate");
assert.equal(isWerkleOperatingBriefCurrent(brief, seed, changedDraft), false, "a changed source must mark a saved brief stale until refreshed");

const stored = createStoredWerkleOperatingBrief(seed.partnerId, brief);
assert.equal(storedWerkleOperatingBriefFrom(JSON.parse(JSON.stringify(stored)))?.brief.sourceRevisionKey, brief.sourceRevisionKey, "a valid exact accepted-only brief may return from device storage");
assert.equal(storedWerkleOperatingBriefHref(stored), "/dashboard/werkles/formation?candidate=ghost_test#werkle-operating-brief-title");
assert.equal(storedWerkleOperatingBriefFrom({ ...stored, candidateId: "../../other-room" }), null, "a stored artifact cannot forge a cross-route candidate path");
assert.equal(storedWerkleOperatingBriefFrom({ ...stored, brief: { ...brief, sections: [] } }), null, "a malformed device artifact must fail closed");

const implementationSource = readFileSync(new URL("../../lib/werkle/operating-brief.ts", import.meta.url), "utf8");
assert.doesNotMatch(implementationSource, /partner-perspective|sessionStorage|localStorage|match(?:ing)?\//i, "the pure source contract must not read private exercises, browser custody, or matching");

const rendererSource = readFileSync(new URL("../../components/werkle/formation-workbench.tsx", import.meta.url), "utf8");
assert.match(rendererSource, /isWerkleOperatingBriefCurrent\(operatingBrief, seed, draft\)/, "the renderer must compare its snapshot with the current Formation source");
assert.match(rendererSource, /operatingBrief && operatingBriefIsCurrent/, "the renderer must hide stale brief sections");
assert.match(rendererSource, /disabled=\{!operatingBrief \|\| !operatingBriefIsCurrent\}/, "copy must remain disabled until a current brief exists");
assert.match(rendererSource, /The answers changed\. Update the brief before copying it\./, "copy must fail closed after Formation changes");
assert.match(rendererSource, /Update with our latest answers/, "the update control must use member language instead of internal Formation jargon");
assert.match(rendererSource, /updated an answer/, "a stale brief must explain which participant changed an answer");
assert.match(rendererSource, /Copying it does not make it an agreement\./, "successful copy must repeat the non-agreement boundary");
assert.match(rendererSource, /Save on this device/, "members need a revisitable device-local payoff rather than copy-only output");
assert.match(rendererSource, /saved device brief was removed/, "a changed accepted answer must invalidate the saved snapshot");
assert.match(rendererSource, /older brief and shared-action draft were removed/, "a changed accepted answer must invalidate its derived shared action too");
assert.match(rendererSource, /Operating Brief restored from this device and checked against the current accepted wording/, "the device save must complete a validated return trip instead of becoming a dead pointer");
assert.match(rendererSource, /isWerkleOperatingBriefCurrent\(storedBrief\.brief, seed, parsed\)/, "restoration must validate the saved Brief against the restored Formation source");
assert.match(rendererSource, /Still to settle/, "the renderer must identify gaps inside partly completed sections");
assert.match(rendererSource, /Start with the first thing you both actually accepted/, "the brief must turn accepted wording into an immediate conversation payoff");
assert.match(rendererSource, /Werkles will not invent the owner, deadline, or promise/, "the first shared step must preserve member authority");
assert.doesNotMatch(rendererSource.slice(rendererSource.indexOf('async function copyOperatingBrief'), rendererSource.indexOf('const timeline')), /notes\[|PartnerPerspective|predictions|events\b|acceptedRevision/, "copy must use only the sanitized Operating Brief contract");

const personalBellowsShelf = readFileSync(new URL("../../components/bellows/bellows-device-draft-shelf.tsx", import.meta.url), "utf8");
assert.match(personalBellowsShelf, /isWerkleFirstSharedActionCurrent\(parsedAction, currentFormationId, currentSharedStep\)/, "Personal Bellows must not restore an action unless it still matches the current saved accepted wording");

console.log("PASS Werkle Operating Brief contract: accepted member-authored wording only; synthetic, generated, private, objected, and internal consent state excluded; deterministic browser-local result.");
