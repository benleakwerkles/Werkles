import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { HarveySwateyesPermissionRequest } from "./swateyes-authority";

export type HarveyHeldPromptEvent = {
  schema: "werkles.harvey-held-prompt-event/v1";
  event_id: string;
  event_type: "INTERNAL_PERMISSION_PROMPT_HELD";
  observed_at: string;
  provider: "Codex" | "Cursor";
  host_id: string;
  task_thread_id: string;
  prompt_id: string;
  one_use_nonce: string;
  machine: "Doss" | "Betsy" | "Spanzee" | "Medullina" | "Sally";
  physical_hostname: string;
  project_id: string;
  action: string;
  executable_sha256: string;
  arguments_sha256: string;
  cwd: string;
  target_paths: string[];
  requires_secret: boolean;
  requires_provider_sign_in: boolean;
  recurring_operation: boolean;
  paid_action: boolean;
  push_or_merge: boolean;
  deploy_or_publish: boolean;
  production_mutation: boolean;
  destructive_or_irreversible: boolean;
};

export type HarveyHeldPromptProvenance = {
  credential_id: string;
  received_at: string;
};

export type HarveyHeldPromptRegistration = {
  schema: "werkles.harvey-held-prompt-registration/v1";
  registration_id: string;
  event_sha256: string;
  source_event: HarveyHeldPromptEvent;
  authenticated_provenance: HarveyHeldPromptProvenance;
  provider_route_claim: {
    provider: "Codex" | "Cursor";
    host_id: string;
    task_thread_id: string;
    prompt_id: string;
    status: "CLAIMED_UNVERIFIED";
  };
  machine_proof: {
    machine: HarveyHeldPromptEvent["machine"];
    physical_hostname: string;
    credential_id: string;
    status: "MACHINE_AUTH_CLAIM_UNVERIFIED_AT_REST";
  };
  permission_request_claim: HarveySwateyesPermissionRequest;
  path_verification: "NOT_PERFORMED";
  state: "REGISTERED_UNVERIFIED_PENDING_PROVIDER_ATTESTATION";
  execution_authorized: false;
  message_sent: false;
};

export type HarveyHeldPromptIntakeProjection = {
  state: "NO_REGISTERED_PROMPT" | "REGISTERED_UNVERIFIED" | "EVIDENCE_UNAVAILABLE";
  blocker: null | "INTAKE_READ_FAILED";
  registration_count: number;
  total_record_count: number;
  scanned_record_count: number;
  truncated: boolean;
  invalid_record_count: number;
  latest_scanned: null | {
    registration_id: string;
    received_at: string;
    machine: HarveyHeldPromptEvent["machine"];
    physical_hostname: string;
    provider: "Codex" | "Cursor";
    task_thread_id: string;
    prompt_id: string;
    project_id: string;
    action: string;
    route_status: "CLAIMED_UNVERIFIED";
    machine_claim_status: "MACHINE_AUTH_CLAIM_UNVERIFIED_AT_REST";
    path_verification: "NOT_PERFORMED";
    execution_authorized: false;
    message_sent: false;
  };
};

const EVENT_KEYS = [
  "action", "arguments_sha256", "cwd", "deploy_or_publish",
  "destructive_or_irreversible", "event_id", "event_type", "executable_sha256",
  "host_id", "machine", "observed_at", "one_use_nonce", "paid_action",
  "physical_hostname", "production_mutation", "project_id", "prompt_id",
  "provider", "push_or_merge", "recurring_operation", "requires_provider_sign_in",
  "requires_secret", "schema", "target_paths", "task_thread_id"
].sort();
const HOSTNAMES: Record<HarveyHeldPromptEvent["machine"], string> = {
  Doss: "DOSS", Betsy: "BETSY", Spanzee: "SPANZEE", Medullina: "COURTNEY", Sally: "SALLY"
};
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,159}$/;
const TASK_ID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const NONCE = /^[a-f0-9]{32}$/;
const ACTION = /^[A-Z][A-Z0-9_]{2,127}$/;
const PROJECT = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,127}$/;
const HOST_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const RELATIVE_PATH = /^(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9_. -]+(?:\/[A-Za-z0-9_. -]+)*$/;
const WINDOWS_PATH = /^[A-Za-z]:\\[^<>:"|?*\u0000-\u001f]+$/;
const MAX_OBSERVATION_SKEW_MS = 90_000;
const MAX_PROJECTED_RECORDS = 200;
const MAX_RECORD_BYTES = 256 * 1024;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;
const BOOLEAN_KEYS = [
  "requires_secret", "requires_provider_sign_in", "recurring_operation", "paid_action",
  "push_or_merge", "deploy_or_publish", "production_mutation", "destructive_or_irreversible"
] as const;

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
}

