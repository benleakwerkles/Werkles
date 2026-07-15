import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { HarveyControlError, type HarveyMachineActor } from "@/lib/harvey/machine-control";

export const CREW_BRIDGE_PHASES = [
  "QUEUED",
  "SESSION_FOUND",
  "VISUALLY_CONFIRMED",
  "AWAITING_SEND_CONFIRMATION",
  "SENT",
  "ACKNOWLEDGED",
  "ARTIFACT_WRITTEN",
  "RECEIPTED"
] as const;

export type CrewBridgePhase = (typeof CREW_BRIDGE_PHASES)[number] | "BLOCKED";
export type CrewBridgeTransport = "COWORK_UI_FALLBACK";

type CrewBridgeCore = {
  transport: CrewBridgeTransport;
  workstream_id: string;
  target_aeye: string;
  source_repository: string;
  source_workspace_sha256: string;
  source_git_common_dir_sha256: string;
  source_worktree_sha256: string;
  source_branch: string;
  source_commit: string;
  flock_path: "Docs/MakerHandoff/FLOCK_LOG.jsonl";
  flock_offset: number;
  flock_record_sha256: string;
  bird_path: string;
  bird_sha256: string;
  notice_sha256: string;
};

type CrewBridgeProof = Record<string, string | number>;

export type CrewBridgeEvent = CrewBridgeCore & {
  delivery_id: string;
  event_id: string;
  sequence: number;
  phase: CrewBridgePhase;
  observed_at: string;
  proof: CrewBridgeProof;
};

type StoredCrewBridgeEvent = CrewBridgeEvent & {
  received_at: string;
  event_sha256: string;
  ledger_entry_sha256: string;
};

export type CrewBridgeDelivery = {
  schema: "werkles.harvey-crew-bridge-delivery/v1";
  delivery_id: string;
  machine: "Spanzee";
  hostname: "SPANZEE";
  agent_id: "handeye-spanzee-spanzee";
  phase: CrewBridgePhase;
  terminal: boolean;
  created_at: string;
  updated_at: string;
  core: CrewBridgeCore;
  events: StoredCrewBridgeEvent[];
};

const MAX_DELIVERIES = 512;
const MAX_EVENTS_PER_DELIVERY = 32;
const LOCK_STALE_MS = 30_000;
const LOCK_ATTEMPTS = 250;
const SHA256 = /^[a-f0-9]{64}$/;
const DELIVERY_ID = /^harvey_bridge_[a-f0-9]{32}$/;
const EVENT_ID = /^harvey_bridge_event_[a-f0-9]{32}$/;
const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const SAFE_BRANCH = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/;
const SAFE_REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const BIRD_PATH = /^Docs\/MakerHandoff\/BIRD_[A-Za-z0-9][A-Za-z0-9_.-]{0,159}\.md$/;
const EVENT_FIELDS = [
  "delivery_id", "event_id", "sequence", "phase", "transport", "workstream_id", "target_aeye",
  "source_repository", "source_workspace_sha256", "source_git_common_dir_sha256", "source_worktree_sha256",
  "source_branch", "source_commit", "flock_path", "flock_offset", "flock_record_sha256", "bird_path",
  "bird_sha256", "notice_sha256", "observed_at", "proof"
] as const;

const bridgeRoot = () => path.join(process.cwd(), "data", "harvey", "crew-bridge", "deliveries");
const deliveryFile = (deliveryId: string) => path.join(bridgeRoot(), `${deliveryId}.json`);
const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function stringValue(input: Record<string, unknown>, key: string, pattern?: RegExp) {
  const value = input[key];
  if (typeof value !== "string" || !value || (pattern && !pattern.test(value))) {
    throw new HarveyControlError(`BRIDGE_${key.toUpperCase()}_INVALID`);
  }
  return value;
}

function integerValue(input: Record<string, unknown>, key: string) {
  const value = input[key];
  if (!Number.isSafeInteger(value) || Number(value) < 0) throw new HarveyControlError(`BRIDGE_${key.toUpperCase()}_INVALID`);
  return Number(value);
}

function sha256Value(input: Record<string, unknown>, key: string) {
  return stringValue(input, key, SHA256);
}

