import assert from "node:assert/strict";

import { createWerkleFirstSharedAction } from "../../lib/werkle/first-shared-action";
import {
  createWerkleSharedActionResult,
  isWerkleSharedActionResultCurrent,
  werkleSharedActionResultFrom
} from "../../lib/werkle/shared-action-result";

const step = Object.freeze({
  topicId: "purpose" as const,
  label: "Purpose",
  text: "We will test one repair offer with three reachable customers.",
  revision: 2,
  sourceTrail: Object.freeze(["Your Workshop", "Practice partner Workshop"])
});
const action = createWerkleFirstSharedAction("m13-contract", step, {
  action: "Explain the offer to three reachable customers.",
  volunteer: "Ben",
  checkIn: "2026-09-03",
  doneWhen: "Three exact listener summaries are recorded."
}, "2026-08-24T01:00:00.000Z");
const result = createWerkleSharedActionResult(action, {
  observed: "Two people described the offer correctly; one thought it included installation.",
  interpretation: "The service boundary may be unclear.",
  nextDecision: "Decide whether installation belongs in the first offer."
}, "2026-08-24T02:00:00.000Z");

assert.equal(isWerkleSharedActionResultCurrent(result, action), true);
assert.equal(werkleSharedActionResultFrom(result)?.observed, result.observed);
assert.equal(werkleSharedActionResultFrom({ ...result, inventedConsent: true }), null, "unknown fields must fail closed");
assert.equal(werkleSharedActionResultFrom({ ...result, recordedAt: "not-a-date" }), null, "malformed timestamps must fail closed");
assert.throws(() => createWerkleSharedActionResult(action, { observed: "", interpretation: "", nextDecision: "Talk later" }), /invalid/, "an empty observation must not save");

const changedAction = createWerkleFirstSharedAction("m13-contract", step, {
  action: "Explain a narrower offer to three reachable customers.",
  volunteer: "Ben",
  checkIn: "2026-09-03",
  doneWhen: "Three exact listener summaries are recorded."
}, "2026-08-24T03:00:00.000Z");
assert.equal(isWerkleSharedActionResultCurrent(result, changedAction), false, "a changed proposed action must invalidate the older result");

console.log("PASS Werkle shared-action result contract: exact schema, required observation and next decision, malformed input rejection, and stale-action invalidation.");
