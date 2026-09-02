import assert from "node:assert/strict";

import { sharedDecisionState, surfaceResponsibility } from "../../lib/opportunities/resource-lifecycle";

assert.equal(sharedDecisionState({ you: "interested", partner: "interested" }), "accepted_for_shared_work");
assert.equal(sharedDecisionState({ you: "interested", partner: "undecided" }), "shared_proposal");
assert.equal(sharedDecisionState({ you: "interested", partner: "not_for_us" }), "dismissed");

assert.notEqual(surfaceResponsibility("bellows"), surfaceResponsibility("workshop"));
assert.notEqual(surfaceResponsibility("workshop"), surfaceResponsibility("werkle"));

console.log("RESOURCE_LIFECYCLE_CONTRACT_SMOKE_OK");
