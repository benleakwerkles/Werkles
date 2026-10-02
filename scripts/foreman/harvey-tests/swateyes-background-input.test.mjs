import assert from "node:assert/strict";
import test from "node:test";

import { classifyHarveySwateyesBackgroundInput } from "../../../lib/harvey/swateyes-background-input.ts";

const base = (overrides = {}) => ({
  permission_fingerprint_sha256: "a".repeat(64),
  credential_requirement: "NONE",
  credential_handle: null,
  delivery_channel: "PROVIDER_BACKGROUND_API",
  changes_foreground_window: false,
  moves_pointer: false,
  captures_keyboard: false,
  injects_keystrokes: false,
  uses_shared_clipboard: false,
  exposes_secret_to_harvey: false,
  ...overrides,
});

test("a background-only permission becomes a safety candidate but never creates authority or executes", () => {
  const decision = classifyHarveySwateyesBackgroundInput(base());
  assert.equal(decision.state, "BACKGROUND_SAFE_CANDIDATE");
  assert.equal(decision.execution_authorized, false);
  assert.equal(decision.cursor_or_keyboard_touched, false);
  assert.equal(decision.secret_loaded_by_harvey, false);
});

test("any focus, pointer, keyboard, keystroke, clipboard, or foreground automation is blocked", () => {
  for (const override of [
    { changes_foreground_window: true },
    { moves_pointer: true },
    { captures_keyboard: true },
    { injects_keystrokes: true },
    { uses_shared_clipboard: true },
    { delivery_channel: "FOREGROUND_UI_AUTOMATION" },
  ]) {
    const decision = classifyHarveySwateyesBackgroundInput(base(override));
    assert.equal(decision.state, "BLOCKED");
    assert.equal(decision.blocker, "FOREGROUND_OR_INPUT_INTERFERENCE_FORBIDDEN");
    assert.equal(decision.cursor_or_keyboard_touched, false);
  }
});

test("credential work requires only an opaque broker handle and never returns it in compact memory", () => {
  const handle = `cred_${"b".repeat(32)}`;
  const decision = classifyHarveySwateyesBackgroundInput(base({
    credential_requirement: "OPAQUE_BROKER_HANDLE",
    credential_handle: handle,
    delivery_channel: "PASSWORD_MANAGER_BROKER",
  }));
  assert.equal(decision.state, "BACKGROUND_SAFE_CANDIDATE");
  assert.equal(decision.credential_handle_returned, false);
  assert.doesNotMatch(JSON.stringify(decision), new RegExp(handle));
  assert.deepEqual(decision.capsule.features, [1, 1, 2, 0, 0, 0, 0, 0, 0]);
  assert.match(decision.capsule.capsule_sha256, /^[a-f0-9]{64}$/);
});

test("raw, malformed, or missing credential references fail closed", () => {
  for (const credential_handle of [null, "my password", "1password/item/account-name"]) {
    const decision = classifyHarveySwateyesBackgroundInput(base({
      credential_requirement: "OPAQUE_BROKER_HANDLE",
      credential_handle,
      delivery_channel: "PASSWORD_MANAGER_BROKER",
    }));
    assert.equal(decision.state, "BLOCKED");
    assert.equal(decision.blocker, "OPAQUE_CREDENTIAL_BROKER_REQUIRED");
  }
});

test("secret exposure never becomes background-safe work", () => {
  assert.equal(classifyHarveySwateyesBackgroundInput(base({ exposes_secret_to_harvey: true })).blocker, "SECRET_EXPOSURE_FORBIDDEN");
});

test("unknown channels, untyped flags, and extra fields fail closed", () => {
  for (const request of [
    base({ delivery_channel: "MAGIC_BACKGROUND_TYPING" }),
    base({ moves_pointer: "false" }),
    base({ password: "must-never-be-accepted" }),
  ]) {
    const decision = classifyHarveySwateyesBackgroundInput(request);
    assert.equal(decision.state, "BLOCKED");
    assert.equal(decision.blocker, "INVALID_REQUEST");
    assert.doesNotMatch(JSON.stringify(decision), /must-never-be-accepted/);
  }
});

test("capsule identity is domain-separated by permission, channel, and policy version", () => {
  const provider = classifyHarveySwateyesBackgroundInput(base());
  const otherPermission = classifyHarveySwateyesBackgroundInput(base({ permission_fingerprint_sha256: "b".repeat(64) }));
  const osBroker = classifyHarveySwateyesBackgroundInput(base({ delivery_channel: "OS_CREDENTIAL_BROKER" }));
  assert.notEqual(provider.capsule.capsule_sha256, otherPermission.capsule.capsule_sha256);
  assert.notEqual(provider.capsule.capsule_sha256, osBroker.capsule.capsule_sha256);
  assert.equal(provider.capsule.policy_version, "swateyes-background-input/20260802.1");
});

test("hostile Proxy input fails closed without attacker-derived capsule bits", () => {
  const hostile = new Proxy({}, { ownKeys() { throw new Error("HOSTILE_OWN_KEYS"); } });
  const decision = classifyHarveySwateyesBackgroundInput(hostile);
  assert.equal(decision.state, "BLOCKED");
  assert.equal(decision.blocker, "INVALID_REQUEST");
  assert.equal(decision.capsule.permission_fingerprint_sha256, "0".repeat(64));
});
