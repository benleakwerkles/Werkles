import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  answerGhostInteractionQuestion,
  buildGhostInteractionMember,
  ghostInteractionQuestionsFor,
  GHOST_INTERACTION_QUESTION_IDS
} from "../../lib/ghost-fleet/interaction.ts";
import type { GhostMember } from "../../lib/ghost-fleet/types.ts";

const fixture: GhostMember = {
  id: "ghost_fixture",
  synthetic: true,
  displayName: "Casey Sample",
  city: "Cleveland",
  region: "OH",
  lane: "Builder",
  roleLabel: "Cabinet maker",
  skills: ["Private skill"],
  offers: ["Build capacity", "Shop space"],
  seeks: ["Quoting help"],
  capitalPosture: "not_qualified",
  openToPartner: true,
  statedNeed: "private synthetic story",
  alreadyTried: "private attempt",
  timeCost: "private time",
  stuckDecision: "private decision",
  successTwelveMonths: "private goal",
  proofGaps: ["Identity not verified"],
  workshopHeadline: "private workshop headline",
  workshopRows: ["private row"],
  introEligibility: "review_required",
  handeyeSeat: "Bean",
  faceAsset: "/private.jpg",
  faceStatus: "placeholder"
};

const member = buildGhostInteractionMember(fixture);
assert.ok(member);
assert.deepEqual(Object.keys(member), [
  "id",
  "synthetic",
  "displayName",
  "lane",
  "roleLabel",
  "place",
  "openToPartner",
  "introEligibility",
  "offers",
  "seeks",
  "proofGaps",
  "fitReasons",
  "fitCautions"
]);
assert.equal(Object.isFrozen(member), true);
assert.equal(Object.isFrozen(member.offers), true);
assert.deepEqual(member.fitReasons, []);
assert.deepEqual(member.fitCautions, []);

const matchedMember = buildGhostInteractionMember(fixture, {
  rank: 2,
  orderReason: "Shown ahead of a near fit to add a meaningfully different kind of help.",
  proximityLabel: "Within 25 miles",
  reasons: [{ label: "Carries what is blocking you", detail: "Their stated coverage overlaps two blocker terms." }],
  cautions: ["Unverified: identity.", "Werkles cannot introduce anyone automatically."]
});
assert.ok(matchedMember);
assert.equal(matchedMember.rank, 2);
assert.match(matchedMember.orderReason ?? "", /meaningfully different kind of help/);
assert.equal(matchedMember.proximityLabel, "Within 25 miles");
assert.equal(matchedMember.fitReasons[0]?.label, "Carries what is blocking you");
assert.equal(matchedMember.fitCautions.length, 2);
assert.equal(Object.isFrozen(matchedMember.fitReasons), true);

const serialized = JSON.stringify(member);
for (const forbidden of [
  "Private skill",
  "private synthetic story",
  "private attempt",
  "private time",
  "private decision",
  "private goal",
  "private workshop headline",
  "private row",
  "/private.jpg",
  "Bean"
]) {
  assert.equal(serialized.includes(forbidden), false, `interaction DTO leaked ${forbidden}`);
}

for (const questionId of GHOST_INTERACTION_QUESTION_IDS) {
  const first = answerGhostInteractionQuestion(member, questionId);
  const second = answerGhostInteractionQuestion(member, questionId);
  assert.equal(first, second);
  assert.ok(first.length > 20);
}

const questions = ghostInteractionQuestionsFor(member);
assert.equal(questions.length, 4);
assert.match(questions[0].source, /stated offer/i);
assert.match(questions[1].source, /says they need/i);
assert.match(questions[2].source, /questions and cautions/i);
assert.match(questions[3].source, /possible builder role/i);
assert.match(questions[0].label, /Hey Casey, I see you bring extra build capacity/i);
assert.match(questions[0].label, /how could we use it in this Werkle/i);
assert.match(questions[1].label, /what would make this worth your time, Casey/i);
assert.match(questions[1].label, /what would you need from me/i);
assert.match(questions[2].label, /Before we promise each other anything/i);
assert.match(questions[2].label, /what would you want us to be clear about/i);
assert.match(questions[3].label, /Hey Casey/i);
assert.match(questions[3].label, /build together in two weeks/i);
assert.doesNotMatch(questions.map((question) => question.label).join(" "), /bring to the Werkle|carry/i);
assert.doesNotMatch(
  questions.map((question) => question.label).join(" "),
  /How could .* help this project|What would you need from me around|How would we clear up|Which part of the day-to-day/
);