function digest(value: unknown) {
  return createHash("sha256").update(canonical(value), "utf8").digest("hex");
}

function validate(event: HarveyHeldPromptEvent, provenance: HarveyHeldPromptProvenance) {
  if (!event || typeof event !== "object" || Array.isArray(event)) throw new Error("HELD_PROMPT_EVENT_INVALID");
  if (Object.keys(event).sort().join("|") !== EVENT_KEYS.join("|")) throw new Error("HELD_PROMPT_EVENT_KEYS_INVALID");
  const observed = Date.parse(event.observed_at);
  const received = Date.parse(provenance.received_at);
  if (
    event.schema !== "werkles.harvey-held-prompt-event/v1"
    || event.event_type !== "INTERNAL_PERMISSION_PROMPT_HELD"
    || !ID.test(event.event_id)
    || !ISO_INSTANT.test(event.observed_at)
    || !ISO_INSTANT.test(provenance.received_at)
    || !Number.isFinite(observed)
    || !Number.isFinite(received)
    || Math.abs(received - observed) > MAX_OBSERVATION_SKEW_MS
    || !["Codex", "Cursor"].includes(event.provider)
    || !HOST_ID.test(event.host_id)
    || !TASK_ID.test(event.task_thread_id)
    || !ID.test(event.prompt_id)
    || !NONCE.test(event.one_use_nonce)
    || !(event.machine in HOSTNAMES)
    || event.physical_hostname !== HOSTNAMES[event.machine]
    || !PROJECT.test(event.project_id)
    || !ACTION.test(event.action)
    || !SHA256.test(event.executable_sha256)
    || !SHA256.test(event.arguments_sha256)
    || !WINDOWS_PATH.test(event.cwd)
    || event.cwd.includes("..")
    || !Array.isArray(event.target_paths)
    || event.target_paths.length > 64
    || event.target_paths.some((target) => typeof target !== "string" || !RELATIVE_PATH.test(target))
    || new Set(event.target_paths).size !== event.target_paths.length
    || BOOLEAN_KEYS.some((key) => typeof event[key] !== "boolean")
    || !HOST_ID.test(provenance.credential_id)
  ) throw new Error("HELD_PROMPT_EVENT_INVALID");
}

export function registerHarveyHeldPromptEvent(
  event: HarveyHeldPromptEvent,
  provenance: HarveyHeldPromptProvenance
): HarveyHeldPromptRegistration {
  validate(event, provenance);
  const eventSha256 = digest(event);
  return {
    schema: "werkles.harvey-held-prompt-registration/v1",
    registration_id: `held-prompt.${eventSha256}`,
    event_sha256: eventSha256,
    source_event: structuredClone(event),
    authenticated_provenance: { ...provenance },
    provider_route_claim: {
      provider: event.provider,
      host_id: event.host_id,
      task_thread_id: event.task_thread_id,
      prompt_id: event.prompt_id,
      status: "CLAIMED_UNVERIFIED"
    },
    machine_proof: {
      machine: event.machine,
      physical_hostname: event.physical_hostname,
      credential_id: provenance.credential_id,
      status: "MACHINE_AUTH_CLAIM_UNVERIFIED_AT_REST"
    },
    permission_request_claim: {
      schema: "werkles.harvey-swateyes-permission-request/v1",
      request_id: `permission:${eventSha256}`,
      requested_at: event.observed_at,
      machine: event.machine,
      project_id: event.project_id,
      action: event.action,
      platform_permission_prompt: true,
      requires_secret: event.requires_secret,
      requires_provider_sign_in: event.requires_provider_sign_in,
      recurring_operation: event.recurring_operation,
      paid_action: event.paid_action,
      push_or_merge: event.push_or_merge,
      deploy_or_publish: event.deploy_or_publish,
      production_mutation: event.production_mutation,
      destructive_or_irreversible: event.destructive_or_irreversible
    },
    path_verification: "NOT_PERFORMED",
    state: "REGISTERED_UNVERIFIED_PENDING_PROVIDER_ATTESTATION",
    execution_authorized: false,
    message_sent: false
  };
}

