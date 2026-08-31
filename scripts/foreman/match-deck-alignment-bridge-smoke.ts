import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  buildPartnershipPreparationContext,
  partnershipPreparationContextFrom
} from "@/lib/bellows/partnership-preparation-context";
import type { GhostInteractionMember } from "@/lib/ghost-fleet/interaction";

const member: GhostInteractionMember = Object.freeze({
  id: "ghost-test-1",
  synthetic: true,
  displayName: "Rae Practice",
  lane: "Builder",
  roleLabel: "Fabricator",
  place: "Atlanta, GA",
  openToPartner: true,
  introEligibility: "open",
  offers: Object.freeze(["prototype fabrication"]),
  seeks: Object.freeze(["customer discovery"]),
  proofGaps: Object.freeze([]),
  fitReasons: Object.freeze([{ label: "Useful overlap", detail: "Fabrication touches the named blocker." }]),
  fitCautions: Object.freeze(["Identity remains unverified."])
});

const built = buildPartnershipPreparationContext(member, [{
  questionId: "carry",
  question: "What could you take responsibility for?",
  answer: "I would take one bounded fabrication task.",
  source: "Built from Rae's stated offer"
}]);
assert.equal(built.synthetic, true);
assert.equal(built.displayName, "Rae Practice");
assert.deepEqual(built.offers, ["prototype fabrication"]);
assert.match(built.fitReasons[0] ?? "", /Useful overlap/);
assert.match(built.fitCautions[0] ?? "", /unverified/);
assert.equal(built.version, 3);
assert.equal(built.practiceExchanges.length, 1);
assert.match(built.practiceExchanges[0]?.source ?? "", /stated offer/);
assert.equal(partnershipPreparationContextFrom(built)?.profileId, "ghost-test-1");
assert.equal(partnershipPreparationContextFrom({ ...built, synthetic: false }), null);
assert.equal(partnershipPreparationContextFrom({ ...built, surprise: "fail closed" }), null);
assert.equal(partnershipPreparationContextFrom({ ...built, offers: Array(5).fill("too many") }), null);
assert.equal(partnershipPreparationContextFrom({ ...built, fitReasons: Array(4).fill("too many") }), null);
assert.equal(partnershipPreparationContextFrom({ ...built, displayName: "x".repeat(101) }), null);
assert.equal(partnershipPreparationContextFrom({ ...built, practiceExchanges: Array(5).fill(built.practiceExchanges[0]) }), null);

const root = process.cwd();
const lab = fs.readFileSync(path.join(root, "components/ghost-fleet/ghost-member-interaction-lab.tsx"), "utf8");
const memo = fs.readFileSync(path.join(root, "components/bellows/partnership-alignment-memo.tsx"), "utf8");
assert.match(lab, /Prepare for a Future Conversation/);
assert.match(lab, /buildPartnershipPreparationContext\(selected, transcript\)/);
assert.match(lab, /openPreparation\("\/bellows\/personal\/partnership-alignment"\)/);
assert.match(lab, /Your answers choose the people\. Their profile shapes the questions/);
assert.match(lab, /What would another person see about me/);
assert.match(memo, /This is still a synthetic profile—not a real member or introduction/);
assert.match(memo, /Practice questions you already explored/);
assert.match(memo, /synthetic answers generated from the practice profile/);
assert.match(memo, /Werkles has not verified them and has not filled any answer for you/);
assert.match(memo, /Why Werkles put them here/);
assert.match(memo, /What could make the fit wrong/);

console.log("PASS Match Deck to Partnership Alignment context bridge");
