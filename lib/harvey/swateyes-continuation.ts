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
  registerHarveyHeldPromptEvent,
  type HarveyHeldPromptRegistration,
} from "./held-prompt-registration.ts";

export type HarveySwateyesTaskBinding = {
  schema: "werkles.harvey-swateyes-task-binding/v1";
  binding_id: string;
  state: "BOUND_PROVEN" | "DISABLED" | "REVOKED";
  provider: "Codex" | "Cursor";
  host_id: string;
  task_thread_id: string;
  machine: "Doss" | "Betsy" | "Spanzee" | "Medullina" | "Sally";
  physical_hostname: string;
  project_id: string;
  seat_id: string;
};

export type HarveySwateyesProviderContinuation = {
  schema: "werkles.harvey-swateyes-provider-continuation/v1";
  continuation_id: string;
  binding_id: string;
  provider: "Codex" | "Cursor";
  host_id: string;
  task_thread_id: string;
  prompt_id: string;
  action: string;
  body: string;
};

export type HarveySwateyesProviderTerminal = {
  schema: "werkles.harvey-swateyes-provider-terminal/v1";
  continuation_id: string;
  provider: "Codex" | "Cursor";
  host_id: string;
  task_thread_id: string;
  prompt_id: string;
  result: "RESUMED" | "BLOCKED";
  observed_at: string;
  detail: string;
};

export type HarveySwateyesContinuationReceipt = {
  schema: "werkles.harvey-swateyes-continuation-receipt/v1";
  receipt_id: string;
  registration_id: string;
  binding_id: string;
  prompt_id: string;
  one_use_nonce_sha256: string;
  task_thread_id: string;
  machine: HarveySwateyesTaskBinding["machine"];
  physical_hostname: string;
  project_id: string;
  action: string;
  result: "RESUMED" | "BLOCKED";
  reason_codes: string[];
  one_use_consumed: boolean;
  send_attempted: boolean;
  send_count: 0 | 1;
  consumed_at: string | null;
  terminal_at: string;
  provider_terminal: HarveySwateyesProviderTerminal | null;
};

export const HARVEY_SWATEYES_CONTINUATION_ACTIVATION = "PREPARED_NOT_EXECUTABLE" as const;

export async function projectHarveySwateyesDurableContinuationPrerequisites({
  registrationId,
  authorityReceipts,
  repositoryRoot = process.cwd(),
  evaluatorNow = new Date(),
}: {
  registrationId: string;
  authorityReceipts: HarveySwateyesAuthorityReceipt[];
  repositoryRoot?: string;
  evaluatorNow?: string | Date;
}) {
  const registration = await readHarveyHeldPromptRegistration(registrationId, repositoryRoot);
  const policy = bindHarveySwateyesPromptPolicy(
    registration.permission_request_claim,
    authorityReceipts,
    promptEvidence(registration),
    new Set(),
    evaluatorNow
  );
  return {
    schema: "werkles.harvey-swateyes-durable-continuation-prerequisites/v1" as const,
    state: "BLOCKED" as const,
    blocker: policy.state === "POLICY_ELIGIBLE_NOT_EXECUTABLE"
      ? "TRUSTED_PROVIDER_CONTINUATION_ADAPTER_NOT_CONNECTED" as const
      : "EXACT_ACTIVE_AUTHORITY_NOT_PROVEN" as const,
    reason_codes: policy.state === "POLICY_ELIGIBLE_NOT_EXECUTABLE"
      ? ["DURABLE_REGISTRATION_LOADED", "POLICY_ELIGIBLE", "PROVIDER_ADAPTER_NOT_LOADED"]
      : policy.reason_codes,
    registration_id: registration.registration_id,
    task_bridge_eligible: false,
  };
}

const TASK_ID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:@-]{2,159}$/;
const HOSTNAMES = { Doss: "DOSS", Betsy: "BETSY", Spanzee: "SPANZEE", Medullina: "COURTNEY", Sally: "SALLY" } as const;
const BINDING_KEYS = ["binding_id", "host_id", "machine", "physical_hostname", "project_id", "provider", "schema", "seat_id", "state", "task_thread_id"].sort();
const TERMINAL_KEYS = ["continuation_id", "detail", "host_id", "observed_at", "prompt_id", "provider", "result", "schema", "task_thread_id"].sort();

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
}

function digest(value: unknown) {
  return createHash("sha256").update(typeof value === "string" ? value : canonical(value), "utf8").digest("hex");
}

