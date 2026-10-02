import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  bindHarveySwateyesPromptPolicy,
  compileHarveyOvernightSwateyesReceipt,
  decideHarveySwateyesAuthority
} from "../../../lib/harvey/swateyes-authority.ts";

const repo = path.resolve(import.meta.dirname, "..", "..", "..");
const EVALUATOR_NOW = "2026-07-29T07:00:00-04:00";
const TASK_THREAD_ID = "019f5458-630b-75b2-85d4-04ac74c8b6a9";

function operation(overrides = {}) {
  return {
    operation_id: "operation.harvey.doss.local-test.001",
    platform: "CODEX_INTERNAL",
    task_thread_id: TASK_THREAD_ID,
    action: "RUN_LOCAL_TEST",
    executable_sha256: "a".repeat(64),
    arguments_sha256: "b".repeat(64),
    cwd: "C:\\Users\\BenLeak\\github\\Werkles",
    target_paths: ["scripts/foreman/harvey-tests/swateyes-authority.test.mjs"],
    maximum_uses: 1,
    ...overrides
  };
}

function decide(candidateRequest, candidateReceipts) {
  return decideHarveySwateyesAuthority(
    candidateRequest,
    candidateReceipts,
    EVALUATOR_NOW
  );
}

function receipt(overrides = {}) {
  return {
    schema: "werkles.harvey-swateyes-authority-receipt/v1",
    receipt_id: "approval.harvey-command.doss.001",
    status: "APPROVED",
    granted_by: "BEN_OPERATOR",
    machine: "Doss",
    project_id: "harvey-command",
    allowed_actions: ["READ_REPO", "WRITE_SCOPED_FILE", "RUN_LOCAL_TEST"],
    allowed_operations: [operation()],
    issued_at: "2026-07-29T05:00:00-04:00",
    expires_at: "2026-07-29T13:00:00-04:00",
    recurring_operation_authority: false,
    ...overrides
  };
}

function prompt(overrides = {}) {
  return {
    schema: "werkles.harvey-swateyes-prompt-evidence/v1",
    prompt_id: "prompt.codex.doss.001",
    observed_at: EVALUATOR_NOW,
    platform: "CODEX_INTERNAL",
    task_thread_id: TASK_THREAD_ID,
    machine: "Doss",
    project_id: "harvey-command",
    action: "RUN_LOCAL_TEST",
    executable_sha256: "a".repeat(64),
    arguments_sha256: "b".repeat(64),
    cwd: "C:\\Users\\BenLeak\\github\\Werkles",
    target_paths: ["scripts/foreman/harvey-tests/swateyes-authority.test.mjs"],
    one_use_nonce: "c".repeat(32),
    ...overrides
  };
}

function request(overrides = {}) {
  return {
    schema: "werkles.harvey-swateyes-permission-request/v1",
    request_id: "permission.test.001",
    requested_at: "2026-07-29T07:00:00-04:00",
    machine: "Doss",
    project_id: "harvey-command",
    action: "RUN_LOCAL_TEST",
    platform_permission_prompt: true,
    requires_secret: false,
    requires_provider_sign_in: false,
    recurring_operation: false,
    paid_action: false,
    push_or_merge: false,
    deploy_or_publish: false,
    production_mutation: false,
    destructive_or_irreversible: false,
    ...overrides
  };
}

test("Swateyes clears an internal prompt when exact authority already exists", () => {
  const decision = decide(request(), [receipt()]);
  assert.equal(decision.decision, "ALLOW_ALREADY_GRANTED_ACTION");
  assert.equal(decision.receipt_id, "approval.harvey-command.doss.001");
  assert.equal(decision.platform_prompt_was_human_gate, false);
  assert.deepEqual(decision.reason_codes, [
    "AUTHORITY_ALREADY_GRANTED",
    "INTERNAL_PLATFORM_PROMPT_IS_NOT_A_HUMAN_GATE"
  ]);
});

