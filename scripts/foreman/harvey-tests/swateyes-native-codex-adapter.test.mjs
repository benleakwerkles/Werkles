import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  persistHarveyHeldPromptRegistration,
  registerHarveyHeldPromptEvent,
} from "../../../lib/harvey/held-prompt-registration.ts";
import {
  admitHarveyNativeCodexTerminal,
  deriveHarveyNativeCodexTerminalEvidence,
  prepareHarveyNativeCodexSendOnce,
} from "../../../lib/harvey/swateyes-native-codex-adapter.ts";

const NOW = "2026-08-03T05:00:00.000Z";
const THREAD = "019f5458-630b-75b2-85d4-04ac74c8b6a9";

function fixture() {
  const event = {
    schema: "werkles.harvey-held-prompt-event/v1",
    event_id: "event.swateyes.doss.native.001",
    event_type: "INTERNAL_PERMISSION_PROMPT_HELD",
    observed_at: NOW,
    provider: "Codex",
    host_id: "local",
    task_thread_id: THREAD,
    prompt_id: "prompt.swateyes.doss.native.001",
    one_use_nonce: "a".repeat(32),
    machine: "Doss",
    physical_hostname: "DOSS",
    project_id: "harvey",
    action: "RUN_LOCAL_TEST",
    executable_sha256: "b".repeat(64),
    arguments_sha256: "c".repeat(64),
    cwd: "C:\\Users\\BenLeak\\github\\Werkles",
    target_paths: ["scripts/foreman/harvey-tests/swateyes-native-codex-adapter.test.mjs"],
    requires_secret: false,
    requires_provider_sign_in: false,
    recurring_operation: false,
    paid_action: false,
    push_or_merge: false,
    deploy_or_publish: false,
    production_mutation: false,
    destructive_or_irreversible: false,
  };
  const registration = registerHarveyHeldPromptEvent(event, {
    credential_id: "harvey-station-doss",
    received_at: NOW,
  });
  const binding = {
    schema: "werkles.harvey-swateyes-task-binding/v1",
    binding_id: "binding-swateyes-doss-native",
    state: "BOUND_PROVEN",
    provider: "Codex",
    host_id: "local",
    task_thread_id: THREAD,
    machine: "Doss",
    physical_hostname: "DOSS",
    project_id: "harvey",
    seat_id: "Swanson@Doss",
  };
  const authority = {
    schema: "werkles.harvey-swateyes-authority-receipt/v1",
    receipt_id: "approval.swateyes.doss.native.001",
    status: "APPROVED",
    granted_by: "BEN_OPERATOR",
    machine: "Doss",
    project_id: "harvey",
    allowed_actions: ["RUN_LOCAL_TEST"],
    allowed_operations: [{
      operation_id: "operation.swateyes.doss.native.001",
      platform: "CODEX_INTERNAL",
      task_thread_id: THREAD,
      action: "RUN_LOCAL_TEST",
      executable_sha256: "b".repeat(64),
      arguments_sha256: "c".repeat(64),
      cwd: "C:\\Users\\BenLeak\\github\\Werkles",
      target_paths: ["scripts/foreman/harvey-tests/swateyes-native-codex-adapter.test.mjs"],
      maximum_uses: 1,
    }],
    issued_at: "2026-08-03T04:55:00.000Z",
    expires_at: "2026-08-03T05:30:00.000Z",
    recurring_operation_authority: false,
  };
  const held = {
    schema: "werkles.harvey-native-codex-held-task-evidence/v1",
    source: "CODEX_APP_NATIVE_TASK_TOOL",
    observed_at: NOW,
    host_id: "local",
    task_thread_id: THREAD,
    prompt_id: event.prompt_id,
    task_cursor: "cursor-before-001",
    task_state: "WAITING_ON_APPROVAL",
    approval_kind: "INTERNAL_COMMAND",
  };
  return { registration, binding, authority, held };
}

async function preparedFixture(root) {
  const data = fixture();
  await persistHarveyHeldPromptRegistration(data.registration, root);
  const prepared = await prepareHarveyNativeCodexSendOnce({
    registrationId: data.registration.registration_id,
    binding: data.binding,
    authorityReceipts: [data.authority],
    nativeHeldTask: data.held,
    repositoryRoot: root,
    evaluatorNow: NOW,
  });
  return { ...data, prepared };
}

function waitResult(prepared, overrides = {}) {
  const marker = {
    schema: "werkles.harvey-swateyes-terminal-marker/v1",
    continuation_id: prepared.continuation.continuation_id,
    prompt_id: prepared.continuation.prompt_id,
    action: prepared.continuation.action,
    result: "RESUMED",
    detail: "The exact held local test resumed and completed.",
  };
  return {
    schema: "werkles.harvey-native-codex-wait-result/v1",
    source: "CODEX_APP_NATIVE_TASK_TOOL",
    observed_at: "2026-08-03T05:00:01.000Z",
    host_id: "local",
    task_thread_id: THREAD,
    before_cursor: prepared.before_cursor,
    after_cursor: "cursor-after-001",
    task_state: "COMPLETED",
    reply: `SWATEYES_TERMINAL ${JSON.stringify(marker)}`,
    ...overrides,
  };
}