function isoValue(input: Record<string, unknown>, key: string) {
  const value = stringValue(input, key);
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== value) {
    throw new HarveyControlError(`BRIDGE_${key.toUpperCase()}_INVALID`);
  }
  if (timestamp > Date.now() + 5 * 60_000) throw new HarveyControlError(`BRIDGE_${key.toUpperCase()}_IN_FUTURE`);
  return value;
}

function safeBranch(input: Record<string, unknown>) {
  const value = stringValue(input, "source_branch", SAFE_BRANCH);
  if (value.includes("..") || value.includes("//") || value.includes("@{") || value.endsWith("/")) {
    throw new HarveyControlError("BRIDGE_SOURCE_BRANCH_INVALID");
  }
  return value;
}

function safeBirdPath(value: unknown, error = "BRIDGE_BIRD_PATH_INVALID") {
  if (typeof value !== "string" || value.length > 220 || value.includes("\\") || value.includes("..") || !BIRD_PATH.test(value)) {
    throw new HarveyControlError(error);
  }
  return value;
}

function assertExactKeys(input: Record<string, unknown>, keys: readonly string[], error: string) {
  const actual = Object.keys(input).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new HarveyControlError(error);
  }
}

function exactProof(input: unknown, keys: string[]) {
  if (!input || Array.isArray(input) || typeof input !== "object") throw new HarveyControlError("BRIDGE_PROOF_INVALID");
  const proof = input as Record<string, unknown>;
  assertExactKeys(proof, keys, "BRIDGE_PROOF_FIELDS_INVALID");
  return proof;
}

function validateProof(phase: CrewBridgePhase, input: unknown, observedAt: string, atIntake: boolean): CrewBridgeProof {
  if (phase === "QUEUED") {
    const proof = exactProof(input, ["source"]);
    if (proof.source !== "FLOCK_LOG") throw new HarveyControlError("BRIDGE_PROOF_SOURCE_INVALID");
    return { source: "FLOCK_LOG" };
  }
  if (phase === "SESSION_FOUND") {
    const proof = exactProof(input, ["session_id_sha256", "audit_start_offset"]);
    return { session_id_sha256: sha256Value(proof, "session_id_sha256"), audit_start_offset: integerValue(proof, "audit_start_offset") };
  }
  if (phase === "VISUALLY_CONFIRMED") {
    const proof = exactProof(input, ["window_handle_sha256", "visual_snapshot_sha256"]);
    return { window_handle_sha256: sha256Value(proof, "window_handle_sha256"), visual_snapshot_sha256: sha256Value(proof, "visual_snapshot_sha256") };
  }
  if (phase === "AWAITING_SEND_CONFIRMATION") {
    const proof = exactProof(input, ["confirmation_id_sha256", "confirmation_expires_at"]);
    const expires = isoValue(proof, "confirmation_expires_at");
    if (Date.parse(expires) <= Date.parse(observedAt) || (atIntake && Date.parse(expires) <= Date.now())) {
      throw new HarveyControlError("BRIDGE_CONFIRMATION_EXPIRED");
    }
    return { confirmation_id_sha256: sha256Value(proof, "confirmation_id_sha256"), confirmation_expires_at: expires };
  }
  if (phase === "SENT") {
    const proof = exactProof(input, ["audit_message_sha256", "audit_message_offset"]);
    return { audit_message_sha256: sha256Value(proof, "audit_message_sha256"), audit_message_offset: integerValue(proof, "audit_message_offset") };
  }
  if (phase === "ACKNOWLEDGED") {
    const proof = exactProof(input, ["ack_sha256", "audit_ack_offset"]);
    return { ack_sha256: sha256Value(proof, "ack_sha256"), audit_ack_offset: integerValue(proof, "audit_ack_offset") };
  }
  if (phase === "ARTIFACT_WRITTEN") {
    const proof = exactProof(input, ["artifact_path", "artifact_sha256", "artifact_bytes"]);
    const bytes = integerValue(proof, "artifact_bytes");
    if (bytes < 1 || bytes > 1024 * 1024) throw new HarveyControlError("BRIDGE_ARTIFACT_BYTES_INVALID");
    return {
      artifact_path: safeBirdPath(proof.artifact_path, "BRIDGE_ARTIFACT_PATH_INVALID"),
      artifact_sha256: sha256Value(proof, "artifact_sha256"),
      artifact_bytes: bytes
    };
  }
  if (phase === "RECEIPTED") {
    const proof = exactProof(input, ["receipt_id", "receipt_sha256", "result"]);
    if (proof.result !== "COMPLETED") throw new HarveyControlError("BRIDGE_RECEIPT_RESULT_INVALID");
    return {
      receipt_id: stringValue(proof, "receipt_id", SAFE_NAME),
      receipt_sha256: sha256Value(proof, "receipt_sha256"),
      result: "COMPLETED"
    };
  }
  const proof = exactProof(input, ["blocker_code", "blocked_stage"]);
  const blockerCode = stringValue(proof, "blocker_code", /^[A-Z][A-Z0-9_]{2,79}$/);
  const blockedStage = stringValue(proof, "blocked_stage");
  if (![...CREW_BRIDGE_PHASES, "BLOCKED"].includes(blockedStage as CrewBridgePhase)) {
    throw new HarveyControlError("BRIDGE_BLOCKED_STAGE_INVALID");
  }
  return { blocker_code: blockerCode, blocked_stage: blockedStage };
}