test("Swateyes fails closed for the wrong machine, project, action, or time window", () => {
  for (const [candidate, expected] of [
    [request({ machine: "Betsy" }), "DENY_MISSING_OR_MISMATCHED_AUTHORITY"],
    [request({ project_id: "harvey-book" }), "DENY_MISSING_OR_MISMATCHED_AUTHORITY"],
    [request({ action: "INSTALL_PACKAGE" }), "HUMAN_GATE"],
    [request({ requested_at: "2026-07-29T14:00:00-04:00" }), "DENY_MISSING_OR_MISMATCHED_AUTHORITY"]
  ]) {
    const decision = decide(candidate, [receipt()]);
    assert.equal(decision.decision, expected);
  }
});

test("Swateyes preserves true human gates even when an action is allowlisted", () => {
  const guardedFlags = [
    "requires_secret",
    "requires_provider_sign_in",
    "recurring_operation",
    "paid_action",
    "push_or_merge",
    "deploy_or_publish",
    "production_mutation",
    "destructive_or_irreversible"
  ];
  for (const flag of guardedFlags) {
    const guardedReceipt = receipt({ allowed_actions: ["RUN_LOCAL_TEST", "DANGEROUS_ACTION"] });
    const decision = decide(
      request({ action: "DANGEROUS_ACTION", [flag]: true }),
      [guardedReceipt]
    );
    assert.equal(decision.decision, "HUMAN_GATE", flag);
    assert.equal(decision.platform_prompt_was_human_gate, true, flag);
  }
});

test("a revoked or recurrence-bearing receipt cannot authorize ordinary work", () => {
  for (const candidate of [
    receipt({ status: "REVOKED" }),
    receipt({ recurring_operation_authority: true })
  ]) {
    const decision = decide(request(), [candidate]);
    assert.equal(decision.decision, "DENY_MISSING_OR_MISMATCHED_AUTHORITY");
  }
});

test("Swateyes rejects untyped flags, extra fields, malformed actions, and duplicate receipt IDs", () => {
  assert.throws(
    () => decide(request({ paid_action: "false" }), [receipt()]),
    /SWATEYES_REQUEST_INVALID/
  );
  assert.throws(
    () => decide({ ...request(), trusted: true }, [receipt()]),
    /SWATEYES_REQUEST_KEYS_INVALID/
  );
  assert.throws(
    () => decide(request(), [receipt({ allowed_actions: ["run local test"] })]),
    /SWATEYES_RECEIPT_INVALID/
  );
  assert.throws(
    () => decide(request(), [receipt(), receipt()]),
    /SWATEYES_RECEIPT_ID_DUPLICATE/
  );
});

test("Swateyes selects the newest exact active authority deterministically", () => {
  const older = receipt({ receipt_id: "approval.harvey-command.doss.older" });
  const newer = receipt({
    receipt_id: "approval.harvey-command.doss.newer",
    issued_at: "2026-07-29T06:00:00-04:00"
  });
  for (const candidates of [[older, newer], [newer, older]]) {
    const decision = decide(request(), candidates);
    assert.equal(decision.receipt_id, newer.receipt_id);
  }
});

test("true human gates fail closed before any receipt can influence the result", () => {
  const decision = decide(
    request({ deploy_or_publish: true }),
    [receipt({ allowed_actions: ["RUN_LOCAL_TEST", "DEPLOY_PRODUCTION"] })]
  );
  assert.equal(decision.decision, "HUMAN_GATE");
  assert.deepEqual(decision.reason_codes, ["DEPLOY_OR_PUBLISH_REQUIRES_APPROVAL"]);
  assert.equal(decision.receipt_id, null);
});