async function claimIdentity(directory: string, key: string, registrationId: string) {
  const claimPath = path.join(directory, `${digest(key)}.json`);
  const serialized = `${JSON.stringify({ key_sha256: digest(key), registration_id: registrationId })}\n`;
  try {
    await writeFile(claimPath, serialized, { encoding: "utf8", flag: "wx" });
    return { path: claimPath, created: true };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const existing = JSON.parse(await readFile(claimPath, "utf8")) as { registration_id?: string };
    if (existing.registration_id !== registrationId) throw new Error("HELD_PROMPT_LOGICAL_IDENTITY_CONFLICT");
    return { path: claimPath, created: false };
  }
}

export async function persistHarveyHeldPromptRegistration(
  registration: HarveyHeldPromptRegistration,
  repositoryRoot = process.cwd()
) {
  const rebuilt = registerHarveyHeldPromptEvent(
    registration.source_event,
    registration.authenticated_provenance
  );
  if (canonical(rebuilt) !== canonical(registration)) throw new Error("HELD_PROMPT_REGISTRATION_INVALID");
  const directory = path.join(repositoryRoot, "data", "harvey", "held-prompts", "registrations");
  const claims = path.join(repositoryRoot, "data", "harvey", "held-prompts", "claims");
  const writeLock = path.join(repositoryRoot, "data", "harvey", "held-prompts", "registration-write.lock");
  const destination = path.join(directory, `${registration.event_sha256}.json`);
  const serialized = `${JSON.stringify(registration, null, 2)}\n`;
  await mkdir(directory, { recursive: true });
  await mkdir(claims, { recursive: true });
  try {
    await mkdir(writeLock);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error("HELD_PROMPT_REGISTRATION_BUSY");
    }
    throw error;
  }
  const identityKeys = [
    `event|${registration.machine_proof.credential_id}|${registration.source_event.event_id}`,
    `prompt|${registration.provider_route_claim.provider}|${registration.provider_route_claim.host_id}|${registration.provider_route_claim.task_thread_id}|${registration.provider_route_claim.prompt_id}`,
    `nonce|${registration.machine_proof.credential_id}|${registration.source_event.one_use_nonce}`
  ];
  const createdClaims: string[] = [];
  try {
    for (const key of identityKeys) {
      const claim = await claimIdentity(claims, key, registration.registration_id);
      if (claim.created) createdClaims.push(claim.path);
    }
    try {
      await writeFile(destination, serialized, { encoding: "utf8", flag: "wx" });
      return { state: "CREATED" as const, path: destination, registration };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const existingText = await readFile(destination, "utf8");
      const existing = JSON.parse(existingText) as HarveyHeldPromptRegistration;
      const rebuiltExisting = registerHarveyHeldPromptEvent(
        existing.source_event,
        existing.authenticated_provenance
      );
      if (
        canonical(existing) !== canonical(rebuiltExisting)
        || existing.event_sha256 !== registration.event_sha256
        || existing.machine_proof.credential_id !== registration.machine_proof.credential_id
      ) throw new Error("HELD_PROMPT_REGISTRATION_IDEMPOTENCY_CONFLICT");
      return { state: "ALREADY_REGISTERED" as const, path: destination, registration: existing };
    }
  } catch (error) {
    await Promise.all(createdClaims.map((claimPath) => rm(claimPath, { force: true })));
    throw error;
  } finally {
    await rm(writeLock, { recursive: true, force: true });
  }
}