function validateEvent(input: Record<string, unknown>, atIntake = true): CrewBridgeEvent {
  assertExactKeys(input, EVENT_FIELDS, "BRIDGE_EVENT_FIELDS_INVALID");
  const phase = stringValue(input, "phase") as CrewBridgePhase;
  if (![...CREW_BRIDGE_PHASES, "BLOCKED"].includes(phase)) throw new HarveyControlError("BRIDGE_PHASE_INVALID");
  const observedAt = isoValue(input, "observed_at");
  const transport = stringValue(input, "transport");
  if (transport !== "COWORK_UI_FALLBACK") throw new HarveyControlError("BRIDGE_TRANSPORT_INVALID");
  const flockPath = stringValue(input, "flock_path");
  if (flockPath !== "Docs/MakerHandoff/FLOCK_LOG.jsonl") throw new HarveyControlError("BRIDGE_FLOCK_PATH_INVALID");
  const sequence = integerValue(input, "sequence");
  if (sequence < 1) throw new HarveyControlError("BRIDGE_SEQUENCE_INVALID");
  const sourceRepository = stringValue(input, "source_repository", SAFE_REPOSITORY);
  if (sourceRepository !== "benleakwerkles/OddlyGodly2.0") throw new HarveyControlError("BRIDGE_SOURCE_REPOSITORY_INVALID");
  return {
    delivery_id: stringValue(input, "delivery_id", DELIVERY_ID),
    event_id: stringValue(input, "event_id", EVENT_ID),
    sequence,
    phase,
    transport,
    workstream_id: stringValue(input, "workstream_id", SAFE_NAME),
    target_aeye: stringValue(input, "target_aeye", SAFE_NAME),
    source_repository: sourceRepository,
    source_workspace_sha256: sha256Value(input, "source_workspace_sha256"),
    source_git_common_dir_sha256: sha256Value(input, "source_git_common_dir_sha256"),
    source_worktree_sha256: sha256Value(input, "source_worktree_sha256"),
    source_branch: safeBranch(input),
    source_commit: stringValue(input, "source_commit", /^[a-f0-9]{40}$/),
    flock_path: flockPath,
    flock_offset: integerValue(input, "flock_offset"),
    flock_record_sha256: sha256Value(input, "flock_record_sha256"),
    bird_path: safeBirdPath(input.bird_path),
    bird_sha256: sha256Value(input, "bird_sha256"),
    notice_sha256: sha256Value(input, "notice_sha256"),
    observed_at: observedAt,
    proof: validateProof(phase, input.proof, observedAt, atIntake)
  };
}