test("unknown or dangerous labels cannot disguise true gates with false caller flags", () => {
  const dangerousActions = [
    "ENTER_SECRET",
    "PROVIDER_SIGN_IN",
    "START_RECURRING_OPERATION",
    "SPEND_MONEY",
    "PUSH_MAIN",
    "MERGE_MAIN",
    "DEPLOY_PRODUCTION",
    "PUBLISH_PUBLIC",
    "MUTATE_PRODUCTION",
    "DESTROY_DATA"
  ];
  for (const action of dangerousActions) {
    const decision = decide(
      request({ action }),
      [receipt({ allowed_actions: ["RUN_LOCAL_TEST", action] })]
    );
    assert.equal(decision.decision, "HUMAN_GATE", action);
    assert.ok(
      decision.reason_codes.includes("UNKNOWN_OR_UNBOUND_ACTION_REQUIRES_HUMAN_REVIEW"),
      action
    );
  }
});

test("backdating cannot revive expired authority", () => {
  const decision = decideHarveySwateyesAuthority(
    request({ requested_at: "2025-07-29T07:00:00-04:00" }),
    [receipt({
      issued_at: "2025-07-29T05:00:00-04:00",
      expires_at: "2025-07-29T13:00:00-04:00"
    })],
    EVALUATOR_NOW
  );
  assert.equal(decision.decision, "DENY_MISSING_OR_MISMATCHED_AUTHORITY");
  assert.deepEqual(decision.reason_codes, ["REQUEST_TIME_OUTSIDE_TRUSTED_EVALUATOR_WINDOW"]);
});

test("a matching revocation outranks an older approval", () => {
  const decision = decide(request(), [
    receipt(),
    receipt({
      receipt_id: "approval.harvey-command.doss.revocation",
      status: "REVOKED",
      issued_at: "2026-07-29T06:30:00-04:00"
    })
  ]);
  assert.equal(decision.decision, "DENY_MISSING_OR_MISMATCHED_AUTHORITY");
  assert.deepEqual(decision.reason_codes, ["MATCHING_AUTHORITY_REVOKED"]);
});

test("the bounded Doss receipt compiles only from both exact operator records", () => {
  const approvalLog = [
    "| 2026-07-29T06:14:00-04:00 | Harvey overnight 20-minute build cycle |",
    "APPROVED — 20-MINUTE CODEX HEARTBEAT; 24 WAKES / 8 HOURS;",
    "`[IN PROGRESS: HARVEY_OVERNIGHT_20_MINUTE_BUILD]`"
  ].join("\n");
  const gateContract = [
    "Status: `APPROVED_FOR_BOUNDED_ACTIVATION`",
    "Machine and environment: `Doss`, `CODEX_LOCAL`",
    "at most 24 scheduled wakes over eight hours",
    "No push, merge, deploy, provider sign-in, secrets, production mutation,"
  ].join("\n");
  const compiled = compileHarveyOvernightSwateyesReceipt(approvalLog, gateContract);
  assert.equal(compiled?.machine, "Doss");
  assert.equal(compiled?.project_id, "harvey");
  assert.deepEqual(compiled?.allowed_actions, [
    "READ_REPO",
    "WRITE_SCOPED_FILE",
    "RUN_LOCAL_TEST",
    "RUN_LOCAL_TYPECHECK",
    "RUN_LOCAL_BUILD"
  ]);
  assert.equal(
    compileHarveyOvernightSwateyesReceipt(
      approvalLog.replace("APPROVED", "PENDING"),
      gateContract
    ),
    null
  );
  assert.equal(
    compileHarveyOvernightSwateyesReceipt(
      approvalLog,
      gateContract.replace("No push", "Push")
    ),
    null
  );
});

test("current canonical operator records compile the active bounded Doss authority source", async () => {
  const [approvalLog, gateContract] = await Promise.all([
    readFile(path.join(repo, "foreman", "gates", "APPROVAL_LOG.md"), "utf8"),
    readFile(
      path.join(
        repo,
        "foreman",
        "reviews",
        "GATE-harvey-overnight-20-minute-build-20260729-0614.md"
      ),
      "utf8"
    )
  ]);
  const compiled = compileHarveyOvernightSwateyesReceipt(
    approvalLog,
    gateContract
  );
  assert.equal(compiled?.receipt_id, "approval.harvey-overnight.doss.20260729");
  assert.deepEqual(compiled?.allowed_operations, []);
});