export async function readHarveyHeldPromptRegistration(
  registrationId: string,
  repositoryRoot = process.cwd()
): Promise<HarveyHeldPromptRegistration> {
  const match = /^held-prompt\.([a-f0-9]{64})$/.exec(registrationId);
  if (!match) throw new Error("HELD_PROMPT_REGISTRATION_ID_INVALID");
  const base = path.join(repositoryRoot, "data", "harvey", "held-prompts");
  const writeLock = path.join(base, "registration-write.lock");
  const recordPath = path.join(base, "registrations", `${match[1]}.json`);
  try {
    await mkdir(writeLock);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error("HELD_PROMPT_INTAKE_BUSY");
    }
    throw error;
  }
  try {
    const metadata = await lstat(recordPath);
    if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size > MAX_RECORD_BYTES) {
      throw new Error("HELD_PROMPT_REGISTRATION_RECORD_INVALID");
    }
    const parsed = JSON.parse(await readFile(recordPath, "utf8")) as HarveyHeldPromptRegistration;
    const rebuilt = registerHarveyHeldPromptEvent(
      parsed.source_event,
      parsed.authenticated_provenance
    );
    if (
      canonical(parsed) !== canonical(rebuilt)
      || parsed.registration_id !== registrationId
      || parsed.event_sha256 !== match[1]
    ) throw new Error("HELD_PROMPT_REGISTRATION_RECORD_INVALID");
    return parsed;
  } finally {
    await rm(writeLock, { recursive: true, force: true });
  }
}

export async function readHarveyHeldPromptIntakeProjection(
  repositoryRoot = process.cwd()
): Promise<HarveyHeldPromptIntakeProjection> {
  const base = path.join(repositoryRoot, "data", "harvey", "held-prompts");
  const directory = path.join(base, "registrations");
  const writeLock = path.join(base, "registration-write.lock");
  try {
    await lstat(base);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { state: "NO_REGISTERED_PROMPT", blocker: null, registration_count: 0, total_record_count: 0, scanned_record_count: 0, truncated: false, invalid_record_count: 0, latest_scanned: null };
    }
    throw error;
  }
  try {
    await mkdir(writeLock);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new Error("HELD_PROMPT_INTAKE_BUSY");
    throw error;
  }
  let allNames: string[] = [];
  let names: string[] = [];
  const valid: HarveyHeldPromptRegistration[] = [];
  let invalidRecordCount = 0;
  try {
    try {
      allNames = (await readdir(directory))
        .filter((name) => /^[a-f0-9]{64}\.json$/.test(name))
        .sort();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    names = allNames.slice(-MAX_PROJECTED_RECORDS);
    for (const name of names) {
      try {
        const recordPath = path.join(directory, name);
        const metadata = await lstat(recordPath);
        if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size > MAX_RECORD_BYTES) throw new Error("invalid");
        const parsed = JSON.parse(await readFile(recordPath, "utf8")) as HarveyHeldPromptRegistration;
        const rebuilt = registerHarveyHeldPromptEvent(parsed.source_event, parsed.authenticated_provenance);
        if (canonical(parsed) !== canonical(rebuilt) || name !== `${parsed.event_sha256}.json`) throw new Error("invalid");
        valid.push(parsed);
      } catch {
        invalidRecordCount += 1;
      }
    }
  } finally {
    await rm(writeLock, { recursive: true, force: true });
  }
  valid.sort((left, right) =>
    Date.parse(right.authenticated_provenance.received_at) - Date.parse(left.authenticated_provenance.received_at)
    || right.registration_id.localeCompare(left.registration_id)
  );
  const latestScanned = valid[0];
  return {
    state: latestScanned ? "REGISTERED_UNVERIFIED" : "NO_REGISTERED_PROMPT",
    blocker: null,
    registration_count: valid.length,
    total_record_count: allNames.length,
    scanned_record_count: names.length,
    truncated: allNames.length > names.length,
    invalid_record_count: invalidRecordCount,
    latest_scanned: latestScanned ? {
      registration_id: latestScanned.registration_id,
      received_at: latestScanned.authenticated_provenance.received_at,
      machine: latestScanned.machine_proof.machine,
      physical_hostname: latestScanned.machine_proof.physical_hostname,
      provider: latestScanned.provider_route_claim.provider,
      task_thread_id: latestScanned.provider_route_claim.task_thread_id,
      prompt_id: latestScanned.provider_route_claim.prompt_id,
      project_id: latestScanned.source_event.project_id,
      action: latestScanned.source_event.action,
      route_status: latestScanned.provider_route_claim.status,
      machine_claim_status: latestScanned.machine_proof.status,
      path_verification: latestScanned.path_verification,
      execution_authorized: false,
      message_sent: false
    } : null
  };
}