const rawLabelMember = buildGhostInteractionMember({
  ...fixture,
  id: "plain-language",
  displayName: "Ava Salazar",
  offers: ["Chair space"],
  seeks: ["Ownership path"],
  proofGaps: ["Funds not verified"]
}, {
  reasons: [{ label: "Two-way, not extractive", detail: "The member and candidate may answer different parts of the same need." }]
});
assert.ok(rawLabelMember);
const rawLabelQuestions = ghostInteractionQuestionsFor(rawLabelMember).map((question) => question.label).join(" ");
assert.match(rawLabelQuestions, /Hey Ava, I see you bring access to workspace/i);
assert.match(rawLabelQuestions, /what would make this worth your time, Ava/i);
assert.doesNotMatch(rawLabelQuestions, /Chair space|Funds not verified|around Ownership/i);
assert.doesNotMatch(answerGhostInteractionQuestion(rawLabelMember, "open_questions"), /Funds not verified/i);

const backer = buildGhostInteractionMember({ ...fixture, id: "backer", lane: "Backer" });
assert.ok(backer);
assert.notDeepEqual(
  ghostInteractionQuestionsFor(backer).map((question) => question.label),
  questions.map((question) => question.label)
);
assert.match(answerGhostInteractionQuestion(backer, "first_question"), /one specific use for the money/i);
assert.match(answerGhostInteractionQuestion(backer, "first_question"), /whole Werkle at risk/i);

const voiceAnswers = ["a", "b", "c"].map((id) => {
  const variant = buildGhostInteractionMember({ ...fixture, id, displayName: `Person ${id}` });
  assert.ok(variant);
  return answerGhostInteractionQuestion(variant, "carry");
});
assert.equal(new Set(voiceAnswers).size, 3, "three profiles must not speak with one canned voice");

async function verifySource() {
  const page = await readFile("app/dashboard/intros/page.tsx", "utf8");
  const component = await readFile("components/ghost-fleet/ghost-member-interaction-lab.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");
  const privacy = await readFile("app/privacy/page.tsx", "utf8");

  assert.match(page, /matchGhostsForOwner\(ownerId, 9\)/);
  assert.match(page, /ghostMatches\?\.candidates[\s\S]*fleetById\.get\(candidate\.ghostId\)/);
  assert.match(page, /AccountAwareGhostMemberLab/);
  assert.match(component, /These are practice profiles, not real members/);
  assert.match(component, /before Werkles introduces anyone/);
  assert.match(component, /Compare \$\{members\.length\} useful possibilities/);
  assert.match(component, /Math\.min\(6, members\.length\)/);
  assert.match(component, /Math\.min\(current \+ 3, availableMembers\.length\)/);
  assert.match(component, /Show 3 More Profiles/);
  assert.match(component, /did not add weaker profiles to fill the deck/);
  assert.match(component, /How Werkles orders these matches/);
  assert.match(component, /#1 is the strongest current fit/);
  assert.match(component, /selected\.orderReason/);
  assert.match(component, /Practice questions and card clicks do not change the order/);
  assert.match(component, /Not a Fit for This Practice/);
  assert.match(component, /Hidden for this tab only\. This does not change your Intake, profile, or match ranking/);
  assert.match(component, /Restore Hidden Profiles/);
  assert.match(component, /members\.filter\(\(member\) => !dismissedIds\.has\(member\.id\)\)/);
  assert.doesNotMatch(component, /JSON\.stringify\(dismissedIds\)/);
  assert.doesNotMatch(component, /setItem\(["'][^"']*hidden/i);
  assert.match(component, /Your answers choose the people\. Their profile shapes the questions/);
  assert.match(component, /What would another person see about me/);
  assert.match(component, /buildPartnershipPreparationContext\(selected, transcript\)/);
  assert.match(component, /Bank balance, net worth, time spent on a card/);
  assert.match(component, /Current order #\{member\.rank\}/);
  assert.match(component, /not a compatibility percentage or a verdict/);
  assert.match(component, /Why this profile is here/);
  assert.match(component, /What could make this wrong/);
  assert.doesNotMatch(component, /fetch\(|sessionStorage|\/api\//);
  assert.match(component, /localStorage\.setItem\([\s\S]*PARTNERSHIP_PREPARATION_CONTEXT_KEY/);
  assert.match(component, /Prepare for a Future Conversation/);
  assert.match(css, /\.ghost-member-lab__questions button[\s\S]*min-height: 48px/);
  assert.match(css, /\.ghost-member-lab__profile p,[\s\S]*font-size: 16px/);
  assert.match(privacy, /What matching remembers—and what it does not watch/);
  assert.match(privacy, /Not used to rank people/);
  assert.match(privacy, /precise location inferred from your IP address/);
  assert.match(privacy, /temporary and do not retrain or reorder your/);
}

verifySource()
  .then(() => console.log("PASS Ghost Member interaction lab: ranked, synthetic, deterministic, local, readable"))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