test("exact prompt and exact operation grant become policy-eligible but never executable", () => {
  const decision = bindHarveySwateyesPromptPolicy(
    request(),
    [receipt()],
    prompt(),
    new Set(),
    EVALUATOR_NOW
  );
  assert.equal(decision.state, "POLICY_ELIGIBLE_NOT_EXECUTABLE");
  assert.equal(decision.execution_authorized, false);
  assert.deepEqual(decision.reason_codes, [
    "POLICY_ONLY_EXECUTION_ADAPTER_NOT_CONNECTED"
  ]);
});

test("prompt scope, operation identity, and replay mismatches fail closed", () => {
  for (const [candidate, consumed, expected] of [
    [prompt({ machine: "Betsy" }), new Set(), "PROMPT_REQUEST_SCOPE_MISMATCH"],
    [prompt({ task_thread_id: "019f5454-de3e-7f81-8c17-86561b7f6ead" }), new Set(), "EXACT_OPERATION_GRANT_NOT_FOUND"],
    [prompt({ executable_sha256: "d".repeat(64) }), new Set(), "EXACT_OPERATION_GRANT_NOT_FOUND"],
    [prompt({ arguments_sha256: "d".repeat(64) }), new Set(), "EXACT_OPERATION_GRANT_NOT_FOUND"],
    [prompt({ cwd: "C:\\Users\\BenLeak\\github\\Other" }), new Set(), "EXACT_OPERATION_GRANT_NOT_FOUND"],
    [prompt({ target_paths: ["lib/harvey/swateyes-authority.ts"] }), new Set(), "EXACT_OPERATION_GRANT_NOT_FOUND"],
    [prompt(), new Set(["prompt.codex.doss.001"]), "PROMPT_REPLAY_DETECTED"],
    [prompt(), new Set(["c".repeat(32)]), "PROMPT_REPLAY_DETECTED"]
  ]) {
    const decision = bindHarveySwateyesPromptPolicy(
      request(),
      [receipt()],
      candidate,
      consumed,
      EVALUATOR_NOW
    );
    assert.equal(decision.state, "DENIED");
    assert.ok(decision.reason_codes.includes(expected), expected);
    assert.equal(decision.execution_authorized, false);
  }
});

test("prompt evidence rejects path traversal, stale observation, extra fields, and unknown platforms", () => {
  for (const candidate of [
    prompt({ target_paths: ["../outside.txt"] }),
    prompt({ cwd: "C:\\Users\\BenLeak\\github\\Werkles\\..\\Other" }),
    prompt({ observed_at: "2026-07-29T06:00:00-04:00" }),
    { ...prompt(), surprise: true },
    prompt({ platform: "PROVIDER_INTERNAL" })
  ]) {
    assert.throws(
      () => bindHarveySwateyesPromptPolicy(
        request(),
        [receipt()],
        candidate,
        new Set(),
        EVALUATOR_NOW
      ),
      /SWATEYES_PROMPT_EVIDENCE/
    );
  }
});

test("the live bounded receipt cannot bind a prompt because no exact operation was granted", async () => {
  const [approvalLog, gateContract] = await Promise.all([
    readFile(path.join(repo, "foreman", "gates", "APPROVAL_LOG.md"), "utf8"),
    readFile(
      path.join(
        repo,
        "foreman",
        "reviews",
        "GATE-harvey-overnight-20-minute-build-20260729-0614.md"
      ),
      "utf8"
    )
  ]);
  const compiled = compileHarveyOvernightSwateyesReceipt(approvalLog, gateContract);
  assert.ok(compiled);
  const decision = bindHarveySwateyesPromptPolicy(
    request({ project_id: "harvey" }),
    [compiled],
    prompt({ project_id: "harvey" }),
    new Set(),
    EVALUATOR_NOW
  );
  assert.equal(decision.state, "DENIED");
  assert.ok(decision.reason_codes.includes("EXACT_OPERATION_GRANT_NOT_FOUND"));
  assert.equal(decision.execution_authorized, false);
});
