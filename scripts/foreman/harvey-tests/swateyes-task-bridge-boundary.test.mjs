import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  persistHarveyHeldPromptRegistration,
  registerHarveyHeldPromptEvent,
} from "../../../lib/harvey/held-prompt-registration.ts";
import { prepareHarveySwateyesTaskBridgeBoundary } from "../../../lib/harvey/swateyes-task-bridge-boundary.ts";

const NOW = "2026-08-02T18:00:00.000Z";
const THREAD = "019f5458-630b-75b2-85d4-04ac74c8b6a9";
const SHA = "b".repeat(64);

function registration() {
  return registerHarveyHeldPromptEvent({
    schema: "werkles.harvey-held-prompt-event/v1",
    event_id: "event.swateyes.doss.task-bridge.001",
    event_type: "INTERNAL_PERMISSION_PROMPT_HELD",
    observed_at: NOW,
    provider: "Codex",
    host_id: "local",
    task_thread_id: THREAD,
    prompt_id: "prompt.swateyes.doss.task-bridge.001",
    one_use_nonce: "a".repeat(32),
    machine: "Doss",
    physical_hostname: "DOSS",
    project_id: "harvey",
    action: "RUN_LOCAL_TEST",
    executable_sha256: SHA,
    arguments_sha256: "c".repeat(64),
    cwd: "C:\\Users\\BenLeak\\github\\Werkles",
    target_paths: ["scripts/foreman/harvey-tests/swateyes-task-bridge-boundary.test.mjs"],
    requires_secret: false,
    requires_provider_sign_in: false,
    recurring_operation: false,
    paid_action: false,
    push_or_merge: false,
    deploy_or_publish: false,
    production_mutation: false,
    destructive_or_irreversible: false,
  }, { credential_id: "harvey-station-doss", received_at: NOW });
}

function authority() {
  return {
    schema: "werkles.harvey-swateyes-authority-receipt/v1",
    receipt_id: "approval.harvey.doss.task-bridge.001",
    status: "APPROVED",
    granted_by: "BEN_OPERATOR",
    machine: "Doss",
    project_id: "harvey",
    allowed_actions: ["RUN_LOCAL_TEST"],
    allowed_operations: [{
      operation_id: "operation.harvey.doss.task-bridge.001",
      platform: "CODEX_INTERNAL",
      task_thread_id: THREAD,
      action: "RUN_LOCAL_TEST",
      executable_sha256: SHA,
      arguments_sha256: "c".repeat(64),
      cwd: "C:\\Users\\BenLeak\\github\\Werkles",
      target_paths: ["scripts/foreman/harvey-tests/swateyes-task-bridge-boundary.test.mjs"],
      maximum_uses: 1,
    }],
    issued_at: "2026-08-02T17:00:00.000Z",
    expires_at: "2026-08-02T19:00:00.000Z",
    recurring_operation_authority: false,
  };
}

function bridge(overrides = {}) {
  return {
    schema: "werkles.harvey-task-bridge/v1",
    execution_policy: {
      allowed_action_class: "THREAD_REPLY_ONLY",
      real_provider_activation: "NOT_AUTHORIZED",
      idle_polling: "FORBIDDEN",
      external_side_effects: "FORBIDDEN",
    },
    bindings: [{
      binding_id: "dink-doss-werkles-operations",
      provider: "Codex",
      host_id: "local",
      thread_id: THREAD,
      machine: "Doss",
      physical_hostname: "DOSS",
      project_id: "harvey",
      work_id: "HARVEY_SWATEYES_CONTINUATION_V0",
      state: "BOUND_PROVEN",
      revoked_at: null,
      route_mode: "REAL_PROVEN",
      carrier_mode: "REAL_PROVEN",
      authority: "THREAD_REPLY_ONLY",
      capabilities: ["THREAD_REPLY_ONLY"],
      binding_fingerprint_sha256: "d".repeat(64),
      host_match: true,
      eligible: false,
      blocker: "REAL_PROVIDER_TURN_NOT_AUTHORIZED",
    }],
    ...overrides,
  };
}

function backgroundInput(overrides = {}) {
  return {
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
  };
}

