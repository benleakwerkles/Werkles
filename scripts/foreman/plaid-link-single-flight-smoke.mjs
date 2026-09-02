import assert from "node:assert/strict";

import { launchPlaidLink } from "../../components/crucible/plaid-link-launcher.ts";

let createCount = 0;
let activeCallbacks;

globalThis.window = {
  Plaid: {
    create(callbacks) {
      createCount += 1;
      activeCallbacks = callbacks;
      return { open() {} };
    }
  }
};

let werklesSuccessArguments = null;
const firstLaunch = launchPlaidLink("link-sandbox-one", (...args) => {
  werklesSuccessArguments = args;
});
await Promise.resolve();

await assert.rejects(
  launchPlaidLink("link-sandbox-two", () => {}),
  /already open/
);
assert.equal(createCount, 1, "a second Link handler must not be created while one is active");

activeCallbacks.onSuccess("public-token-never-transmitted");
await firstLaunch;
assert.deepEqual(
  werklesSuccessArguments,
  [],
  "Plaid public_token must be discarded before the Werkles callback"
);

const nextLaunch = launchPlaidLink("link-sandbox-three", () => {});
await Promise.resolve();
assert.equal(createCount, 2, "a later Link session may start after the first one settles");
activeCallbacks.onExit();
await nextLaunch;

console.log("Plaid Link single-flight contract: PASS");
