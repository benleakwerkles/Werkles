import assert from "node:assert/strict";

import { launchPlaidLink } from "../../components/crucible/plaid-link-launcher.ts";
import {
  beginExternalLinkLifecycle,
  isExternalLinkTerminalState,
  transitionExternalLinkLifecycle
} from "../../lib/verification/external-link-lifecycle.ts";

const loading = beginExternalLinkLifecycle();
const open = transitionExternalLinkLifecycle(loading, "open");
assert.deepEqual(loading, { state: "loading" });
assert.equal(Object.isFrozen(loading), true);
assert.deepEqual(open, { state: "open" });
for (const state of ["exited", "failed", "completed-not-saved"]) {
  assert.equal(isExternalLinkTerminalState(state), true);
  assert.equal(transitionExternalLinkLifecycle(open, state).state, state);
}
assert.equal(isExternalLinkTerminalState("open"), false);
assert.throws(() => transitionExternalLinkLifecycle(open, "loading"), /invalid_transition/);
assert.throws(
  () => transitionExternalLinkLifecycle({ state: "open", metadata: { institution: "unsafe" } }, "failed"),
  /unsafe_snapshot_fields/
);

let activeCallbacks;
let createBehavior = () => ({ open() {} });
let createCount = 0;
globalThis.window = {
  Plaid: {
    create(callbacks) {
      createCount += 1;
      activeCallbacks = callbacks;
      return createBehavior(callbacks);
    }
  }
};

async function start(options = {}) {
  const lifecycle = [];
  let successArguments;
  let exitArguments;
  const promise = launchPlaidLink(
    options.linkToken ?? "link-sandbox-safe",
    (...args) => {
      successArguments = args;
      options.success?.();
    },
    (...args) => {
      exitArguments = args;
      options.exit?.();
    },
    (snapshot) => {
      lifecycle.push(snapshot);
      options.lifecycle?.(snapshot);
    }
  );
  await Promise.resolve();
  return {
    promise,
    lifecycle,
    successArguments: () => successArguments,
    exitArguments: () => exitArguments
  };
}

// Success discards public token and all SDK metadata, then releases single-flight.
let launch = await start();
assert.deepEqual(launch.lifecycle.map(({ state }) => state), ["loading", "open"]);
await assert.rejects(launchPlaidLink("link-second", () => {}), /already open/);
activeCallbacks.onSuccess(
  "public-token-must-be-discarded",
  { institution: { name: "Never forward" }, accounts: [{ id: "unsafe" }] }
);
await launch.promise;
assert.deepEqual(launch.lifecycle.map(({ state }) => state), [
  "loading",
  "open",
  "completed-not-saved"
]);
assert.deepEqual(launch.successArguments(), []);
assert.equal(Object.keys(launch.lifecycle.at(-1)).join(","), "state");

// Consumer callback reentrancy cannot create a second terminal transition.
launch = await start({ success: () => activeCallbacks.onExit(null, { request_id: "late" }) });
activeCallbacks.onSuccess("public-token-discarded");
await launch.promise;
assert.deepEqual(launch.lifecycle.map(({ state }) => state), [
  "loading",
  "open",
  "completed-not-saved"
]);

// A clean SDK exit is distinct, carries no metadata, and duplicate callbacks are ignored.
launch = await start();
activeCallbacks.onExit(null, { request_id: "never-forward", institution: "never-forward" });
activeCallbacks.onSuccess("late-public-token", { accounts: ["late"] });
await launch.promise;
assert.deepEqual(launch.lifecycle.map(({ state }) => state), ["loading", "open", "exited"]);
assert.deepEqual(launch.exitArguments(), []);

// Provider error objects and malformed success callbacks fail closed with sanitized errors.
for (const invoke of [
  () => activeCallbacks.onExit({ error_code: "RAW_CODE", request_id: "raw-request" }, { institution: "raw" }),
  () => activeCallbacks.onSuccess("", { institution: "raw" })
]) {
  launch = await start();
  invoke();
  await assert.rejects(launch.promise, (error) => {
    assert.equal(error.message, "Plaid Link failed safely.");
    assert.doesNotMatch(error.message, /RAW_CODE|raw-request|institution/);
    return true;
  });
  assert.deepEqual(launch.lifecycle.map(({ state }) => state), ["loading", "open", "failed"]);
}