function coreFrom(event: CrewBridgeEvent): CrewBridgeCore {
  return {
    transport: event.transport,
    workstream_id: event.workstream_id,
    target_aeye: event.target_aeye,
    source_repository: event.source_repository,
    source_workspace_sha256: event.source_workspace_sha256,
    source_git_common_dir_sha256: event.source_git_common_dir_sha256,
    source_worktree_sha256: event.source_worktree_sha256,
    source_branch: event.source_branch,
    source_commit: event.source_commit,
    flock_path: event.flock_path,
    flock_offset: event.flock_offset,
    flock_record_sha256: event.flock_record_sha256,
    bird_path: event.bird_path,
    bird_sha256: event.bird_sha256,
    notice_sha256: event.notice_sha256
  };
}

function canonicalSha256(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");
}

function ledgerEntrySha256(eventSha256: string, receivedAt: string, previousLedgerEntrySha256?: string) {
  return canonicalSha256({ event_sha256: eventSha256, received_at: receivedAt, previous_ledger_entry_sha256: previousLedgerEntrySha256 ?? null });
}

function sameCore(left: CrewBridgeCore, right: CrewBridgeCore) {
  return canonicalSha256(left) === canonicalSha256(right);
}

function terminalPhase(phase: CrewBridgePhase) {
  return phase === "RECEIPTED" || phase === "BLOCKED";
}

function assertTransition(priorEvents: readonly CrewBridgeEvent[], event: CrewBridgeEvent, atIntake: boolean) {
  const current = priorEvents.at(-1);
  if (!current) {
    if (event.sequence !== 1 || event.phase !== "QUEUED") throw new HarveyControlError("BRIDGE_QUEUED_EVENT_REQUIRED", 409);
    return;
  }
  if (terminalPhase(current.phase)) throw new HarveyControlError("BRIDGE_DELIVERY_ALREADY_TERMINAL", 409);
  const expected = CREW_BRIDGE_PHASES[CREW_BRIDGE_PHASES.indexOf(current.phase as (typeof CREW_BRIDGE_PHASES)[number]) + 1];
  if (event.phase !== "BLOCKED" && event.phase !== expected) throw new HarveyControlError("BRIDGE_PHASE_TRANSITION_INVALID", 409);
  if (event.phase === "BLOCKED") {
    const blockedStage = String(event.proof.blocked_stage);
    if (![current.phase, expected].includes(blockedStage as (typeof CREW_BRIDGE_PHASES)[number])) {
      throw new HarveyControlError("BRIDGE_BLOCKED_STAGE_INVALID", 409);
    }
  }
  if (event.phase === "SENT") {
    const confirmation = priorEvents.find((item) => item.phase === "AWAITING_SEND_CONFIRMATION");
    const session = priorEvents.find((item) => item.phase === "SESSION_FOUND");
    const expiresAt = String(confirmation?.proof.confirmation_expires_at ?? "");
    if (!expiresAt || Date.parse(event.observed_at) > Date.parse(expiresAt) || (atIntake && Date.parse(expiresAt) <= Date.now())) {
      throw new HarveyControlError("BRIDGE_CONFIRMATION_EXPIRED", 409);
    }
    const messageOffset = Number(event.proof.audit_message_offset);
    const startOffset = Number(session?.proof.audit_start_offset);
    if (!Number.isSafeInteger(messageOffset) || !Number.isSafeInteger(startOffset) || messageOffset < startOffset) {
      throw new HarveyControlError("BRIDGE_AUDIT_OFFSET_INVALID", 409);
    }
  }
  if (event.phase === "ACKNOWLEDGED") {
    const sent = priorEvents.find((item) => item.phase === "SENT");
    const ackOffset = Number(event.proof.audit_ack_offset);
    const messageOffset = Number(sent?.proof.audit_message_offset);
    if (!Number.isSafeInteger(ackOffset) || !Number.isSafeInteger(messageOffset) || ackOffset <= messageOffset) {
      throw new HarveyControlError("BRIDGE_AUDIT_OFFSET_INVALID", 409);
    }
  }
}

async function ensureSafeRoot(create: boolean) {
  if (create) await fs.mkdir(bridgeRoot(), { recursive: true });
  const workspaceReal = await fs.realpath(process.cwd());
  const rootReal = await fs.realpath(bridgeRoot());
  if (!rootReal.toLowerCase().startsWith(`${workspaceReal.toLowerCase()}${path.sep}`)) {
    throw new HarveyControlError("BRIDGE_LEDGER_PATH_INVALID", 500);
  }
  return rootReal;
}