function exactKeys(value: unknown, expected: string[]) {
  if (!value || Array.isArray(value) || typeof value !== "object") return false;
  return Object.keys(value).sort().join("|") === expected.join("|");
}

function validateBinding(binding: HarveySwateyesTaskBinding) {
  if (
    !exactKeys(binding, BINDING_KEYS)
    || binding.schema !== "werkles.harvey-swateyes-task-binding/v1"
    || !ID.test(binding.binding_id)
    || !["BOUND_PROVEN", "DISABLED", "REVOKED"].includes(binding.state)
    || !["Codex", "Cursor"].includes(binding.provider)
    || !ID.test(binding.host_id)
    || !TASK_ID.test(binding.task_thread_id)
    || !(binding.machine in HOSTNAMES)
    || binding.physical_hostname !== HOSTNAMES[binding.machine]
    || !ID.test(binding.project_id)
    || !ID.test(binding.seat_id)
  ) throw new Error("SWATEYES_TASK_BINDING_INVALID");
}

function validateRegistration(registration: HarveyHeldPromptRegistration) {
  const rebuilt = registerHarveyHeldPromptEvent(
    registration.source_event,
    registration.authenticated_provenance
  );
  if (canonical(rebuilt) !== canonical(registration)) {
    throw new Error("SWATEYES_HELD_PROMPT_REGISTRATION_INVALID");
  }
}

function assertExactRoute(registration: HarveyHeldPromptRegistration, binding: HarveySwateyesTaskBinding) {
  const event = registration.source_event;
  if (
    binding.state !== "BOUND_PROVEN"
    || binding.provider !== event.provider
    || binding.host_id !== event.host_id
    || binding.task_thread_id !== event.task_thread_id
    || binding.machine !== event.machine
    || binding.physical_hostname !== event.physical_hostname
    || binding.project_id !== event.project_id
  ) throw new Error("SWATEYES_EXACT_PROVIDER_TASK_BINDING_NOT_PROVEN");
}

