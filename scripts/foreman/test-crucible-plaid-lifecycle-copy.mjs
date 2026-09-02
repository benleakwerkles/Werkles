import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { plaidLinkLifecycleCopy } from "../../lib/crucible-plaid-lifecycle-copy.ts";
import { EXTERNAL_LINK_LIFECYCLE_STATES } from "../../lib/verification/external-link-lifecycle.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const expected = {
  loading: "Getting Plaid’s sandbox ready…",
  open: "Plaid’s sandbox is open. Finish there, or close it to come back.",
  exited: "You closed Plaid. That’s okay—nothing was saved, and you can open it again.",
  failed: "Plaid couldn’t continue. Nothing was saved, and you can try again.",
  "completed-not-saved":
    "You finished in Plaid’s sandbox. Werkles saved no connection or funds proof."
};

assert.deepEqual(EXTERNAL_LINK_LIFECYCLE_STATES, Object.keys(expected));
for (const state of EXTERNAL_LINK_LIFECYCLE_STATES) {
  const value = plaidLinkLifecycleCopy(state);
  assert.equal(value, expected[state]);
  assert.ok(value.length < 100, `${state} copy must remain short`);
  for (const forbidden of [
    /token|callback|sdk|metadata|request.?id/i,
    /provider|configuration|error|failed|failure/i,
    /verified|verification|trust|safe/i,
    /account|balance|institution|financial data/i,
    /stored|storage/i
  ]) {
    assert.doesNotMatch(value, forbidden, `${state} leaked a code word or unsupported implication`);
  }
}
assert.match(expected.exited, /That’s okay/);
assert.match(expected.exited, /open it again/);
assert.match(expected.failed, /try again/);
assert.match(expected["completed-not-saved"], /saved no connection or funds proof/);

const panel = await readFile(
  path.join(repoRoot, "components/crucible/crucible-panel.tsx"),
  "utf8"
);
assert.match(panel, /plaidLinkLifecycleCopy\(snapshot\.state\)/);
assert.match(panel, /plaidLifecycleHandled = true/);
assert.match(
  panel,
  /catch \{\s+if \(plaidLifecycleHandled\) return;/,
  "sanitized terminal copy must not be replaced with launcher errors"
);
assert.doesNotMatch(
  panel,
  /error instanceof Error \? error\.message/,
  "thrown SDK, network, and duplicate-launch details must not reach member copy"
);
assert.match(
  panel,
  /finally \{\s+setBusyKey\(null\);\s+\}/,
  "every terminal outcome must restore the existing action"
);
assert.match(panel, /<p className="status-line" role="status">\{status\}<\/p>/);

console.log("Crucible Plaid lifecycle copy/UI contract: PASS");