function lockOwnerIsAlive(pid: unknown) {
  if (!Number.isInteger(pid) || Number(pid) <= 0) return false;
  try { process.kill(Number(pid), 0); return true; }
  catch (error) { return (error as NodeJS.ErrnoException).code !== "ESRCH"; }
}

async function withLedgerLock<T>(operation: () => Promise<T>) {
  const root = await ensureSafeRoot(true);
  const lockPath = path.join(root, ".ledger.lock");
  const ownerId = randomUUID().replaceAll("-", "");
  for (let attempt = 0; attempt < LOCK_ATTEMPTS; attempt += 1) {
    let handle;
    try {
      handle = await fs.open(lockPath, "wx");
      await handle.writeFile(`${JSON.stringify({ owner_id: ownerId, pid: process.pid, created_at: new Date().toISOString() })}\n`, "utf8");
      await handle.close();
      handle = undefined;
      try { return await operation(); }
      finally {
        try {
          const record = JSON.parse(await fs.readFile(lockPath, "utf8")) as { owner_id?: string };
          if (record.owner_id === ownerId) await fs.unlink(lockPath).catch(() => undefined);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
      }
    } catch (error) {
      await handle?.close().catch(() => undefined);
      const code = (error as NodeJS.ErrnoException).code;
      if (!["EEXIST", "EPERM", "EACCES"].includes(code ?? "")) throw error;
      try {
        const observedText = await fs.readFile(lockPath, "utf8");
        let observed: { pid?: number } = {};
        try { observed = JSON.parse(observedText) as { pid?: number }; } catch {}
        const age = Date.now() - (await fs.stat(lockPath)).mtimeMs;
        if (age > LOCK_STALE_MS && !lockOwnerIsAlive(observed.pid)) {
          if (await fs.readFile(lockPath, "utf8") === observedText) await fs.unlink(lockPath).catch(() => undefined);
        }
      } catch (lockError) {
        if (!["ENOENT", "EPERM", "EACCES"].includes((lockError as NodeJS.ErrnoException).code ?? "")) throw lockError;
      }
      await wait(8 + (attempt % 7));
    }
  }
  throw new HarveyControlError("BRIDGE_LEDGER_LOCK_TIMEOUT", 503);
}

function storedIso(value: unknown) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)) || new Date(Date.parse(value)).toISOString() !== value) {
    throw new Error("INVALID_STORED_TIMESTAMP");
  }
  return value;
}

