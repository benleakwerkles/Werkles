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
  continueHarveyHeldPrompt,
  projectHarveySwateyesDurableContinuationPrerequisites,
  projectLadyJessicaBetsyPrerequisites,
} from "../../../lib/harvey/swateyes-continuation.ts";

const NOW = "2026-08-02T17:30:00.000Z";
const THREAD = "019f5458-630b-75b2-85d4-04ac74c8b6a9";

function event(overrides = {}) {
  return {
    schema: "werkles.harvey-held-prompt-event/v1",
    event_id: "event.lady-jessica.site.live.001",
    event_type: "INTERNAL_PERMISSION_PROMPT_HELD",
    observed_at: NOW,
    provider: "Cursor",
    host_id: "betsy-local",
    task_thread_id: THREAD,
    prompt_id: "prompt.lady-jessica.site.live.001",
    one_use_nonce: "a".repeat(32),
    machine: "Betsy",
    physical_hostname: "BETSY",
    project_id: "werkles-site",
    action: "RUN_LOCAL_TEST",
    executable_sha256: "b".repeat(64),
    arguments_sha256: "c".repeat(64),
    cwd: "C:\\Users\\BenLeak\\github\\Werkles",
    target_paths: ["scripts/foreman/harvey-tests/swateyes-continuation.test.mjs"],
    requires_secret: false,
    requires_provider_sign_in: false,
    recurring_operation: false,
    paid_action: false,
    push_or_merge: false,
    deploy_or_publish: false,
    production_mutation: false,
    destructive_or_irreversible: false,
    ...overrides,
  };
}

function registration(overrides = {}) {
  return registerHarveyHeldPromptEvent(event(overrides), { credential_id: "harvey-station-betsy", received_at: NOW });
}

function binding(overrides = {}) {
  return {
    schema: "werkles.harvey-swateyes-task-binding/v1",
    binding_id: "binding-lady-jessica-betsy-site",
    state: "BOUND_PROVEN",
    provider: "Cursor",
    host_id: "betsy-local",
    task_thread_id: THREAD,
    machine: "Betsy",
    physical_hostname: "BETSY",
    project_id: "werkles-site",
    seat_id: "Maker@Betsy",
    ...overrides,
  };
}

function authority(overrides = {}) {
  return {
    schema: "werkles.harvey-swateyes-authority-receipt/v1",
    receipt_id: "approval.werkles-site.betsy.prompt.001",
    status: "APPROVED",
    granted_by: "BEN_OPERATOR",
    machine: "Betsy",
    project_id: "werkles-site",
    allowed_actions: ["RUN_LOCAL_TEST"],
    allowed_operations: [{
      operation_id: "operation.werkles-site.betsy.prompt.001",
      platform: "CURSOR_INTERNAL",
      task_thread_id: THREAD,
      action: "RUN_LOCAL_TEST",
      executable_sha256: "b".repeat(64),
      arguments_sha256: "c".repeat(64),
      cwd: "C:\\Users\\BenLeak\\github\\Werkles",
      target_paths: ["scripts/foreman/harvey-tests/swateyes-continuation.test.mjs"],
      maximum_uses: 1,
    }],
    issued_at: "2026-08-02T17:00:00.000Z",
    expires_at: "2026-08-02T18:00:00.000Z",
    recurring_operation_authority: false,
    ...overrides,
  };
}

function terminal(continuation, overrides = {}) {
  return {
    schema: "werkles.harvey-swateyes-provider-terminal/v1",
    continuation_id: continuation.continuation_id,
    provider: continuation.provider,
    host_id: continuation.host_id,
    task_thread_id: continuation.task_thread_id,
    prompt_id: continuation.prompt_id,
    result: "RESUMED",
    observed_at: NOW,
    detail: "Exact existing task resumed and returned terminal provider evidence.",
    ...overrides,
  };
}

