import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { memberWorkLocation } from "../../lib/member-work-location";

assert.equal(memberWorkLocation("workshop").stage, "Your Workshop");
assert.equal(memberWorkLocation("match_deck").stage, "Match Deck");
assert.equal(memberWorkLocation("formation", false).stage, "Possible Werkle");
assert.equal(memberWorkLocation("formation", true).stage, "Existing Werkle on this device");
assert.notEqual(memberWorkLocation("formation", false).id, memberWorkLocation("formation", true).id);

const component = readFileSync("components/foundry/member-work-location-readout.tsx", "utf8");
assert.match(component, /This tells you which room you are in/);
assert.match(component, /does not mean another person responded, agreed, paid, or joined a company/);
assert.match(component, /storedWerkleOperatingBriefFrom/);
assert.match(component, /WERKLE_OPERATING_BRIEF_CHANGE_EVENT/);

const formation = readFileSync("components/werkle/formation-workbench.tsx", "utf8");
assert.match(formation, /dispatchEvent\(new Event\(WERKLE_OPERATING_BRIEF_CHANGE_EVENT\)\)/);

console.log("PASS mutually exclusive member work-location contract");