function sanitizeStoredDelivery(input: unknown): CrewBridgeDelivery {
  if (!input || Array.isArray(input) || typeof input !== "object") throw new Error("INVALID_STORED_DELIVERY");
  const raw = input as Record<string, unknown>;
  if (raw.schema !== "werkles.harvey-crew-bridge-delivery/v1") throw new Error("INVALID_STORED_SCHEMA");
  if (typeof raw.delivery_id !== "string" || !DELIVERY_ID.test(raw.delivery_id)) throw new Error("INVALID_STORED_DELIVERY_ID");
  if (!Array.isArray(raw.events) || raw.events.length < 1 || raw.events.length > MAX_EVENTS_PER_DELIVERY) throw new Error("INVALID_STORED_EVENTS");
  const seen = new Set<string>();
  const priorEvents: CrewBridgeEvent[] = [];
  let priorObservedAt = "";
  let priorReceivedAt = "";
  let priorLedgerEntrySha256: string | undefined;
  let core: CrewBridgeCore | undefined;
  const events = raw.events.map((item, index) => {
    if (!item || Array.isArray(item) || typeof item !== "object") throw new Error("INVALID_STORED_EVENT");
    const stored = item as Record<string, unknown>;
    assertExactKeys(stored, [...EVENT_FIELDS, "received_at", "event_sha256", "ledger_entry_sha256"], "BRIDGE_STORED_EVENT_FIELDS_INVALID");
    const eventInput = Object.fromEntries(EVENT_FIELDS.map((field) => [field, stored[field]])) as Record<string, unknown>;
    const validated = validateEvent(eventInput, false);
    if (validated.delivery_id !== raw.delivery_id || validated.sequence !== index + 1 || seen.has(validated.event_id)) {
      throw new Error("INVALID_STORED_EVENT_IDENTITY");
    }
    seen.add(validated.event_id);
    const eventSha256 = typeof stored.event_sha256 === "string" && SHA256.test(stored.event_sha256) ? stored.event_sha256 : "";
    if (canonicalSha256(validated) !== eventSha256) throw new Error("INVALID_STORED_EVENT_HASH");
    const receivedAt = storedIso(stored.received_at);
    const ledgerHash = typeof stored.ledger_entry_sha256 === "string" && SHA256.test(stored.ledger_entry_sha256) ? stored.ledger_entry_sha256 : "";
    if (ledgerEntrySha256(eventSha256, receivedAt, priorLedgerEntrySha256) !== ledgerHash) throw new Error("INVALID_STORED_LEDGER_HASH");
    if (priorReceivedAt && Date.parse(receivedAt) < Date.parse(priorReceivedAt)) throw new Error("INVALID_STORED_RECEIPT_TIME_ORDER");
    assertTransition(priorEvents, validated, false);
    if (priorObservedAt && Date.parse(validated.observed_at) < Date.parse(priorObservedAt)) throw new Error("INVALID_STORED_TIME_ORDER");
    const eventCore = coreFrom(validated);
    if (core && !sameCore(core, eventCore)) throw new Error("INVALID_STORED_CORE");
    core ??= eventCore;
    priorEvents.push(validated);
    priorObservedAt = validated.observed_at;
    priorReceivedAt = receivedAt;
    priorLedgerEntrySha256 = ledgerHash;
    return { ...validated, received_at: receivedAt, event_sha256: eventSha256, ledger_entry_sha256: ledgerHash };
  });
  const phase = events.at(-1)?.phase;
  if (!phase || !core) throw new Error("INVALID_STORED_DELIVERY");
  return {
    schema: "werkles.harvey-crew-bridge-delivery/v1",
    delivery_id: raw.delivery_id,
    machine: "Spanzee",
    hostname: "SPANZEE",
    agent_id: "handeye-spanzee-spanzee",
    phase,
    terminal: terminalPhase(phase),
    created_at: events[0].received_at,
    updated_at: events.at(-1)?.received_at ?? events[0].received_at,
    core,
    events
  };
}

async function readDelivery(file: string): Promise<CrewBridgeDelivery | null> {
  try {
    const rootReal = await ensureSafeRoot(false);
    const fileStat = await fs.lstat(file);
    if (!fileStat.isFile() || fileStat.isSymbolicLink()) throw new Error("INVALID_LEDGER_FILE_TYPE");
    const fileReal = await fs.realpath(file);
    if (!fileReal.toLowerCase().startsWith(`${rootReal.toLowerCase()}${path.sep}`)) throw new Error("INVALID_LEDGER_FILE_PATH");
    return sanitizeStoredDelivery(JSON.parse(await fs.readFile(fileReal, "utf8")));
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new HarveyControlError("BRIDGE_LEDGER_CORRUPT", 500);
  }
}

async function writeAtomic(file: string, value: unknown) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    for (let attempt = 0; ; attempt += 1) {
      try { await fs.rename(temporary, file); break; }
      catch (error) {
        if (attempt >= 5 || !["EPERM", "EACCES", "EBUSY"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
        await wait(15 * (attempt + 1));
      }
    }
  } finally {
    await fs.unlink(temporary).catch(() => undefined);
  }
}

