import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { crucibleCardAction } from "../../lib/crucible-card-action.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const base = {
  checkKey: "identity",
  checkTitle: "Identity",
  defaultLabel: "Inspect Identity",
  hasRoute: true,
  hasHandler: true
};

assert.deepEqual(crucibleCardAction({ ...base, state: "ready_to_start" }), {
  label: "Inspect Identity",
  enabled: true,
  emphasis: "primary"
});

for (const state of ["pending", "sandbox_pending", "provider_redirect"]) {
  assert.deepEqual(crucibleCardAction({ ...base, state }), {
    label: "Provider check already in progress",
    enabled: false,
    emphasis: "secondary"
  });
}

for (const state of ["sandbox_verified", "live_verified", "verified"]) {
  assert.deepEqual(crucibleCardAction({ ...base, state }), {
    label: "Re-check Identity",
    enabled: true,
    emphasis: "primary"
  });
}

assert.deepEqual(
  crucibleCardAction({ ...base, state: "legacy_unbacked", checkKey: "funds", checkTitle: "Funds" }),
  { label: "Open Plaid sandbox demo", enabled: true, emphasis: "primary" }
);
assert.deepEqual(crucibleCardAction({ ...base, state: "legacy_unbacked" }), {
  label: "Action unavailable",
  enabled: false,
  emphasis: "secondary"
});
assert.deepEqual(
  crucibleCardAction({
    ...base,
    state: "ready_to_start",
    checkKey: "funds",
    checkTitle: "Funds",
    defaultLabel: "Check Funds"
  }),
  { label: "Open Plaid sandbox demo", enabled: true, emphasis: "primary" }
);
assert.deepEqual(crucibleCardAction({ ...base, state: "unavailable" }), {
  label: "Not available yet",
  enabled: false,
  emphasis: "secondary"
});
assert.equal(crucibleCardAction({ ...base, state: "ready_to_start", hasRoute: false }).enabled, false);
assert.equal(crucibleCardAction({ ...base, state: "ready_to_start", hasHandler: false }).enabled, false);
assert.equal(crucibleCardAction({ ...base, state: "ready_to_start", busy: true }).enabled, false);
assert.equal(crucibleCardAction({ ...base, state: "ready_to_start", previewDisabled: true }).enabled, false);
assert.deepEqual(crucibleCardAction({ ...base, state: "ready_to_start", walkthroughReadOnly: true }), {
  label: "Connected test account required",
  enabled: false,
  emphasis: "secondary"
});

assert.deepEqual(
  crucibleCardAction({
    ...base,
    state: "ready_to_start",
    checkKey: "funds",
    checkTitle: "Funds",
    runtimeUnavailable: true
  }),
  { label: "Connect Plaid sandbox keys", enabled: false, emphasis: "secondary" }
);
for (const state of ["legacy_unbacked", "sandbox_verified", "live_verified", "verified", "expired", "failed"]) {
  assert.deepEqual(crucibleCardAction({ ...base, state, walkthroughReadOnly: true }), {
    label: "Connected test account required",
    enabled: false,
    emphasis: "secondary"
  });
}
assert.deepEqual(crucibleCardAction({ ...base, state: "manual_review" }), {
  label: "Manual review in progress",
  enabled: false,
  emphasis: "secondary"
});
assert.deepEqual(crucibleCardAction({ ...base, state: "runtime_unknown_state" }), {
  label: "Action unavailable",
  enabled: false,
  emphasis: "secondary"
});

const card = await readFile(
  path.join(repoRoot, "components/crucible/verification-card.tsx"),
  "utf8"
);
assert.match(card, /crucibleCardAction\(\{/);
assert.match(card, /checkKey: check\.key/);
assert.match(card, /disabled=\{!action\.enabled\}/);
assert.match(card, /Connected test account required/);
assert.match(card, /\{action\.label\}/);
assert.doesNotMatch(card, /disabled=\{!canStart\}/);

const panel = await readFile(
  path.join(repoRoot, "components/crucible/crucible-panel.tsx"),
  "utf8"
);
assert.match(panel, /if \(busyKey !== null\) return;/);
assert.match(panel, /busy=\{busyKey !== null\}/);
assert.match(panel, /providerAccess !== "connected"/);
assert.match(panel, /walkthroughReadOnly=\{providerAccess !== "connected"\}/);

console.log("Crucible card action contract: PASS");
