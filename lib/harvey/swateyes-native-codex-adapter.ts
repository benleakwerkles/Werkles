import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  bindHarveySwateyesPromptPolicy,
  type HarveySwateyesAuthorityReceipt,
  type HarveySwateyesPromptEvidence,
} from "./swateyes-authority.ts";
import {
  readHarveyHeldPromptRegistration,
  type HarveyHeldPromptRegistration,
} from "./held-prompt-registration.ts";
import type {
  HarveySwateyesContinuationReceipt,
  HarveySwateyesProviderContinuation,
  HarveySwateyesProviderTerminal,
  HarveySwateyesTaskBinding,
} from "./swateyes-continuation.ts";

export type HarveyNativeCodexHeldTaskEvidence = {
  schema: "werkles.harvey-native-codex-held-task-evidence/v1";
  source: "CODEX_APP_NATIVE_TASK_TOOL";
  observed_at: string;
  host_id: string;
  task_thread_id: string;
  prompt_id: string;
  task_cursor: string;
  task_state: "WAITING_ON_APPROVAL";
  approval_kind: "INTERNAL_COMMAND";
};

export type HarveyNativeCodexTerminalEvidence = {
  schema: "werkles.harvey-native-codex-terminal-evidence/v1";
  source: "CODEX_APP_NATIVE_TASK_TOOL";
  continuation_id: string;
  observed_at: string;
  host_id: string;
  task_thread_id: string;
  prompt_id: string;
  before_cursor: string;
  after_cursor: string;
  task_state: "COMPLETED" | "WAITING_ON_APPROVAL";
  result: "RESUMED" | "BLOCKED";
  detail: string;
};

export type HarveyNativeCodexWaitResult = {
  schema: "werkles.harvey-native-codex-wait-result/v1";
  source: "CODEX_APP_NATIVE_TASK_TOOL";
  observed_at: string;
  host_id: string;
  task_thread_id: string;
  before_cursor: string;
  after_cursor: string;
  task_state: "COMPLETED" | "WAITING_ON_APPROVAL";
  reply: string;
};

export type HarveyNativeCodexSendOnce = {
  schema: "werkles.harvey-native-codex-send-once/v1";
  state: "SEND_ONCE";
  claim_id: string;
  claimed_at: string;
  before_cursor: string;
  authority_receipt_id: string;
  operation_id: string;
  continuation: HarveySwateyesProviderContinuation;
};