async function deliveryCount() {
  const entries = await fs.readdir(bridgeRoot(), { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && DELIVERY_ID.test(entry.name.replace(/\.json$/, "")) && entry.name.endsWith(".json")).length;
}

async function assertGlobalEventIdAvailable(eventId: string, deliveryId: string) {
  const entries = await fs.readdir(bridgeRoot(), { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json") || !DELIVERY_ID.test(entry.name.slice(0, -5))) continue;
    if (entry.name === `${deliveryId}.json`) continue;
    const delivery = await readDelivery(path.join(bridgeRoot(), entry.name));
    if (delivery?.events.some((item) => item.event_id === eventId)) throw new HarveyControlError("BRIDGE_EVENT_ID_CONFLICT", 409);
  }
}

export async function recordCrewBridgeEvent(input: Record<string, unknown>, actor: HarveyMachineActor) {
  if (actor.machine !== "Spanzee" || actor.hostname !== "SPANZEE" || actor.agent_id !== "handeye-spanzee-spanzee") {
    throw new HarveyControlError("SPANZEE_BRIDGE_WRITER_REQUIRED", 403);
  }
  const event = validateEvent(input);
  const eventSha256 = canonicalSha256(event);
  const receivedAt = new Date().toISOString();
  return withLedgerLock(async () => {
    const file = deliveryFile(event.delivery_id);
    const existing = await readDelivery(file);
    if (existing) {
      const duplicate = existing.events.find((item) => item.event_id === event.event_id);
      if (duplicate) {
        if (duplicate.event_sha256 !== eventSha256) throw new HarveyControlError("BRIDGE_EVENT_ID_CONFLICT", 409);
        return { delivery: existing, idempotent: true };
      }
      await assertGlobalEventIdAvailable(event.event_id, event.delivery_id);
      if (existing.terminal) throw new HarveyControlError("BRIDGE_DELIVERY_ALREADY_TERMINAL", 409);
      if (!sameCore(existing.core, coreFrom(event))) throw new HarveyControlError("BRIDGE_DELIVERY_IDENTITY_MISMATCH", 409);
      if (event.sequence !== existing.events.length + 1) throw new HarveyControlError("BRIDGE_SEQUENCE_INVALID", 409);
      if (Date.parse(event.observed_at) < Date.parse(existing.events.at(-1)?.observed_at ?? existing.created_at)) {
        throw new HarveyControlError("BRIDGE_OBSERVED_AT_REGRESSION", 409);
      }
      assertTransition(existing.events, event, true);
      if (existing.events.length >= MAX_EVENTS_PER_DELIVERY) throw new HarveyControlError("BRIDGE_EVENT_CAPACITY_EXCEEDED", 503);
      const previousLedgerHash = existing.events.at(-1)?.ledger_entry_sha256;
      const delivery: CrewBridgeDelivery = {
        ...existing,
        phase: event.phase,
        terminal: terminalPhase(event.phase),
        updated_at: receivedAt,
        events: [...existing.events, {
          ...event,
          received_at: receivedAt,
          event_sha256: eventSha256,
          ledger_entry_sha256: ledgerEntrySha256(eventSha256, receivedAt, previousLedgerHash)
        }]
      };
      await writeAtomic(file, delivery);
      return { delivery, idempotent: false };
    }

    assertTransition([], event, true);
    await assertGlobalEventIdAvailable(event.event_id, event.delivery_id);
    if (await deliveryCount() >= MAX_DELIVERIES) throw new HarveyControlError("BRIDGE_DELIVERY_CAPACITY_EXCEEDED", 503);
    const delivery: CrewBridgeDelivery = {
      schema: "werkles.harvey-crew-bridge-delivery/v1",
      delivery_id: event.delivery_id,
      machine: "Spanzee",
      hostname: "SPANZEE",
      agent_id: "handeye-spanzee-spanzee",
      phase: event.phase,
      terminal: false,
      created_at: receivedAt,
      updated_at: receivedAt,
      core: coreFrom(event),
      events: [{
        ...event,
        received_at: receivedAt,
        event_sha256: eventSha256,
        ledger_entry_sha256: ledgerEntrySha256(eventSha256, receivedAt)
      }]
    };
    await writeAtomic(file, delivery);
    return { delivery, idempotent: false };
  });
}

export async function listCrewBridgeDeliveries() {
  let directoryEntries;
  try { directoryEntries = await fs.readdir(bridgeRoot(), { withFileTypes: true }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  await ensureSafeRoot(false);
  const entries = directoryEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && DELIVERY_ID.test(entry.name.slice(0, -5)))
    .slice(0, MAX_DELIVERIES);
  const deliveries = (await Promise.all(entries.map((entry) => readDelivery(path.join(bridgeRoot(), entry.name)))))
    .filter((entry): entry is CrewBridgeDelivery => entry !== null)
    .sort((left, right) => Date.parse(right.updated_at) - Date.parse(left.updated_at))
    .slice(0, 100);
  return deliveries;
}