async function fixture(run) {
  const root = await mkdtemp(path.join(os.tmpdir(), "swateyes-task-bridge-boundary-"));
  try {
    const stored = await persistHarveyHeldPromptRegistration(registration(), root);
    return await run(root, stored.registration.registration_id);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("current real task bridge remains blocked without provider-turn activation", async () => {
  await fixture(async (root, registrationId) => {
    const result = await prepareHarveySwateyesTaskBridgeBoundary({ registrationId, authorityReceipts: [authority()], taskBridge: bridge(), backgroundInput: backgroundInput(), bootRevision: "e".repeat(64), repositoryRoot: root, evaluatorNow: NOW });
    assert.equal(result.state, "BLOCKED");
    assert.equal(result.blocker, "DURABLE_PROVENANCE_ADAPTER_REQUIRED");
    assert.equal(result.execution_performed, false);
    assert.equal(result.one_use_consumed, false);
    assert.equal(result.task_bridge_input, null);
  });
});

test("caller-asserted activation cannot prepare a provider request", async () => {
  await fixture(async (root, registrationId) => {
    const taskBridge = bridge();
    taskBridge.execution_policy.real_provider_activation = "AUTHORIZED";
    taskBridge.execution_policy.external_side_effects = "THREAD_REPLY_ONLY_AUTHORIZED";
    taskBridge.bindings[0].eligible = true;
    taskBridge.bindings[0].blocker = null;
    const result = await prepareHarveySwateyesTaskBridgeBoundary({ registrationId, authorityReceipts: [authority()], taskBridge, backgroundInput: backgroundInput(), bootRevision: "e".repeat(64), repositoryRoot: root, evaluatorNow: NOW });
    assert.equal(result.state, "BLOCKED");
    assert.equal(result.blocker, "DURABLE_PROVENANCE_ADAPTER_REQUIRED");
    assert.equal(result.execution_performed, false);
    assert.equal(result.one_use_consumed, false);
    assert.equal(result.effect_claim, "NO_EFFECT");
    assert.equal(result.task_bridge_input, null);
    assert.deepEqual(result.reason_codes, [
      "CALLER_AUTHORITY_NOT_EXECUTION_PROOF",
      "CALLER_ROUTE_NOT_EXECUTION_PROOF",
      "DURABLE_ONE_USE_CLAIM_REQUIRED",
    ]);
  });
});

test("wrong route, fixture carrier, revoked binding, and missing operation authority fail closed", async () => {
  await fixture(async (root, registrationId) => {
    for (const [taskBridge, receipts, blocker] of [
      [bridge({ bindings: null }), [authority()], "TASK_BRIDGE_PROJECTION_INVALID"],
      [bridge({ bindings: [{ ...bridge().bindings[0], thread_id: "019f5454-de3e-7f81-8c17-86561b7f6ead" }] }), [authority()], "EXACT_TASK_BRIDGE_BINDING_NOT_FOUND"],
      [bridge({ bindings: [{ ...bridge().bindings[0], route_mode: "FIXTURE_TEST_ONLY" }] }), [authority()], "TASK_BRIDGE_BINDING_NOT_PROVEN"],
      [bridge({ bindings: [{ ...bridge().bindings[0], state: "REVOKED", revoked_at: NOW }] }), [authority()], "TASK_BRIDGE_BINDING_NOT_PROVEN"],
      [bridge(), [], "EXACT_ACTIVE_OPERATION_AUTHORITY_NOT_PROVEN"],
    ]) {
      const result = await prepareHarveySwateyesTaskBridgeBoundary({ registrationId, authorityReceipts: receipts, taskBridge, backgroundInput: backgroundInput(), bootRevision: "e".repeat(64), repositoryRoot: root, evaluatorNow: NOW });
      assert.equal(result.state, "BLOCKED");
      assert.equal(result.blocker, blocker);
      assert.equal(result.task_bridge_input, null);
    }
  });
});

test("every boundary envelope proves background-only input without returning credential handles", async () => {
  await fixture(async (root, registrationId) => {
    const handle = `cred_${"f".repeat(32)}`;
    const result = await prepareHarveySwateyesTaskBridgeBoundary({
      registrationId,
      authorityReceipts: [authority()],
      taskBridge: bridge(),
      backgroundInput: backgroundInput({
        credential_requirement: "OPAQUE_BROKER_HANDLE",
        credential_handle: handle,
        delivery_channel: "PASSWORD_MANAGER_BROKER",
      }),
      bootRevision: "e".repeat(64),
      repositoryRoot: root,
      evaluatorNow: NOW,
    });
    assert.equal(result.background_input_decision.state, "BACKGROUND_SAFE_CANDIDATE");
    assert.equal(result.background_input_decision.cursor_or_keyboard_touched, false);
    assert.equal(result.background_input_decision.credential_handle_returned, false);
    assert.doesNotMatch(JSON.stringify(result), new RegExp(handle));
  });
});

test("foreground focus, pointer, keyboard, clipboard, and keystroke injection block the boundary", async () => {
  await fixture(async (root, registrationId) => {
    for (const interference of [
      { changes_foreground_window: true },
      { moves_pointer: true },
      { captures_keyboard: true },
      { injects_keystrokes: true },
      { uses_shared_clipboard: true },
      { delivery_channel: "FOREGROUND_UI_AUTOMATION" },
    ]) {
      const result = await prepareHarveySwateyesTaskBridgeBoundary({
        registrationId,
        authorityReceipts: [authority()],
        taskBridge: bridge(),
        backgroundInput: backgroundInput(interference),
        bootRevision: "e".repeat(64),
        repositoryRoot: root,
        evaluatorNow: NOW,
      });
      assert.equal(result.state, "BLOCKED");
      assert.equal(result.blocker, "BACKGROUND_ONLY_INPUT_NOT_PROVEN");
      assert.equal(result.background_input_decision.blocker, "FOREGROUND_OR_INPUT_INTERFERENCE_FORBIDDEN");
      assert.equal(result.background_input_decision.cursor_or_keyboard_touched, false);
      assert.equal(result.task_bridge_input, null);
    }
  });
});