const TASK_ID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:@-]{2,159}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const MAX_NATIVE_EVIDENCE_AGE_MS = 5 * 60 * 1000;

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
    .join(",")}}`;
}

function promptEvidence(registration: HarveyHeldPromptRegistration): HarveySwateyesPromptEvidence {
  const event = registration.source_event;
  return {
    schema: "werkles.harvey-swateyes-prompt-evidence/v1",
    prompt_id: event.prompt_id,
    observed_at: event.observed_at,
    platform: "CODEX_INTERNAL",
    task_thread_id: event.task_thread_id,
    machine: event.machine,
    project_id: event.project_id,
    action: event.action,
    executable_sha256: event.executable_sha256,
    arguments_sha256: event.arguments_sha256,
    cwd: event.cwd,
    target_paths: [...event.target_paths],
    one_use_nonce: event.one_use_nonce,
  };
}

function assertExactCodexRoute(
  registration: HarveyHeldPromptRegistration,
  binding: HarveySwateyesTaskBinding,
  native: HarveyNativeCodexHeldTaskEvidence,
  now: Date,
) {
  const event = registration.source_event;
  const observed = Date.parse(native.observed_at);
  if (
    native.schema !== "werkles.harvey-native-codex-held-task-evidence/v1"
    || native.source !== "CODEX_APP_NATIVE_TASK_TOOL"
    || native.task_state !== "WAITING_ON_APPROVAL"
    || native.approval_kind !== "INTERNAL_COMMAND"
    || !ID.test(native.host_id)
    || !TASK_ID.test(native.task_thread_id)
    || !ID.test(native.prompt_id)
    || !ID.test(native.task_cursor)
    || !Number.isFinite(observed)
    || observed < Date.parse(event.observed_at)
    || now.getTime() - observed < 0
    || now.getTime() - observed > MAX_NATIVE_EVIDENCE_AGE_MS
    || event.provider !== "Codex"
    || binding.provider !== "Codex"
    || binding.state !== "BOUND_PROVEN"
    || native.host_id !== event.host_id
    || native.host_id !== binding.host_id
    || native.task_thread_id !== event.task_thread_id
    || native.task_thread_id !== binding.task_thread_id
    || native.prompt_id !== event.prompt_id
    || binding.machine !== event.machine
    || binding.physical_hostname !== event.physical_hostname
    || binding.project_id !== event.project_id
  ) throw new Error("SWATEYES_NATIVE_CODEX_EXACT_HELD_ROUTE_NOT_PROVEN");
}

function continuationFor(
  registration: HarveyHeldPromptRegistration,
  binding: HarveySwateyesTaskBinding,
): HarveySwateyesProviderContinuation {
  const event = registration.source_event;
  const continuationId = `swateyes-continuation.${digest(`${registration.registration_id}|${binding.binding_id}|${event.prompt_id}|${event.one_use_nonce}`)}`;
  return {
    schema: "werkles.harvey-swateyes-provider-continuation/v1",
    continuation_id: continuationId,
    binding_id: binding.binding_id,
    provider: "Codex",
    host_id: binding.host_id,
    task_thread_id: binding.task_thread_id,
    prompt_id: event.prompt_id,
    action: event.action,
    body: [
      `SWATEYES CONTINUATION — ${event.prompt_id}`,
      `Continue the already-authorized ${event.action} operation held by this exact internal prompt.`,
      `Exact existing task: ${binding.task_thread_id}`,
      `Scoped targets: ${event.target_paths.length ? event.target_paths.join(", ") : "NONE"}`,
      "Do not expand scope or cross any secret, sign-in, spend, push/merge, deploy/publish, production-mutation, destructive, or recurring-operation gate.",
      `Return exactly one terminal line: SWATEYES_TERMINAL {\"schema\":\"werkles.harvey-swateyes-terminal-marker/v1\",\"continuation_id\":\"${continuationId}\",\"prompt_id\":\"${event.prompt_id}\",\"action\":\"${event.action}\",\"result\":\"RESUMED|BLOCKED\",\"detail\":\"bounded terminal evidence\"}`,
    ].join("\n"),
  };
}

function exactOperation(
  registration: HarveyHeldPromptRegistration,
  authorityReceipts: HarveySwateyesAuthorityReceipt[],
) {
  const event = registration.source_event;
  const receipt = authorityReceipts.find((candidate) => candidate.status === "APPROVED"
    && candidate.machine === event.machine
    && candidate.project_id === event.project_id
    && candidate.allowed_operations.some((operation) => operation.platform === "CODEX_INTERNAL"
      && operation.task_thread_id === event.task_thread_id
      && operation.action === event.action
      && operation.executable_sha256 === event.executable_sha256
      && operation.arguments_sha256 === event.arguments_sha256
      && operation.cwd === event.cwd
      && canonical(operation.target_paths) === canonical(event.target_paths)
      && operation.maximum_uses === 1));
  const operation = receipt?.allowed_operations.find((candidate) => candidate.platform === "CODEX_INTERNAL"
    && candidate.task_thread_id === event.task_thread_id
    && candidate.action === event.action
    && candidate.executable_sha256 === event.executable_sha256
    && candidate.arguments_sha256 === event.arguments_sha256
    && candidate.cwd === event.cwd
    && canonical(candidate.target_paths) === canonical(event.target_paths)
    && candidate.maximum_uses === 1);
  if (!receipt || !operation) throw new Error("SWATEYES_NATIVE_CODEX_EXACT_OPERATION_AUTHORITY_NOT_PROVEN");
  return { receipt, operation };
}