test("claims exactly one native Codex send before exposing its continuation", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "swateyes-native-"));
  try {
    const { registration, binding, authority, held, prepared } = await preparedFixture(root);
    assert.equal(prepared.state, "SEND_ONCE");
    assert.equal(prepared.continuation.task_thread_id, THREAD);
    assert.match(prepared.continuation.body, /Do not expand scope/);
    await assert.rejects(prepareHarveyNativeCodexSendOnce({
      registrationId: registration.registration_id,
      binding,
      authorityReceipts: [authority],
      nativeHeldTask: held,
      repositoryRoot: root,
      evaluatorNow: NOW,
    }), /ONE_USE_ALREADY_CLAIMED/);
    await assert.rejects(prepareHarveyNativeCodexSendOnce({
      registrationId: registration.registration_id,
      binding,
      authorityReceipts: [authority],
      nativeHeldTask: { ...held, task_cursor: "cursor-before-002" },
      repositoryRoot: root,
      evaluatorNow: NOW,
    }), /ONE_USE_ALREADY_CLAIMED/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("admits RESUMED only from a fresh exact-task terminal cursor", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "swateyes-native-terminal-"));
  try {
    const { prepared } = await preparedFixture(root);
    const receipt = await admitHarveyNativeCodexTerminal({
      prepared,
      repositoryRoot: root,
      nativeWaitResult: waitResult(prepared),
      evaluatorNow: "2026-08-03T05:00:02.000Z",
    });
    assert.equal(receipt.result, "RESUMED");
    assert.equal(receipt.one_use_consumed, true);
    assert.equal(receipt.send_count, 1);
    assert.deepEqual(receipt.reason_codes, ["STRUCTURED_EXACT_TERMINAL_RESUMED__CALLER_ATTESTED"]);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("rejects route substitution, stale evidence, and false terminal success", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "swateyes-native-redteam-"));
  try {
    const data = fixture();
    await persistHarveyHeldPromptRegistration(data.registration, root);
    await assert.rejects(prepareHarveyNativeCodexSendOnce({
      registrationId: data.registration.registration_id,
      binding: data.binding,
      authorityReceipts: [data.authority],
      nativeHeldTask: { ...data.held, task_thread_id: "019f5454-de3e-7f81-8c17-86561b7f6ead" },
      repositoryRoot: root,
      evaluatorNow: NOW,
    }), /EXACT_HELD_ROUTE_NOT_PROVEN/);
    await assert.rejects(prepareHarveyNativeCodexSendOnce({
      registrationId: data.registration.registration_id,
      binding: data.binding,
      authorityReceipts: [data.authority],
      nativeHeldTask: { ...data.held, observed_at: "2026-08-03T04:50:00.000Z" },
      repositoryRoot: root,
      evaluatorNow: NOW,
    }), /EXACT_HELD_ROUTE_NOT_PROVEN/);
    const prepared = await prepareHarveyNativeCodexSendOnce({
      registrationId: data.registration.registration_id,
      binding: data.binding,
      authorityReceipts: [data.authority],
      nativeHeldTask: data.held,
      repositoryRoot: root,
      evaluatorNow: NOW,
    });
    await assert.rejects(admitHarveyNativeCodexTerminal({
      prepared,
      repositoryRoot: root,
      nativeWaitResult: waitResult(prepared, { after_cursor: prepared.before_cursor }),
      evaluatorNow: "2026-08-03T05:00:02.000Z",
    }), /WAIT_RESULT_INVALID/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("generic completion, marker substitution, prepared mutation, and future terminals cannot pass", async () => {
  for (const attack of ["GENERIC", "MARKER", "PREPARED", "FUTURE"]) {
    const root = await mkdtemp(path.join(os.tmpdir(), `swateyes-native-${attack.toLowerCase()}-`));
    try {
      const { prepared } = await preparedFixture(root);
      if (attack === "GENERIC") {
        assert.throws(() => deriveHarveyNativeCodexTerminalEvidence(prepared, waitResult(prepared, { reply: "Task completed." })), /MARKER_MISSING_OR_AMBIGUOUS/);
        continue;
      }
      if (attack === "MARKER") {
        const forged = waitResult(prepared);
        forged.reply = forged.reply.replace(prepared.continuation.action, "RUN_LOCAL_BUILD");
        assert.throws(() => deriveHarveyNativeCodexTerminalEvidence(prepared, forged), /MARKER_INVALID/);
        continue;
      }
      if (attack === "PREPARED") {
        prepared.continuation = { ...prepared.continuation, binding_id: "binding-substituted", action: "RUN_LOCAL_BUILD" };
        await assert.rejects(admitHarveyNativeCodexTerminal({
          prepared,
          nativeWaitResult: waitResult(prepared),
          repositoryRoot: root,
          evaluatorNow: "2026-08-03T05:00:02.000Z",
        }), /CLAIM_INVALID/);
        continue;
      }
      await assert.rejects(admitHarveyNativeCodexTerminal({
        prepared,
        nativeWaitResult: waitResult(prepared, { observed_at: "2026-08-03T05:10:00.000Z" }),
        repositoryRoot: root,
        evaluatorNow: "2026-08-03T05:00:02.000Z",
      }), /TERMINAL_EVIDENCE_INVALID/);
    } finally { await rm(root, { recursive: true, force: true }); }
  }
});