test("policy-eligible claims remain inert until the trusted provider adapter is connected", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "swateyes-continuation-"));
  let sends = 0;
  try {
    const receipt = await continueHarveyHeldPrompt({
      registration: registration(), binding: binding(), authorityReceipts: [authority()], repositoryRoot: root, evaluatorNow: NOW,
      send: async (continuation) => { sends += 1; return terminal(continuation); },
    });
    assert.equal(receipt.result, "BLOCKED");
    assert.deepEqual(receipt.reason_codes, ["TRUSTED_PROVIDER_CONTINUATION_ADAPTER_NOT_CONNECTED"]);
    assert.equal(receipt.one_use_consumed, false);
    assert.equal(receipt.send_count, 0);
    assert.equal(receipt.task_thread_id, THREAD);
    assert.equal(sends, 0);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("repeated prepared calls remain inert and never consume or send", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "swateyes-replay-"));
  let sends = 0;
  const input = {
    registration: registration(), binding: binding(), authorityReceipts: [authority()], repositoryRoot: root, evaluatorNow: NOW,
    send: async (continuation) => { sends += 1; return terminal(continuation); },
  };
  try {
    const first = await continueHarveyHeldPrompt(input);
    const replay = await continueHarveyHeldPrompt(input);
    assert.deepEqual(replay, first);
    assert.equal(first.one_use_consumed, false);
    assert.equal(sends, 0);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("human gates, missing authority, and exact-route mismatch send nothing", async () => {
  for (const candidate of [
    { registration: registration({ requires_secret: true }), binding: binding(), receipts: [authority()], error: null },
    { registration: registration(), binding: binding(), receipts: [], error: null },
    { registration: registration(), binding: binding({ task_thread_id: "019f5454-de3e-7f81-8c17-86561b7f6ead" }), receipts: [authority()], error: /EXACT_PROVIDER_TASK_BINDING/ },
  ]) {
    const root = await mkdtemp(path.join(os.tmpdir(), "swateyes-deny-"));
    let sends = 0;
    try {
      const work = continueHarveyHeldPrompt({ registration: candidate.registration, binding: candidate.binding, authorityReceipts: candidate.receipts, repositoryRoot: root, evaluatorNow: NOW, send: async () => { sends += 1; throw new Error("must not send"); } });
      if (candidate.error) await assert.rejects(work, candidate.error);
      else assert.equal((await work).result, "BLOCKED");
      assert.equal(sends, 0);
    } finally { await rm(root, { recursive: true, force: true }); }
  }
});

test("provider callback is never invoked while the adapter seam is untrusted", async () => {
  for (const send of [
    async (continuation) => terminal(continuation, { task_thread_id: "019f5454-de3e-7f81-8c17-86561b7f6ead" }),
    async () => { throw new Error("PROVIDER_ROUTE_CLOSED"); },
  ]) {
    const root = await mkdtemp(path.join(os.tmpdir(), "swateyes-terminal-block-"));
    let sends = 0;
    try {
      const receipt = await continueHarveyHeldPrompt({ registration: registration({ event_id: `event.lady-jessica.site.${path.basename(root).slice(-8)}`, prompt_id: `prompt.lady-jessica.site.${path.basename(root).slice(-8)}`, one_use_nonce: Math.random().toString(16).slice(2).padEnd(32, "0").slice(0, 32) }), binding: binding(), authorityReceipts: [authority()], repositoryRoot: root, evaluatorNow: NOW, send: async (continuation) => { sends += 1; return send(continuation); } });
      assert.equal(receipt.result, "BLOCKED");
      assert.equal(receipt.one_use_consumed, false);
      assert.equal(receipt.send_count, 0);
      assert.equal(sends, 0);
    } finally { await rm(root, { recursive: true, force: true }); }
  }
});

test("Lady Jessica projection exposes exactly the three current prerequisites", () => {
  const blocked = projectLadyJessicaBetsyPrerequisites({ stations: [], bindings: [], registrations: [] });
  assert.equal(blocked.state, "MISSING_CLAIMS");
  assert.equal(blocked.blocker, "EXACT_LADY_JESSICA_WERKLES_SITE_TASK_ROUTE_AND_HELD_ACTION_NOT_REGISTERED");
  assert.deepEqual(blocked.missing, ["BETSY_STATION", "EXACT_EXISTING_LADY_JESSICA_TASK_BINDING", "AUTHENTICATED_PROVIDER_HELD_PROMPT_EVENT"]);
  const ready = projectLadyJessicaBetsyPrerequisites({ stations: [{ station_id: "betsy", hostname: "BETSY", state: "ACTIVE" }], bindings: [binding()], registrations: [registration()] });
  assert.equal(ready.state, "CLAIMS_PRESENT_UNVERIFIED");
  assert.equal(ready.blocker, "TRUSTED_PROVIDER_CONTINUATION_ADAPTER_NOT_CONNECTED");
  assert.deepEqual(ready.missing, []);
});

test("durable Swateyes preparation loads intake but blocks without an exact trusted task route", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "harvey-swateyes-durable-"));
  try {
    const registered = registration();
    await persistHarveyHeldPromptRegistration(registered, root);
    const projected = await projectHarveySwateyesDurableContinuationPrerequisites({
      registrationId: registered.registration_id,
      authorityReceipts: [authority()],
      repositoryRoot: root,
      evaluatorNow: NOW,
    });
    assert.equal(projected.state, "BLOCKED");
    assert.equal(projected.blocker, "TRUSTED_PROVIDER_CONTINUATION_ADAPTER_NOT_CONNECTED");
    assert.deepEqual(projected.reason_codes, [
      "DURABLE_REGISTRATION_LOADED",
      "POLICY_ELIGIBLE",
      "PROVIDER_ADAPTER_NOT_LOADED",
    ]);
    assert.equal(projected.task_bridge_eligible, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