export async function prepareHarveyNativeCodexSendOnce({
  registrationId,
  binding,
  authorityReceipts,
  nativeHeldTask,
  repositoryRoot = process.cwd(),
  evaluatorNow = new Date(),
}: {
  registrationId: string;
  binding: HarveySwateyesTaskBinding;
  authorityReceipts: HarveySwateyesAuthorityReceipt[];
  nativeHeldTask: HarveyNativeCodexHeldTaskEvidence;
  repositoryRoot?: string;
  evaluatorNow?: string | Date;
}): Promise<HarveyNativeCodexSendOnce> {
  const now = evaluatorNow instanceof Date ? evaluatorNow : new Date(evaluatorNow);
  if (!Number.isFinite(now.getTime())) throw new Error("SWATEYES_EVALUATOR_TIME_INVALID");
  const registration = await readHarveyHeldPromptRegistration(registrationId, repositoryRoot);
  assertExactCodexRoute(registration, binding, nativeHeldTask, now);
  const policy = bindHarveySwateyesPromptPolicy(
    registration.permission_request_claim,
    authorityReceipts,
    promptEvidence(registration),
    new Set(),
    now,
  );
  if (policy.state !== "POLICY_ELIGIBLE_NOT_EXECUTABLE") {
    throw new Error(`SWATEYES_NATIVE_CODEX_POLICY_DENIED:${policy.reason_codes.join(",")}`);
  }

  const continuation = continuationFor(registration, binding);
  const { receipt, operation } = exactOperation(registration, authorityReceipts);
  // Cursor is evidence, not identity. A changed cursor must never mint another
  // use for the same authenticated prompt/nonce/continuation.
  const claimId = digest(`${registration.registration_id}|${continuation.continuation_id}|${registration.source_event.prompt_id}|${registration.source_event.one_use_nonce}`);
  const base = path.join(repositoryRoot, "data", "harvey", "held-prompts", "continuations", "native-codex");
  const claimPath = path.join(base, `${claimId}.json`);
  await mkdir(base, { recursive: true });
  try {
    await writeFile(claimPath, `${JSON.stringify({
      claim_id: claimId,
      continuation_id: continuation.continuation_id,
      binding_id: continuation.binding_id,
      registration_id: registration.registration_id,
      host_id: continuation.host_id,
      task_thread_id: continuation.task_thread_id,
      prompt_id: continuation.prompt_id,
      one_use_nonce_sha256: digest(registration.source_event.one_use_nonce),
      machine: binding.machine,
      physical_hostname: binding.physical_hostname,
      project_id: binding.project_id,
      before_cursor: nativeHeldTask.task_cursor,
      authority_receipt_id: receipt.receipt_id,
      operation_id: operation.operation_id,
      continuation,
      continuation_sha256: digest(canonical(continuation)),
      claimed_at: now.toISOString(),
    }, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error("SWATEYES_NATIVE_CODEX_ONE_USE_ALREADY_CLAIMED");
    }
    throw error;
  }
  return {
    schema: "werkles.harvey-native-codex-send-once/v1",
    state: "SEND_ONCE",
    claim_id: claimId,
    claimed_at: now.toISOString(),
    before_cursor: nativeHeldTask.task_cursor,
    authority_receipt_id: receipt.receipt_id,
    operation_id: operation.operation_id,
    continuation,
  };
}

export function deriveHarveyNativeCodexTerminalEvidence(
  prepared: HarveyNativeCodexSendOnce,
  nativeWaitResult: HarveyNativeCodexWaitResult,
): HarveyNativeCodexTerminalEvidence {
  if (
    nativeWaitResult.schema !== "werkles.harvey-native-codex-wait-result/v1"
    || nativeWaitResult.source !== "CODEX_APP_NATIVE_TASK_TOOL"
    || nativeWaitResult.host_id !== prepared.continuation.host_id
    || nativeWaitResult.task_thread_id !== prepared.continuation.task_thread_id
    || nativeWaitResult.before_cursor !== prepared.before_cursor
    || nativeWaitResult.after_cursor === nativeWaitResult.before_cursor
    || !ID.test(nativeWaitResult.after_cursor)
    || typeof nativeWaitResult.reply !== "string"
    || Buffer.byteLength(nativeWaitResult.reply, "utf8") > 8192
  ) throw new Error("SWATEYES_NATIVE_CODEX_WAIT_RESULT_INVALID");
  const markers = nativeWaitResult.reply.split(/\r?\n/)
    .filter((line) => line.startsWith("SWATEYES_TERMINAL "));
  if (markers.length !== 1) throw new Error("SWATEYES_NATIVE_CODEX_TERMINAL_MARKER_MISSING_OR_AMBIGUOUS");
  let marker: Record<string, unknown>;
  try { marker = JSON.parse(markers[0].slice("SWATEYES_TERMINAL ".length)) as Record<string, unknown>; }
  catch { throw new Error("SWATEYES_NATIVE_CODEX_TERMINAL_MARKER_INVALID"); }
  const expectedKeys = ["action", "continuation_id", "detail", "prompt_id", "result", "schema"].sort().join("|");
  if (
    Object.keys(marker).sort().join("|") !== expectedKeys
    || marker.schema !== "werkles.harvey-swateyes-terminal-marker/v1"
    || marker.continuation_id !== prepared.continuation.continuation_id
    || marker.prompt_id !== prepared.continuation.prompt_id
    || marker.action !== prepared.continuation.action
    || !["RESUMED", "BLOCKED"].includes(String(marker.result))
    || typeof marker.detail !== "string"
    || marker.detail.length < 1
    || Buffer.byteLength(marker.detail, "utf8") > 2048
    || (marker.result === "RESUMED" && nativeWaitResult.task_state !== "COMPLETED")
    || (marker.result === "BLOCKED" && nativeWaitResult.task_state !== "WAITING_ON_APPROVAL")
  ) throw new Error("SWATEYES_NATIVE_CODEX_TERMINAL_MARKER_INVALID");
  return {
    schema: "werkles.harvey-native-codex-terminal-evidence/v1",
    source: "CODEX_APP_NATIVE_TASK_TOOL",
    continuation_id: prepared.continuation.continuation_id,
    observed_at: nativeWaitResult.observed_at,
    host_id: nativeWaitResult.host_id,
    task_thread_id: nativeWaitResult.task_thread_id,
    prompt_id: prepared.continuation.prompt_id,
    before_cursor: nativeWaitResult.before_cursor,
    after_cursor: nativeWaitResult.after_cursor,
    task_state: nativeWaitResult.task_state,
    result: marker.result as "RESUMED" | "BLOCKED",
    detail: marker.detail,
  };
}

export async function admitHarveyNativeCodexTerminal({
  prepared,
  nativeWaitResult,
  repositoryRoot = process.cwd(),
  evaluatorNow = new Date(),
}: {
  prepared: HarveyNativeCodexSendOnce;
  nativeWaitResult: HarveyNativeCodexWaitResult;
  repositoryRoot?: string;
  evaluatorNow?: string | Date;
}): Promise<HarveySwateyesContinuationReceipt> {
  const terminal = deriveHarveyNativeCodexTerminalEvidence(prepared, nativeWaitResult);
  const continuation = prepared.continuation;
  const observed = Date.parse(terminal.observed_at);
  const evaluated = evaluatorNow instanceof Date ? evaluatorNow.getTime() : Date.parse(evaluatorNow);
  if (
    prepared.schema !== "werkles.harvey-native-codex-send-once/v1"
    || prepared.state !== "SEND_ONCE"
    || !SHA256.test(prepared.claim_id)
    || terminal.schema !== "werkles.harvey-native-codex-terminal-evidence/v1"
    || terminal.source !== "CODEX_APP_NATIVE_TASK_TOOL"
    || terminal.continuation_id !== continuation.continuation_id
    || terminal.host_id !== continuation.host_id
    || terminal.task_thread_id !== continuation.task_thread_id
    || terminal.prompt_id !== continuation.prompt_id
    || terminal.before_cursor !== prepared.before_cursor
    || terminal.after_cursor === terminal.before_cursor
    || !ID.test(terminal.after_cursor)
    || !Number.isFinite(observed)
    || !Number.isFinite(evaluated)
    || observed < Date.parse(prepared.claimed_at)
    || observed > evaluated
    || evaluated - observed > MAX_NATIVE_EVIDENCE_AGE_MS
    || typeof terminal.detail !== "string"
    || terminal.detail.length < 1
    || Buffer.byteLength(terminal.detail, "utf8") > 2048
    || (terminal.result === "RESUMED" && terminal.task_state !== "COMPLETED")
    || (terminal.result === "BLOCKED" && terminal.task_state !== "WAITING_ON_APPROVAL")
  ) throw new Error("SWATEYES_NATIVE_CODEX_TERMINAL_EVIDENCE_INVALID");

  const base = path.join(repositoryRoot, "data", "harvey", "held-prompts", "continuations", "native-codex");
  const claimPath = path.join(base, `${prepared.claim_id}.json`);
  const claim = JSON.parse(await readFile(claimPath, "utf8")) as {
    claim_id: string;
    continuation_id: string;
    binding_id: string;
    registration_id: string;
    host_id: string;
    task_thread_id: string;
    prompt_id: string;
    one_use_nonce_sha256: string;
    machine: string;
    physical_hostname: string;
    project_id: string;
    before_cursor: string;
    authority_receipt_id: string;
    operation_id: string;
    continuation: HarveySwateyesProviderContinuation;
    continuation_sha256: string;
    claimed_at: string;
  };
  if (
    claim.claim_id !== prepared.claim_id
    || claim.continuation_id !== continuation.continuation_id
    || claim.binding_id !== continuation.binding_id
    || claim.task_thread_id !== continuation.task_thread_id
    || claim.prompt_id !== continuation.prompt_id
    || claim.before_cursor !== prepared.before_cursor
    || claim.host_id !== continuation.host_id
    || claim.authority_receipt_id !== prepared.authority_receipt_id
    || claim.operation_id !== prepared.operation_id
    || claim.continuation_sha256 !== digest(canonical(continuation))
    || canonical(claim.continuation) !== canonical(continuation)
  ) throw new Error("SWATEYES_NATIVE_CODEX_CLAIM_INVALID");

  const providerTerminal: HarveySwateyesProviderTerminal = {
    schema: "werkles.harvey-swateyes-provider-terminal/v1",
    continuation_id: continuation.continuation_id,
    provider: "Codex",
    host_id: continuation.host_id,
    task_thread_id: continuation.task_thread_id,
    prompt_id: continuation.prompt_id,
    result: terminal.result,
    observed_at: terminal.observed_at,
    detail: terminal.detail,
  };
  const unsigned = {
    registration_id: claim.registration_id,
    binding_id: continuation.binding_id,
    prompt_id: continuation.prompt_id,
    one_use_nonce_sha256: claim.one_use_nonce_sha256,
    task_thread_id: continuation.task_thread_id,
    machine: claim.machine as HarveySwateyesTaskBinding["machine"],
    physical_hostname: claim.physical_hostname,
    project_id: claim.project_id,
    action: continuation.action,
    result: terminal.result,
    reason_codes: terminal.result === "RESUMED" ? ["STRUCTURED_EXACT_TERMINAL_RESUMED__CALLER_ATTESTED"] : ["PROVIDER_RETURNED_BLOCKED"],
    one_use_consumed: true,
    send_attempted: true,
    send_count: 1 as const,
    consumed_at: prepared.claimed_at,
    terminal_at: terminal.observed_at,
    provider_terminal: providerTerminal,
  };
  const receipt: HarveySwateyesContinuationReceipt = {
    schema: "werkles.harvey-swateyes-continuation-receipt/v1",
    receipt_id: `swateyes-receipt.${digest(JSON.stringify(unsigned))}`,
    ...unsigned,
  };
  const receiptPath = path.join(base, `${prepared.claim_id}.receipt.json`);
  try {
    await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const prior = JSON.parse(await readFile(receiptPath, "utf8")) as HarveySwateyesContinuationReceipt;
    if (JSON.stringify(prior) !== JSON.stringify(receipt)) {
      throw new Error("SWATEYES_NATIVE_CODEX_TERMINAL_RECEIPT_CONFLICT");
    }
    return prior;
  }
  return receipt;
}

export async function removeHarveyNativeCodexTestClaim(repositoryRoot: string) {
  await rm(path.join(repositoryRoot, "data", "harvey", "held-prompts", "continuations", "native-codex"), { recursive: true, force: true });
}