function promptEvidence(registration: HarveyHeldPromptRegistration): HarveySwateyesPromptEvidence {
  const event = registration.source_event;
  return {
    schema: "werkles.harvey-swateyes-prompt-evidence/v1",
    prompt_id: event.prompt_id,
    observed_at: event.observed_at,
    platform: event.provider === "Codex" ? "CODEX_INTERNAL" : "CURSOR_INTERNAL",
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

function continuationFor(registration: HarveyHeldPromptRegistration, binding: HarveySwateyesTaskBinding): HarveySwateyesProviderContinuation {
  const event = registration.source_event;
  const continuationId = `swateyes-continuation.${digest(`${registration.registration_id}|${binding.binding_id}|${event.prompt_id}|${event.one_use_nonce}`)}`;
  return {
    schema: "werkles.harvey-swateyes-provider-continuation/v1",
    continuation_id: continuationId,
    binding_id: binding.binding_id,
    provider: binding.provider,
    host_id: binding.host_id,
    task_thread_id: binding.task_thread_id,
    prompt_id: event.prompt_id,
    action: event.action,
    body: [
      `SWATEYES CONTINUATION — ${event.prompt_id}`,
      `Continue only the already-authorized ${event.action} operation held by this exact provider prompt.`,
      `Exact task: ${binding.task_thread_id}`,
      `Scoped targets: ${event.target_paths.length ? event.target_paths.join(", ") : "NONE"}`,
      "Do not expand scope or cross any secret, sign-in, spend, push/merge, deploy/publish, production-mutation, destructive, or recurring-operation gate.",
      "Return a terminal RESUMED or BLOCKED receipt.",
    ].join("\n"),
  };
}

function terminalValid(terminal: HarveySwateyesProviderTerminal, continuation: HarveySwateyesProviderContinuation) {
  return exactKeys(terminal, TERMINAL_KEYS)
    && terminal.schema === "werkles.harvey-swateyes-provider-terminal/v1"
    && terminal.continuation_id === continuation.continuation_id
    && terminal.provider === continuation.provider
    && terminal.host_id === continuation.host_id
    && terminal.task_thread_id === continuation.task_thread_id
    && terminal.prompt_id === continuation.prompt_id
    && ["RESUMED", "BLOCKED"].includes(terminal.result)
    && Number.isFinite(Date.parse(terminal.observed_at))
    && typeof terminal.detail === "string"
    && terminal.detail.length > 0
    && Buffer.byteLength(terminal.detail, "utf8") <= 2048;
}

async function claimOneUse(registration: HarveyHeldPromptRegistration, binding: HarveySwateyesTaskBinding, repositoryRoot: string, consumedAt: string) {
  const base = path.join(repositoryRoot, "data", "harvey", "held-prompts", "continuations");
  const claims = path.join(base, "claims");
  const receipts = path.join(base, "receipts");
  const lock = path.join(base, "consume.lock");
  await mkdir(claims, { recursive: true });
  await mkdir(receipts, { recursive: true });
  try { await mkdir(lock); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new Error("SWATEYES_ONE_USE_CONSUMPTION_BUSY");
    throw error;
  }
  const consumptionId = digest(`${registration.registration_id}|${binding.binding_id}|${registration.source_event.prompt_id}|${registration.source_event.one_use_nonce}`);
  const keys = [
    `registration|${registration.registration_id}`,
    `prompt|${registration.source_event.provider}|${registration.source_event.host_id}|${registration.source_event.task_thread_id}|${registration.source_event.prompt_id}`,
    `nonce|${registration.authenticated_provenance.credential_id}|${registration.source_event.one_use_nonce}`,
  ];
  const created: string[] = [];
  try {
    for (const key of keys) {
      const claimPath = path.join(claims, `${digest(key)}.json`);
      try {
        await writeFile(claimPath, `${JSON.stringify({ consumption_id: consumptionId, consumed_at: consumedAt })}\n`, { encoding: "utf8", flag: "wx" });
        created.push(claimPath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        const prior = JSON.parse(await readFile(claimPath, "utf8")) as { consumption_id?: string };
        if (prior.consumption_id !== consumptionId) throw new Error("SWATEYES_ONE_USE_IDENTITY_CONFLICT");
        await Promise.all(created.map((createdPath) => rm(createdPath, { force: true })));
        return { state: "ALREADY_CONSUMED" as const, consumptionId, receipts };
      }
    }
    return { state: "CONSUMED" as const, consumptionId, receipts };
  } catch (error) {
    await Promise.all(created.map((createdPath) => rm(createdPath, { force: true })));
    throw error;
  } finally {
    await rm(lock, { recursive: true, force: true });
  }
}

function receiptValue({ registration, binding, result, reasons, consumed, attempted, terminal, consumedAt, terminalAt }: {
  registration: HarveyHeldPromptRegistration;
  binding: HarveySwateyesTaskBinding;
  result: "RESUMED" | "BLOCKED";
  reasons: string[];
  consumed: boolean;
  attempted: boolean;
  terminal: HarveySwateyesProviderTerminal | null;
  consumedAt: string | null;
  terminalAt: string;
}): HarveySwateyesContinuationReceipt {
  const unsigned = {
    registration_id: registration.registration_id,
    binding_id: binding.binding_id,
    prompt_id: registration.source_event.prompt_id,
    one_use_nonce_sha256: digest(registration.source_event.one_use_nonce),
    task_thread_id: binding.task_thread_id,
    machine: binding.machine,
    physical_hostname: binding.physical_hostname,
    project_id: binding.project_id,
    action: registration.source_event.action,
    result,
    reason_codes: reasons,
    one_use_consumed: consumed,
    send_attempted: attempted,
    send_count: attempted ? 1 as const : 0 as const,
    consumed_at: consumedAt,
    terminal_at: terminalAt,
    provider_terminal: terminal,
  };
  return { schema: "werkles.harvey-swateyes-continuation-receipt/v1", receipt_id: `swateyes-receipt.${digest(unsigned)}`, ...unsigned };
}

export async function continueHarveyHeldPrompt({ registration, binding, authorityReceipts, send, repositoryRoot = process.cwd(), evaluatorNow = new Date() }: {
  registration: HarveyHeldPromptRegistration;
  binding: HarveySwateyesTaskBinding;
  authorityReceipts: HarveySwateyesAuthorityReceipt[];
  send: (continuation: HarveySwateyesProviderContinuation) => Promise<HarveySwateyesProviderTerminal>;
  repositoryRoot?: string;
  evaluatorNow?: string | Date;
}) {
  validateRegistration(registration);
  validateBinding(binding);
  assertExactRoute(registration, binding);
  const policy = bindHarveySwateyesPromptPolicy(
    registration.permission_request_claim,
    authorityReceipts,
    promptEvidence(registration),
    new Set(),
    evaluatorNow
  );
  const terminalAt = evaluatorNow instanceof Date ? evaluatorNow.toISOString() : new Date(evaluatorNow).toISOString();
  if (policy.state !== "POLICY_ELIGIBLE_NOT_EXECUTABLE") {
    return receiptValue({ registration, binding, result: "BLOCKED", reasons: policy.reason_codes, consumed: false, attempted: false, terminal: null, consumedAt: null, terminalAt });
  }
  // A matching caller-supplied binding, registration, authority receipt, and
  // callback are not provider proof. Keep this seam inert until those objects
  // are loaded from authenticated durable stores and a native provider adapter
  // returns independently verifiable task/turn evidence.
  void send;
  void repositoryRoot;
  return receiptValue({
    registration,
    binding,
    result: "BLOCKED",
    reasons: ["TRUSTED_PROVIDER_CONTINUATION_ADAPTER_NOT_CONNECTED"],
    consumed: false,
    attempted: false,
    terminal: null,
    consumedAt: null,
    terminalAt,
  });
  /* c8 ignore start -- retained prepared state machine, unreachable until the trusted adapter lands
  const consumedAt = terminalAt;
  const claim = await claimOneUse(registration, binding, repositoryRoot, consumedAt);
  const receiptPath = path.join(claim.receipts, `${claim.consumptionId}.json`);
  if (claim.state === "ALREADY_CONSUMED") {
    try { return JSON.parse(await readFile(receiptPath, "utf8")) as HarveySwateyesContinuationReceipt; }
    catch {
      return receiptValue({ registration, binding, result: "BLOCKED", reasons: ["ONE_USE_ALREADY_CONSUMED_TERMINAL_RECEIPT_UNAVAILABLE"], consumed: true, attempted: false, terminal: null, consumedAt, terminalAt });
    }
  }
  const continuation = continuationFor(registration, binding);
  let terminal: HarveySwateyesProviderTerminal | null = null;
  let reasons: string[] = [];
  try {
    const candidate = await send(continuation);
    if (!terminalValid(candidate, continuation)) throw new Error("PROVIDER_TERMINAL_RECEIPT_INVALID");
    terminal = candidate;
    if (candidate.result === "BLOCKED") reasons = ["PROVIDER_RETURNED_BLOCKED"];
  } catch (error) {
    reasons = [error instanceof Error ? error.message : "PROVIDER_CONTINUATION_FAILED"];
  }
  const receipt = receiptValue({
    registration,
    binding,
    result: terminal?.result === "RESUMED" ? "RESUMED" : "BLOCKED",
    reasons,
    consumed: true,
    attempted: true,
    terminal,
    consumedAt,
    terminalAt: terminal?.observed_at ?? terminalAt,
  });
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  return receipt;
  c8 ignore stop */
}

export function projectLadyJessicaBetsyPrerequisites({ stations, bindings, registrations }: {
  stations: Array<{ station_id: string; hostname: string; state: string }>;
  bindings: HarveySwateyesTaskBinding[];
  registrations: HarveyHeldPromptRegistration[];
}) {
  const station = stations.find((candidate) => candidate.station_id === "betsy" && candidate.hostname === "BETSY" && candidate.state === "ACTIVE") ?? null;
  const binding = bindings.find((candidate) => candidate.seat_id === "Maker@Betsy" && candidate.machine === "Betsy" && candidate.physical_hostname === "BETSY" && candidate.state === "BOUND_PROVEN") ?? null;
  const registration = binding ? registrations.find((candidate) =>
    candidate.source_event.machine === "Betsy"
    && candidate.source_event.physical_hostname === "BETSY"
    && candidate.source_event.project_id === "werkles-site"
    && candidate.source_event.provider === binding.provider
    && candidate.source_event.host_id === binding.host_id
    && candidate.source_event.task_thread_id === binding.task_thread_id
  ) ?? null : null;
  const missing = [
    ...(!station ? ["BETSY_STATION"] : []),
    ...(!binding ? ["EXACT_EXISTING_LADY_JESSICA_TASK_BINDING"] : []),
    ...(!registration ? ["AUTHENTICATED_PROVIDER_HELD_PROMPT_EVENT"] : []),
  ];
  return {
    schema: "werkles.harvey-lady-jessica-betsy-swateyes-prerequisites/v1" as const,
    state: missing.length ? "MISSING_CLAIMS" as const : "CLAIMS_PRESENT_UNVERIFIED" as const,
    blocker: missing.length
      ? "EXACT_LADY_JESSICA_WERKLES_SITE_TASK_ROUTE_AND_HELD_ACTION_NOT_REGISTERED" as const
      : "TRUSTED_PROVIDER_CONTINUATION_ADAPTER_NOT_CONNECTED" as const,
    missing,
    betsy_station: station,
    exact_task_binding: binding,
    held_prompt_registration_id: registration?.registration_id ?? null,
  };
}
