import assert from "node:assert/strict";
import { decideEvidenceBrief } from "../../lib/bellows/evidence-brief-decision";

const fields = Object.freeze({ claim:"claim", decision:"decision", sources:"source dated today", supported:"fact", inference:"unknown", gap:"no contradiction found", change:"new source", next:"run one bounded check" });
const decide = (overrides = {}) => decideEvidenceBrief({ fields, freshness:"current_for_decision", contradiction:"none_identified", professionalReview:"not_identified", ...overrides });

assert.equal(decide().state, "ready_for_next_check");
assert.match(decide().detail, /not that the claim is verified or the decision is approved/i);
assert.equal(decide({ fields:{...fields, sources:""} }).state, "incomplete");
assert.deepEqual(decide({ fields:{...fields, sources:""} }).missing, ["sources"]);
assert.equal(decide({ contradiction:"unresolved" }).state, "contradiction");
assert.equal(decide({ contradiction:"unknown" }).state, "stale_or_unknown");
assert.equal(decide({ freshness:"stale" }).state, "stale_or_unknown");
assert.equal(decide({ freshness:"unknown" }).state, "stale_or_unknown");
assert.equal(decide({ professionalReview:"required" }).state, "human_review");
assert.equal(decide({ professionalReview:"unknown" }).state, "human_review");
assert.equal(Object.isFrozen(decide()), true);
assert.equal(Object.isFrozen(decide().missing), true);

console.log("Evidence Brief decision bridge: PASS");