// Malformed SDK handlers, SDK throws, open throws, and consumer callback throws all release.
for (const scenario of [
  () => { createBehavior = () => null; },
  () => { createBehavior = () => { throw new Error("raw sdk create failure"); }; },
  () => {
    createBehavior = () => new Proxy({}, {
      get() { throw new Error("raw sdk open getter failure"); }
    });
  },
  () => { createBehavior = () => ({ open() { throw new Error("raw sdk open failure"); } }); }
]) {
  scenario();
  launch = await start();
  await assert.rejects(launch.promise, /Plaid Link failed safely/);
  assert.equal(launch.lifecycle.at(-1).state, "failed");
}

// SDK callbacks fired during create are malformed ordering and fail without hanging.
createBehavior = (callbacks) => {
  callbacks.onSuccess("too-early-public-token", { request_id: "never-forward" });
  return { open() {} };
};
launch = await start();
await assert.rejects(launch.promise, /Plaid Link failed safely/);
assert.deepEqual(launch.lifecycle.map(({ state }) => state), ["loading", "failed"]);
createBehavior = () => ({ open() {} });
launch = await start({ success: () => { throw new Error("raw consumer failure"); } });
activeCallbacks.onSuccess("discarded-public-token");
await assert.rejects(launch.promise, /Plaid Link failed safely/);
assert.equal(launch.lifecycle.at(-1).state, "failed");

// Observer exceptions cannot retain the lock or alter completion.
launch = await start({ lifecycle: () => { throw new Error("observer failure"); } });
activeCallbacks.onExit();
await launch.promise;
assert.equal(launch.lifecycle.at(-1).state, "exited");

// The lock is reserved before the first lifecycle observer, closing reentrant launch.
let reentrantError;
launch = await start({
  lifecycle: ({ state }) => {
    if (state === "loading") {
      launchPlaidLink("link-reentrant", () => {}).catch((error) => { reentrantError = error; });
    }
  }
});
await Promise.resolve();
assert.match(reentrantError?.message ?? "", /already open/);
activeCallbacks.onExit();
await launch.promise;

// An SDK that never calls a terminal callback times out safely and releases.
const nativeSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (callback) => {
  queueMicrotask(callback);
  return 1;
};
launch = await start();
await assert.rejects(launch.promise, /Plaid Link failed safely/);
assert.deepEqual(launch.lifecycle.map(({ state }) => state), ["loading", "open", "failed"]);
globalThis.setTimeout = nativeSetTimeout;

// Invalid launch tokens fail without reaching the SDK and still release for the next launch.
const beforeInvalid = createCount;
launch = await start({ linkToken: " " });
await assert.rejects(launch.promise, /Plaid Link failed safely/);
assert.deepEqual(launch.lifecycle.map(({ state }) => state), ["loading", "failed"]);
assert.equal(createCount, beforeInvalid);

// Script load failure is terminal and sanitized; no unresolved promise or retained lock.
globalThis.window = {};
const listeners = new Map();
let failedScriptRemoveCount = 0;
const fakeScript = {
  src: "",
  async: false,
  addEventListener(name, callback) { listeners.set(name, callback); },
  removeEventListener(name) { listeners.delete(name); },
  remove() { failedScriptRemoveCount += 1; }
};
globalThis.document = {
  querySelector() { return null; },
  createElement() { return fakeScript; },
  body: { appendChild() { queueMicrotask(() => listeners.get("error")?.()); } }
};
launch = await start();
await assert.rejects(launch.promise, /Plaid Link failed safely/);
assert.deepEqual(launch.lifecycle.map(({ state }) => state), ["loading", "failed"]);
assert.equal(failedScriptRemoveCount, 1, "a failed script must not poison the next launch");

// Restore an SDK and prove a fresh launch works after every preceding terminal path.
globalThis.window = {
  Plaid: {
    create(callbacks) {
      activeCallbacks = callbacks;
      return { open() {} };
    }
  }
};
launch = await start();
activeCallbacks.onExit();
await launch.promise;
assert.equal(launch.lifecycle.at(-1).state, "exited");

console.log("Plaid Link sanitized lifecycle contract: PASS");
