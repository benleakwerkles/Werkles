import { createHash, createHmac, createPublicKey, randomBytes, randomUUID, timingSafeEqual, verify } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import {
  createCommand,
  HarveyControlError,
  listCommands,
  type HarveyMachineActor,
  type HarveyOperatorActor
} from "./machine-control";
import { buildHarveySnapshot, readHarveySnapshot } from "./snapshot";

const CHALLENGE_TTL_MS = 15 * 60 * 1000;
const CHALLENGE_PATTERN = /^sally_[a-f0-9]{32}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const PAGE_ID_PATTERN = /^[a-f0-9]{32}$/;
const PAIRING_ID_PATTERN = /^sally_pair_[a-f0-9]{32}$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const PAIRING_MAX = 8;
const MAX_LOCK_ATTEMPTS = 500;
const LOCK_STALE_MS = 30_000;
const HISTORY_MAX = 256;
const HISTORY_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type SallyWitnessState = {
  schema: "werkles.harvey-sally-browser-witness/v1";
  challenge_id: string;
  status: "CHALLENGE_ISSUED" | "PAIRING_PENDING" | "PAIRING_APPROVED" | "HOST_READY" | "PING_QUEUED" | "COMPLETED" | "BLOCKER" | "EXPIRED";
  created_at: string;
  expires_at: string;
  sally_live_claimed: false;
  evidence_environment: "LIVE_CONTROL_PLANE" | "FIXTURE_ONLY" | "UNCLASSIFIED";
  sally_connectivity_before: string;
  sally_heartbeat_before: string;
  pairing_requests?: Array<{
    request_id: string;
    status: "PENDING" | "APPROVED" | "REDEEMED" | "REJECTED";
    requested_at: string;
    machine: "Sally";
    hostname: "SALLY";
    agent_id: "handeye-sally-sally";
    proof_kind: "EPHEMERAL_RSA_KEY_CLAIM";
    public_key_jwk: { kty: "RSA"; n: string; e: string };
    public_key_sha256: string;
    pairing_code: string;
    capability_sha256: string;
    approval?: { receipt_id: string; approved_at: string };
    redemption?: { receipt_id: string; redeemed_at: string };
  }>;
  host_ready?: {
    receipt_id: string;
    observed_at: string;
    machine: "Sally";
    hostname: "SALLY";
    agent_id: "handeye-sally-sally";
    proof_kind: "SIGNED_LOCAL_SHELL_HOSTNAME" | "OPERATOR_APPROVED_EPHEMERAL_PAIRING";
    pairing_request_id?: string;
    initial_revision: string;
    capability_sha256: string;
  };
  page_ready?: {
    receipt_id: string;
    observed_at: string;
    page_instance_id: string;
    time_origin: number;
    navigation_count: 1;
    session_sha256: string;
  };
  command?: {
    command_id: string;
    workstream_id: string;
  };
  browser_completed?: {
    receipt_id: string;
    observed_at: string;
    initial_revision: string;
    observed_revision: string;
    page_instance_id: string;
    time_origin: number;
    navigation_count: 1;
    command_id: string;
    command_claim_id: string;
    terminal_receipt_id: string;
    terminal_receipt_at: string;
    sally_connectivity_after: string;
    sally_heartbeat_after: string;
  };
  blocker?: { code: string; observed_at: string };
  expired_receipt?: { receipt_id: string; observed_at: string };
};

export type PublicSallyWitnessState = {
  schema: SallyWitnessState["schema"];
  challenge_id: string;
  status: SallyWitnessState["status"];
  created_at: string;
  expires_at: string;
  sally_live_claimed: false;
  evidence_environment: SallyWitnessState["evidence_environment"];
  sally_connectivity_before: string;
  pairing_status: "NONE" | "PENDING" | "APPROVED" | "REDEEMED";
  expired: boolean;
  host_ready?: Omit<NonNullable<SallyWitnessState["host_ready"]>, "capability_sha256">;
  page_ready?: Omit<NonNullable<SallyWitnessState["page_ready"]>, "session_sha256">;
  command?: SallyWitnessState["command"];
  browser_completed?: Omit<NonNullable<SallyWitnessState["browser_completed"]>, "sally_heartbeat_after">;
  blocker?: SallyWitnessState["blocker"];
  expired_receipt?: SallyWitnessState["expired_receipt"];
  command_status: string | null;
};

function root() {
  return path.join(process.cwd(), "data", "harvey", "machine-control", "sally-witness");
}

function stateFile() {
  return path.join(root(), "active.json");
}

function hash(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function decodeBase64Url(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

function requirePublicKeyJwk(value: unknown) {
  if (!hasExactKeys(value, ["kty", "n", "e"])) throw new HarveyControlError("SALLY_PAIRING_PUBLIC_KEY_INVALID", 400);
  const jwk = value as { kty?: unknown; n?: unknown; e?: unknown };
  const n = String(jwk.n ?? "");
  const e = String(jwk.e ?? "");
  if (jwk.kty !== "RSA" || !BASE64URL_PATTERN.test(n) || !BASE64URL_PATTERN.test(e)) throw new HarveyControlError("SALLY_PAIRING_PUBLIC_KEY_INVALID", 400);
  const modulus = decodeBase64Url(n);
  const exponent = decodeBase64Url(e);
  if (modulus.length !== 256 || exponent.length < 1 || exponent.length > 4) throw new HarveyControlError("SALLY_PAIRING_PUBLIC_KEY_INVALID", 400);
  try { createPublicKey({ key: { kty: "RSA", n, e }, format: "jwk" }); }
  catch { throw new HarveyControlError("SALLY_PAIRING_PUBLIC_KEY_INVALID", 400); }
  return { kty: "RSA" as const, n, e };
}

function publicKeyFingerprint(jwk: { kty: "RSA"; n: string; e: string }) {
  return hash(`RSA\n${jwk.n}\n${jwk.e}`);
}

function pairingTranscript(state: SallyWitnessState, request: NonNullable<SallyWitnessState["pairing_requests"]>[number], initialRevision: string) {
  return [state.challenge_id, request.request_id, initialRevision, request.capability_sha256, request.hostname, request.agent_id].join("\n");
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, unknown>>((result, key) => {
    const item = (value as Record<string, unknown>)[key];
    if (item !== undefined) result[key] = stableValue(item);
    return result;
  }, {});
}

function stateSigningKey() {
  const key = process.env.HARVEY_OPERATOR_TOKEN?.trim() ?? "";
  if (key.length < 16) throw new HarveyControlError("SALLY_WITNESS_STATE_SIGNING_KEY_UNAVAILABLE", 503);
  return key;
}

function stateSignature(state: SallyWitnessState) {
  return createHmac("sha256", stateSigningKey()).update(JSON.stringify(stableValue(state)), "utf8").digest("hex");
}

function hasExactKeys(value: unknown, allowed: string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value as Record<string, unknown>);
  const normalized = allowed.map((key) => key.endsWith("?") ? key.slice(0, -1) : key);
  return keys.every((key) => normalized.includes(key)) && allowed.filter((key) => !key.endsWith("?")).every((key) => keys.includes(key));
}

function validTimestamp(value: unknown) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function validateState(value: unknown): value is SallyWitnessState {
  if (!hasExactKeys(value, ["schema", "challenge_id", "status", "created_at", "expires_at", "sally_live_claimed", "evidence_environment", "sally_connectivity_before", "sally_heartbeat_before", "pairing_requests?", "host_ready?", "page_ready?", "command?", "browser_completed?", "blocker?", "expired_receipt?"])) return false;
  const state = value as SallyWitnessState;
  if (state.schema !== "werkles.harvey-sally-browser-witness/v1" || !CHALLENGE_PATTERN.test(state.challenge_id)) return false;
  if (!["CHALLENGE_ISSUED", "PAIRING_PENDING", "PAIRING_APPROVED", "HOST_READY", "PING_QUEUED", "COMPLETED", "BLOCKER", "EXPIRED"].includes(state.status)) return false;
  if (!validTimestamp(state.created_at) || !validTimestamp(state.expires_at) || state.sally_live_claimed !== false) return false;
  if (!["LIVE_CONTROL_PLANE", "FIXTURE_ONLY", "UNCLASSIFIED"].includes(state.evidence_environment) || typeof state.sally_connectivity_before !== "string" || typeof state.sally_heartbeat_before !== "string") return false;
  if (state.pairing_requests) {
    if (!Array.isArray(state.pairing_requests) || state.pairing_requests.length < 1 || state.pairing_requests.length > PAIRING_MAX) return false;
    const ids = new Set<string>();
    for (const request of state.pairing_requests) {
      if (!hasExactKeys(request, ["request_id", "status", "requested_at", "machine", "hostname", "agent_id", "proof_kind", "public_key_jwk", "public_key_sha256", "pairing_code", "capability_sha256", "approval?", "redemption?"])) return false;
      if (!PAIRING_ID_PATTERN.test(request.request_id) || ids.has(request.request_id) || !["PENDING", "APPROVED", "REDEEMED", "REJECTED"].includes(request.status) || !validTimestamp(request.requested_at)) return false;
      ids.add(request.request_id);
      if (request.machine !== "Sally" || request.hostname !== "SALLY" || request.agent_id !== "handeye-sally-sally" || request.proof_kind !== "EPHEMERAL_RSA_KEY_CLAIM") return false;
      let jwk: { kty: "RSA"; n: string; e: string };
      try { jwk = requirePublicKeyJwk(request.public_key_jwk); } catch { return false; }
      if (publicKeyFingerprint(jwk) !== request.public_key_sha256 || !SHA256_PATTERN.test(request.public_key_sha256) || !/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(request.pairing_code) || !SHA256_PATTERN.test(request.capability_sha256)) return false;
      if (request.approval && (!hasExactKeys(request.approval, ["receipt_id", "approved_at"]) || !validTimestamp(request.approval.approved_at))) return false;
      if (request.redemption && (!hasExactKeys(request.redemption, ["receipt_id", "redeemed_at"]) || !validTimestamp(request.redemption.redeemed_at))) return false;
      if (["APPROVED", "REDEEMED"].includes(request.status) && !request.approval) return false;
      if (request.status === "PENDING" && (request.approval || request.redemption)) return false;
      if ((request.status === "REDEEMED") !== Boolean(request.redemption)) return false;
    }
  }
  if (state.host_ready && (!hasExactKeys(state.host_ready, ["receipt_id", "observed_at", "machine", "hostname", "agent_id", "proof_kind", "pairing_request_id?", "initial_revision", "capability_sha256"]) || state.host_ready.machine !== "Sally" || state.host_ready.hostname !== "SALLY" || state.host_ready.agent_id !== "handeye-sally-sally" || !["SIGNED_LOCAL_SHELL_HOSTNAME", "OPERATOR_APPROVED_EPHEMERAL_PAIRING"].includes(state.host_ready.proof_kind) || !validTimestamp(state.host_ready.observed_at) || !SHA256_PATTERN.test(state.host_ready.initial_revision) || !SHA256_PATTERN.test(state.host_ready.capability_sha256))) return false;
  if (state.host_ready?.proof_kind === "SIGNED_LOCAL_SHELL_HOSTNAME" && state.host_ready.pairing_request_id) return false;
  if (state.host_ready?.proof_kind === "OPERATOR_APPROVED_EPHEMERAL_PAIRING" && !PAIRING_ID_PATTERN.test(state.host_ready.pairing_request_id ?? "")) return false;
  if (state.page_ready && (!hasExactKeys(state.page_ready, ["receipt_id", "observed_at", "page_instance_id", "time_origin", "navigation_count", "session_sha256"]) || !validTimestamp(state.page_ready.observed_at) || !PAGE_ID_PATTERN.test(state.page_ready.page_instance_id) || !Number.isFinite(state.page_ready.time_origin) || state.page_ready.navigation_count !== 1 || !SHA256_PATTERN.test(state.page_ready.session_sha256))) return false;
  if (state.command && (!hasExactKeys(state.command, ["command_id", "workstream_id"]) || !/^[A-Za-z0-9_-]+$/.test(state.command.command_id) || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(state.command.workstream_id))) return false;
  if (state.browser_completed && (!hasExactKeys(state.browser_completed, ["receipt_id", "observed_at", "initial_revision", "observed_revision", "page_instance_id", "time_origin", "navigation_count", "command_id", "command_claim_id", "terminal_receipt_id", "terminal_receipt_at", "sally_connectivity_after", "sally_heartbeat_after"]) || !validTimestamp(state.browser_completed.observed_at) || !validTimestamp(state.browser_completed.terminal_receipt_at) || !SHA256_PATTERN.test(state.browser_completed.initial_revision) || !SHA256_PATTERN.test(state.browser_completed.observed_revision) || !PAGE_ID_PATTERN.test(state.browser_completed.page_instance_id) || state.browser_completed.navigation_count !== 1)) return false;
  if (state.blocker && (!hasExactKeys(state.blocker, ["code", "observed_at"]) || typeof state.blocker.code !== "string" || !validTimestamp(state.blocker.observed_at))) return false;
  if (state.expired_receipt && (!hasExactKeys(state.expired_receipt, ["receipt_id", "observed_at"]) || !validTimestamp(state.expired_receipt.observed_at))) return false;
  return true;
}

async function writeAtomic(file: string, value: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(temporary, file);
}

async function writeSignedState(file: string, state: SallyWitnessState) {
  await writeAtomic(file, {
    schema: "werkles.harvey-sally-witness-state-envelope/v1",
    state,
    hmac_sha256: stateSignature(state)
  });
}

async function readState() {
  let value: unknown;
  try { value = JSON.parse(await fs.readFile(stateFile(), "utf8")); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new HarveyControlError("SALLY_WITNESS_STATE_INVALID", 503);
  }
  if (!hasExactKeys(value, ["schema", "state", "hmac_sha256"])) throw new HarveyControlError("SALLY_WITNESS_STATE_INVALID", 503);
  const envelope = value as { schema: unknown; state: unknown; hmac_sha256: unknown };
  if (envelope.schema !== "werkles.harvey-sally-witness-state-envelope/v1" || !validateState(envelope.state) || !SHA256_PATTERN.test(String(envelope.hmac_sha256))) throw new HarveyControlError("SALLY_WITNESS_STATE_INVALID", 503);
  const expected = Buffer.from(stateSignature(envelope.state), "hex");
  const observed = Buffer.from(String(envelope.hmac_sha256), "hex");
  if (expected.length !== observed.length || !timingSafeEqual(expected, observed)) throw new HarveyControlError("SALLY_WITNESS_STATE_INVALID", 503);
  return envelope.state;
}

function evidenceEnvironment(): SallyWitnessState["evidence_environment"] {
  const value = process.env.HARVEY_WITNESS_EVIDENCE_SCOPE?.trim();
  return value === "LIVE_CONTROL_PLANE" || value === "FIXTURE_ONLY" ? value : "UNCLASSIFIED";
}

async function archiveState(state: SallyWitnessState) {
  const historyRoot = path.join(root(), "history");
  await writeSignedState(path.join(historyRoot, `${state.challenge_id}.json`), state);
  const entries = await fs.readdir(historyRoot, { withFileTypes: true });
  const records = await Promise.all(entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map(async (entry) => ({
    file: path.join(historyRoot, entry.name),
    mtimeMs: (await fs.stat(path.join(historyRoot, entry.name))).mtimeMs
  })));
  records.sort((left, right) => right.mtimeMs - left.mtimeMs);
  const cutoff = Date.now() - HISTORY_TTL_MS;
  await Promise.all(records.filter((record, index) => index >= HISTORY_MAX || record.mtimeMs < cutoff).map((record) => fs.unlink(record.file).catch(() => undefined)));
}

async function quarantineInvalidActiveState() {
  const source = stateFile();
  const quarantineRoot = path.join(root(), "quarantine");
  await fs.mkdir(quarantineRoot, { recursive: true });
  const target = path.join(quarantineRoot, `active.${Date.now()}.${randomUUID().replaceAll("-", "")}.json`);
  try { await fs.rename(source, target); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const entries = await fs.readdir(quarantineRoot, { withFileTypes: true });
  const records = await Promise.all(entries.filter((entry) => entry.isFile()).map(async (entry) => ({ file: path.join(quarantineRoot, entry.name), mtimeMs: (await fs.stat(path.join(quarantineRoot, entry.name))).mtimeMs })));
  records.sort((left, right) => right.mtimeMs - left.mtimeMs);
  await Promise.all(records.slice(16).map((record) => fs.unlink(record.file).catch(() => undefined)));
}

async function readStateForOperatorIssue() {
  try { return await readState(); }
  catch (error) {
    if (!(error instanceof HarveyControlError) || error.message !== "SALLY_WITNESS_STATE_INVALID") throw error;
    await quarantineInvalidActiveState();
    return null;
  }
}

async function withLock<T>(operation: () => Promise<T>) {
  await fs.mkdir(root(), { recursive: true });
  const lockPath = path.join(root(), "active.lock");
  const ownerId = randomUUID().replaceAll("-", "");
  for (let attempt = 0; attempt < MAX_LOCK_ATTEMPTS; attempt += 1) {
    let handle;
    try {
      handle = await fs.open(lockPath, "wx");
      await handle.writeFile(`${JSON.stringify({ owner_id: ownerId, pid: process.pid, created_at: new Date().toISOString() })}\n`, "utf8");
      await handle.close();
      handle = undefined;
      try { return await operation(); }
      finally {
        try {
          const current = JSON.parse(await fs.readFile(lockPath, "utf8")) as { owner_id?: string };
          if (current.owner_id === ownerId) await fs.unlink(lockPath).catch(() => undefined);
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
        const lockAge = Date.now() - (await fs.stat(lockPath)).mtimeMs;
        let ownerAlive = false;
        if (Number.isInteger(observed.pid) && Number(observed.pid) > 0) {
          try { process.kill(Number(observed.pid), 0); ownerAlive = true; }
          catch (ownerError) { ownerAlive = (ownerError as NodeJS.ErrnoException).code !== "ESRCH"; }
        }
        if (lockAge > LOCK_STALE_MS && !ownerAlive) {
          const currentText = await fs.readFile(lockPath, "utf8");
          if (currentText === observedText) await fs.unlink(lockPath).catch(() => undefined);
        }
      } catch (lockError) {
        const lockCode = (lockError as NodeJS.ErrnoException).code;
        if (!["ENOENT", "EPERM", "EACCES"].includes(lockCode ?? "")) throw lockError;
      }
      await new Promise((resolve) => setTimeout(resolve, 10 + (attempt % 7)));
    }
  }
  throw new HarveyControlError("SALLY_WITNESS_LOCK_TIMEOUT", 503);
}

async function sallyHeartbeatFingerprint() {
  try { return hash(await fs.readFile(path.join(process.cwd(), "data", "harvey", "machine-control", "machines", "sally.json"))); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "ABSENT";
    throw error;
  }
}

function requireChallenge(value: unknown) {
  const challengeId = String(value ?? "");
  if (!CHALLENGE_PATTERN.test(challengeId)) throw new HarveyControlError("SALLY_WITNESS_CHALLENGE_INVALID", 400);
  return challengeId;
}

function requireActive(state: SallyWitnessState | null, challengeId: string) {
  if (!state || state.challenge_id !== challengeId) throw new HarveyControlError("SALLY_WITNESS_CHALLENGE_NOT_FOUND", 404);
  if (Date.parse(state.expires_at) <= Date.now()) throw new HarveyControlError("SALLY_WITNESS_CHALLENGE_EXPIRED", 410);
  if (state.status === "BLOCKER") throw new HarveyControlError(state.blocker?.code ?? "SALLY_WITNESS_BLOCKED", 409);
  return state;
}

export async function createSallyWitnessChallenge(actor: HarveyOperatorActor) {
  if (actor.role !== "operator") throw new HarveyControlError("OPERATOR_AUTH_REQUIRED", 403);
  return withLock(async () => {
    const existing = await readStateForOperatorIssue();
    if (existing && Date.parse(existing.expires_at) <= Date.now() && !["COMPLETED", "BLOCKER", "EXPIRED"].includes(existing.status)) {
      existing.status = "EXPIRED";
      existing.expired_receipt = { receipt_id: `sally_expired_${randomUUID().replaceAll("-", "")}`, observed_at: new Date().toISOString() };
      await writeSignedState(stateFile(), existing);
      await archiveState(existing);
    }
    if (existing && Date.parse(existing.expires_at) > Date.now() && !["COMPLETED", "BLOCKER", "EXPIRED"].includes(existing.status)) {
      return existing;
    }
    if (existing) await archiveState(existing);
    const snapshot = await readHarveySnapshot();
    const state: SallyWitnessState = {
      schema: "werkles.harvey-sally-browser-witness/v1",
      challenge_id: `sally_${randomBytes(16).toString("hex")}`,
      status: "CHALLENGE_ISSUED",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + CHALLENGE_TTL_MS).toISOString(),
      sally_live_claimed: false,
      evidence_environment: evidenceEnvironment(),
      sally_connectivity_before: snapshot.machines.find((machine) => machine.machine === "Sally")?.connectivity ?? "DISCONNECTED",
      sally_heartbeat_before: await sallyHeartbeatFingerprint()
    };
    await writeSignedState(stateFile(), state);
    return state;
  });
}

export async function reissueSallyWitnessChallenge(actor: HarveyOperatorActor) {
  if (actor.role !== "operator") throw new HarveyControlError("OPERATOR_AUTH_REQUIRED", 403);
  return withLock(async () => {
    const existing = await readStateForOperatorIssue();
    if (existing && Date.parse(existing.expires_at) <= Date.now() && !["COMPLETED", "BLOCKER", "EXPIRED"].includes(existing.status)) {
      existing.status = "EXPIRED";
      existing.expired_receipt = { receipt_id: `sally_expired_${randomUUID().replaceAll("-", "")}`, observed_at: new Date().toISOString() };
    } else if (existing && !["COMPLETED", "BLOCKER", "EXPIRED"].includes(existing.status)) {
      existing.status = "BLOCKER";
      existing.blocker = { code: "SALLY_WITNESS_REISSUED", observed_at: new Date().toISOString() };
    }
    if (existing) await archiveState(existing);
    const snapshot = await readHarveySnapshot();
    const state: SallyWitnessState = {
      schema: "werkles.harvey-sally-browser-witness/v1",
      challenge_id: `sally_${randomBytes(16).toString("hex")}`,
      status: "CHALLENGE_ISSUED",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + CHALLENGE_TTL_MS).toISOString(),
      sally_live_claimed: false,
      evidence_environment: evidenceEnvironment(),
      sally_connectivity_before: snapshot.machines.find((machine) => machine.machine === "Sally")?.connectivity ?? "DISCONNECTED",
      sally_heartbeat_before: await sallyHeartbeatFingerprint()
    };
    await writeSignedState(stateFile(), state);
    return state;
  });
}

function requirePairingRequestId(value: unknown) {
  const requestId = String(value ?? "");
  if (!PAIRING_ID_PATTERN.test(requestId)) throw new HarveyControlError("SALLY_PAIRING_REQUEST_ID_INVALID", 400);
  return requestId;
}

function projectPairingForClient(request: NonNullable<SallyWitnessState["pairing_requests"]>[number]) {
  return {
    request_id: request.request_id,
    status: request.status,
    pairing_code: request.pairing_code,
    public_key_sha256: request.public_key_sha256,
    requested_at: request.requested_at
  };
}

export async function requestSallyPairing(input: Record<string, unknown>) {
  const challengeId = requireChallenge(input.challenge_id);
  const machine = String(input.machine ?? "");
  const hostname = String(input.hostname ?? "");
  const agentId = String(input.agent_id ?? "");
  const initialRevision = String(input.initial_revision ?? "");
  const capabilitySha256 = String(input.capability_sha256 ?? "").toLowerCase();
  if (machine !== "Sally" || hostname !== "SALLY" || agentId !== "handeye-sally-sally") throw new HarveyControlError("WITNESS_MACHINE_BINDING_MISMATCH", 403);
  if (!SHA256_PATTERN.test(initialRevision) || !SHA256_PATTERN.test(capabilitySha256)) throw new HarveyControlError("SALLY_PAIRING_EVIDENCE_INVALID", 400);
  const publicKeyJwk = requirePublicKeyJwk(input.public_key_jwk);
  const publicKeySha256 = publicKeyFingerprint(publicKeyJwk);
  return withLock(async () => {
    const state = requireActive(await readState(), challengeId);
    if (!["CHALLENGE_ISSUED", "PAIRING_PENDING"].includes(state.status)) throw new HarveyControlError("SALLY_PAIRING_TRANSITION_INVALID", 409);
    const snapshot = await readHarveySnapshot();
    if (snapshot.revision !== initialRevision) throw new HarveyControlError("SALLY_WITNESS_INITIAL_REVISION_NOT_CURRENT", 409);
    const requests = state.pairing_requests ?? [];
    const duplicate = requests.find((request) => request.public_key_sha256 === publicKeySha256 && request.capability_sha256 === capabilitySha256);
    if (duplicate) return projectPairingForClient(duplicate);
    if (requests.length >= PAIRING_MAX) throw new HarveyControlError("SALLY_PAIRING_CAPACITY_REACHED", 429);
    const requestId = `sally_pair_${randomBytes(16).toString("hex")}`;
    const codeSource = hash(`werkles.harvey-sally-pairing/v1\n${state.challenge_id}\n${publicKeySha256}\n${capabilitySha256}`).toUpperCase();
    const request: NonNullable<SallyWitnessState["pairing_requests"]>[number] = {
      request_id: requestId,
      status: "PENDING",
      requested_at: new Date().toISOString(),
      machine: "Sally",
      hostname: "SALLY",
      agent_id: "handeye-sally-sally",
      proof_kind: "EPHEMERAL_RSA_KEY_CLAIM",
      public_key_jwk: publicKeyJwk,
      public_key_sha256: publicKeySha256,
      pairing_code: `${codeSource.slice(0, 4)}-${codeSource.slice(4, 8)}-${codeSource.slice(8, 12)}`,
      capability_sha256: capabilitySha256
    };
    state.pairing_requests = [...requests, request];
    state.status = "PAIRING_PENDING";
    await writeSignedState(stateFile(), state);
    return projectPairingForClient(request);
  });
}

export async function readSallyPairingStatus(input: Record<string, unknown>) {
  const challengeId = requireChallenge(input.challenge_id);
  const requestId = requirePairingRequestId(input.request_id);
  const state = requireActive(await readState(), challengeId);
  const request = state.pairing_requests?.find((candidate) => candidate.request_id === requestId);
  if (!request) throw new HarveyControlError("SALLY_PAIRING_REQUEST_NOT_FOUND", 404);
  return { request_id: request.request_id, status: request.status };
}

export async function readOperatorSallyPairings(actor: HarveyOperatorActor) {
  if (actor.role !== "operator") throw new HarveyControlError("OPERATOR_AUTH_REQUIRED", 403);
  const state = await readState();
  if (!state || Date.parse(state.expires_at) <= Date.now() || ["COMPLETED", "BLOCKER", "EXPIRED"].includes(state.status)) return [];
  return (state.pairing_requests ?? []).map(projectPairingForClient);
}

export async function approveSallyPairing(input: Record<string, unknown>, actor: HarveyOperatorActor) {
  if (actor.role !== "operator") throw new HarveyControlError("OPERATOR_AUTH_REQUIRED", 403);
  const challengeId = requireChallenge(input.challenge_id);
  const requestId = requirePairingRequestId(input.request_id);
  const pairingCode = String(input.pairing_code ?? "");
  if (!/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(pairingCode)) throw new HarveyControlError("SALLY_PAIRING_CODE_INVALID", 400);
  return withLock(async () => {
    const state = await readState();
    if (!state) throw new HarveyControlError("SALLY_WITNESS_CHALLENGE_NOT_FOUND", 404);
    requireActive(state, challengeId);
    const request = state.pairing_requests?.find((candidate) => candidate.request_id === requestId);
    if (!request) throw new HarveyControlError("SALLY_PAIRING_REQUEST_NOT_FOUND", 404);
    if (request.pairing_code !== pairingCode) throw new HarveyControlError("SALLY_PAIRING_CODE_MISMATCH", 409);
    if (request.status === "APPROVED" && request.approval) return state;
    if (request.status !== "PENDING" || !["CHALLENGE_ISSUED", "PAIRING_PENDING"].includes(state.status)) throw new HarveyControlError("SALLY_PAIRING_APPROVAL_INVALID", 409);
    const now = new Date().toISOString();
    request.status = "APPROVED";
    request.approval = { receipt_id: `sally_pair_approval_${randomUUID().replaceAll("-", "")}`, approved_at: now };
    for (const candidate of state.pairing_requests ?? []) {
      if (candidate.request_id !== requestId && candidate.status === "PENDING") candidate.status = "REJECTED";
    }
    state.status = "PAIRING_APPROVED";
    await writeSignedState(stateFile(), state);
    return state;
  });
}

export async function redeemSallyPairing(input: Record<string, unknown>) {
  const challengeId = requireChallenge(input.challenge_id);
  const requestId = requirePairingRequestId(input.request_id);
  const initialRevision = String(input.initial_revision ?? "");
  const capabilitySha256 = String(input.capability_sha256 ?? "").toLowerCase();
  const signature = String(input.signature ?? "");
  if (!SHA256_PATTERN.test(initialRevision) || !SHA256_PATTERN.test(capabilitySha256) || !BASE64URL_PATTERN.test(signature)) throw new HarveyControlError("SALLY_PAIRING_REDEMPTION_INVALID", 400);
  return withLock(async () => {
    const state = requireActive(await readState(), challengeId);
    const request = state.pairing_requests?.find((candidate) => candidate.request_id === requestId);
    if (!request) throw new HarveyControlError("SALLY_PAIRING_REQUEST_NOT_FOUND", 404);
    if (request.status === "REDEEMED") throw new HarveyControlError("SALLY_PAIRING_ALREADY_REDEEMED", 409);
    if (request.status !== "APPROVED" || !request.approval || state.status !== "PAIRING_APPROVED") throw new HarveyControlError("SALLY_PAIRING_NOT_APPROVED", 409);
    if (request.capability_sha256 !== capabilitySha256) throw new HarveyControlError("SALLY_PAIRING_CAPABILITY_MISMATCH", 403);
    const snapshot = await readHarveySnapshot();
    if (snapshot.revision !== initialRevision) throw new HarveyControlError("SALLY_WITNESS_INITIAL_REVISION_NOT_CURRENT", 409);
    const publicKey = createPublicKey({ key: request.public_key_jwk, format: "jwk" });
    const signatureBytes = decodeBase64Url(signature);
    if (signatureBytes.length !== 256 || !verify("RSA-SHA256", Buffer.from(pairingTranscript(state, request, initialRevision), "utf8"), publicKey, signatureBytes)) {
      throw new HarveyControlError("SALLY_PAIRING_SIGNATURE_INVALID", 403);
    }
    const now = new Date().toISOString();
    request.status = "REDEEMED";
    request.redemption = { receipt_id: `sally_pair_redemption_${randomUUID().replaceAll("-", "")}`, redeemed_at: now };
    state.host_ready = {
      receipt_id: `sally_host_${randomUUID().replaceAll("-", "")}`,
      observed_at: now,
      machine: "Sally",
      hostname: "SALLY",
      agent_id: "handeye-sally-sally",
      proof_kind: "OPERATOR_APPROVED_EPHEMERAL_PAIRING",
      pairing_request_id: request.request_id,
      initial_revision: initialRevision,
      capability_sha256: request.capability_sha256
    };
    state.status = "HOST_READY";
    await writeSignedState(stateFile(), state);
    return state;
  });
}

export async function recordSallyHostReady(input: Record<string, unknown>, actor: HarveyMachineActor) {
  if (actor.machine !== "Sally" || actor.hostname !== "SALLY" || actor.agent_id !== "handeye-sally-sally") {
    throw new HarveyControlError("WITNESS_MACHINE_BINDING_MISMATCH", 403);
  }
  const challengeId = requireChallenge(input.challenge_id);
  const initialRevision = String(input.initial_revision ?? "");
  const capabilitySha256 = String(input.capability_sha256 ?? "").toLowerCase();
  if (!SHA256_PATTERN.test(initialRevision) || !SHA256_PATTERN.test(capabilitySha256)) throw new HarveyControlError("SALLY_WITNESS_EVIDENCE_INVALID", 400);
  return withLock(async () => {
    const state = requireActive(await readState(), challengeId);
    if (state.host_ready) {
      if (state.host_ready.initial_revision !== initialRevision || state.host_ready.capability_sha256 !== capabilitySha256) {
        throw new HarveyControlError("SALLY_WITNESS_HOST_READY_CONFLICT", 409);
      }
      return state;
    }
    if (!["CHALLENGE_ISSUED", "PAIRING_PENDING", "PAIRING_APPROVED"].includes(state.status)) throw new HarveyControlError("SALLY_WITNESS_TRANSITION_INVALID", 409);
    const snapshot = await readHarveySnapshot();
    if (snapshot.revision !== initialRevision) throw new HarveyControlError("SALLY_WITNESS_INITIAL_REVISION_NOT_CURRENT", 409);
    state.host_ready = {
      receipt_id: `sally_host_${randomUUID().replaceAll("-", "")}`,
      observed_at: new Date().toISOString(),
      machine: "Sally",
      hostname: "SALLY",
      agent_id: "handeye-sally-sally",
      proof_kind: "SIGNED_LOCAL_SHELL_HOSTNAME",
      initial_revision: initialRevision,
      capability_sha256: capabilitySha256
    };
    for (const request of state.pairing_requests ?? []) {
      if (request.status === "PENDING" || request.status === "APPROVED") request.status = "REJECTED";
    }
    state.status = "HOST_READY";
    await writeSignedState(stateFile(), state);
    return state;
  });
}

export async function recordSallyPageReady(input: Record<string, unknown>, cookieSession?: string) {
  const challengeId = requireChallenge(input.challenge_id);
  const capability = String(input.capability ?? "").toLowerCase();
  const pageInstanceId = String(input.page_instance_id ?? "").toLowerCase();
  const timeOrigin = Number(input.time_origin);
  const navigationCount = Number(input.navigation_count);
  if (!SHA256_PATTERN.test(capability) || !PAGE_ID_PATTERN.test(pageInstanceId) || !Number.isFinite(timeOrigin) || navigationCount !== 1) {
    throw new HarveyControlError("SALLY_WITNESS_PAGE_EVIDENCE_INVALID", 400);
  }
  return withLock(async () => {
    const state = requireActive(await readState(), challengeId);
    if (!state.host_ready) throw new HarveyControlError("SALLY_WITNESS_HOST_READY_REQUIRED", 409);
    if (["COMPLETED", "BLOCKER", "EXPIRED"].includes(state.status)) throw new HarveyControlError("SALLY_WITNESS_ALREADY_TERMINAL", 409);
    if (hash(capability) !== state.host_ready.capability_sha256) throw new HarveyControlError("SALLY_WITNESS_CAPABILITY_INVALID", 403);
    if (state.page_ready && state.page_ready.page_instance_id !== pageInstanceId) throw new HarveyControlError("WITNESS_SESSION_ALREADY_BOUND", 409);
    if (state.page_ready) {
      if (state.page_ready.time_origin !== timeOrigin || state.page_ready.navigation_count !== navigationCount || !SHA256_PATTERN.test(cookieSession ?? "") || hash(cookieSession!) !== state.page_ready.session_sha256) {
        throw new HarveyControlError("WITNESS_SESSION_ALREADY_BOUND", 409);
      }
      return { state, sessionToken: null };
    }
    const sessionToken = randomBytes(32).toString("hex");
    if (!state.page_ready) {
      state.page_ready = {
        receipt_id: `sally_page_${randomUUID().replaceAll("-", "")}`,
        observed_at: new Date().toISOString(),
        page_instance_id: pageInstanceId,
        time_origin: timeOrigin,
        navigation_count: 1,
        session_sha256: hash(sessionToken)
      };
    }
    const workstreamId = `sally-witness-${challengeId.slice(-24)}`;
    if (!state.command) {
      const existing = (await listCommands("Doss")).find((command) => command.workstream_id === workstreamId);
      const command = existing ?? await createCommand({ machine: "Doss", action: "PING", workstream_id: workstreamId, payload: {} }, { role: "operator", operator_id: "sally-witness" });
      state.command = { command_id: command.command_id, workstream_id: workstreamId };
    }
    state.status = "PING_QUEUED";
    await writeSignedState(stateFile(), state);
    return { state, sessionToken };
  });
}

export async function recordSallyBrowserCompleted(input: Record<string, unknown>, cookieSession: string) {
  const challengeId = requireChallenge(input.challenge_id);
  const commandId = String(input.command_id ?? "");
  const initialRevision = String(input.initial_revision ?? "");
  const observedRevision = String(input.observed_revision ?? "");
  const pageInstanceId = String(input.page_instance_id ?? "").toLowerCase();
  const timeOrigin = Number(input.time_origin);
  const navigationCount = Number(input.navigation_count);
  if (!SHA256_PATTERN.test(initialRevision) || !SHA256_PATTERN.test(observedRevision) || initialRevision === observedRevision || !PAGE_ID_PATTERN.test(pageInstanceId) || !Number.isFinite(timeOrigin) || navigationCount !== 1) {
    throw new HarveyControlError("SALLY_WITNESS_BROWSER_EVIDENCE_INVALID", 400);
  }
  return withLock(async () => {
    const state = requireActive(await readState(), challengeId);
    if (!state.host_ready || !state.page_ready || !state.command) throw new HarveyControlError("SALLY_WITNESS_PAGE_READY_REQUIRED", 409);
    if (!SHA256_PATTERN.test(cookieSession) || hash(cookieSession) !== state.page_ready.session_sha256) throw new HarveyControlError("SALLY_WITNESS_SESSION_INVALID", 403);
    if (state.page_ready.page_instance_id !== pageInstanceId || state.page_ready.time_origin !== timeOrigin || state.page_ready.navigation_count !== navigationCount) {
      throw new HarveyControlError("SALLY_WITNESS_RELOAD_INVALIDATED", 409);
    }
    if (state.host_ready.initial_revision !== initialRevision || state.command.command_id !== commandId) throw new HarveyControlError("SALLY_WITNESS_COMMAND_BINDING_INVALID", 409);
    const command = (await listCommands("Doss")).find((candidate) => candidate.command_id === commandId);
    if (!command || command.action !== "PING" || command.workstream_id !== state.command.workstream_id || command.status !== "COMPLETED") {
      throw new HarveyControlError("SALLY_WITNESS_PING_NOT_TERMINAL", 409);
    }
    const commandProof = buildHarveySnapshot({ commands: [command] }).machines.find((machine) => machine.machine === "Doss")?.latest_command;
    if (!commandProof || commandProof.command_id !== commandId || commandProof.evidence_state !== "VALID") throw new HarveyControlError("SALLY_WITNESS_COMMAND_EVIDENCE_INVALID", 409);
    const heartbeatAfter = await sallyHeartbeatFingerprint();
    if (heartbeatAfter !== state.sally_heartbeat_before) {
      state.status = "BLOCKER";
      state.blocker = { code: "SALLY_HEARTBEAT_CHANGED_DURING_WITNESS", observed_at: new Date().toISOString() };
      await writeSignedState(stateFile(), state);
      await archiveState(state);
      throw new HarveyControlError(state.blocker.code, 409);
    }
    const terminal = command.receipts.at(-1)!;
    const snapshot = await readHarveySnapshot();
    if (snapshot.revision === initialRevision || snapshot.revision !== observedRevision) {
      throw new HarveyControlError("SALLY_WITNESS_REVISION_NOT_CURRENT", 409);
    }
    if (state.status === "COMPLETED" && state.browser_completed) {
      const recorded = state.browser_completed;
      if (recorded.initial_revision !== initialRevision || recorded.observed_revision !== observedRevision || recorded.page_instance_id !== pageInstanceId || recorded.time_origin !== timeOrigin || recorded.navigation_count !== navigationCount || recorded.command_id !== commandId || recorded.command_claim_id !== command.claim?.claim_id || recorded.terminal_receipt_id !== terminal.receipt_id) {
        throw new HarveyControlError("SALLY_WITNESS_COMPLETION_CONFLICT", 409);
      }
      return state;
    }
    state.browser_completed = {
      receipt_id: `sally_browser_${randomUUID().replaceAll("-", "")}`,
      observed_at: new Date().toISOString(),
      initial_revision: initialRevision,
      observed_revision: observedRevision,
      page_instance_id: pageInstanceId,
      time_origin: timeOrigin,
      navigation_count: 1,
      command_id: commandId,
      command_claim_id: command.claim!.claim_id,
      terminal_receipt_id: terminal.receipt_id,
      terminal_receipt_at: terminal.observed_at,
      sally_connectivity_after: snapshot.machines.find((machine) => machine.machine === "Sally")?.connectivity ?? "DISCONNECTED",
      sally_heartbeat_after: heartbeatAfter
    };
    state.status = "COMPLETED";
    await writeSignedState(stateFile(), state);
    await archiveState(state);
    return state;
  });
}

export async function readPublicSallyWitness(): Promise<PublicSallyWitnessState | null> {
  let state = await readState();
  if (!state) return null;
  let commandId = state.command?.command_id;
  let command = commandId ? (await listCommands("Doss")).find((candidate) => candidate.command_id === commandId) : null;
  const shouldExpire = Date.parse(state.expires_at) <= Date.now() && !["COMPLETED", "BLOCKER", "EXPIRED"].includes(state.status);
  const shouldBlock = command?.status === "BLOCKER" && !["COMPLETED", "BLOCKER", "EXPIRED"].includes(state.status);
  if (shouldExpire || shouldBlock) {
    state = await withLock(async () => {
      const current = await readState();
      if (!current) throw new HarveyControlError("SALLY_WITNESS_CHALLENGE_NOT_FOUND", 404);
      const currentCommand = current.command ? (await listCommands("Doss")).find((candidate) => candidate.command_id === current.command?.command_id) : null;
      if (Date.parse(current.expires_at) <= Date.now() && !["COMPLETED", "BLOCKER", "EXPIRED"].includes(current.status)) {
        current.status = "EXPIRED";
        current.expired_receipt = { receipt_id: `sally_expired_${randomUUID().replaceAll("-", "")}`, observed_at: new Date().toISOString() };
      } else if (currentCommand?.status === "BLOCKER" && !["COMPLETED", "BLOCKER", "EXPIRED"].includes(current.status)) {
        current.status = "BLOCKER";
        current.blocker = { code: "SALLY_WITNESS_DOSS_PING_BLOCKER", observed_at: new Date().toISOString() };
      }
      await writeSignedState(stateFile(), current);
      await archiveState(current);
      return current;
    });
    commandId = state.command?.command_id;
    command = commandId ? (await listCommands("Doss")).find((candidate) => candidate.command_id === commandId) : null;
  }
  const hostReady = state.host_ready;
  const pageReady = state.page_ready;
  const browserCompleted = state.browser_completed;
  const pairingStatus: PublicSallyWitnessState["pairing_status"] = state.pairing_requests?.some((request) => request.status === "REDEEMED")
    ? "REDEEMED"
    : state.pairing_requests?.some((request) => request.status === "APPROVED")
      ? "APPROVED"
      : state.pairing_requests?.some((request) => request.status === "PENDING")
        ? "PENDING"
        : "NONE";
  return {
    schema: state.schema,
    challenge_id: state.challenge_id,
    status: state.status,
    created_at: state.created_at,
    expires_at: state.expires_at,
    sally_live_claimed: false,
    evidence_environment: state.evidence_environment,
    sally_connectivity_before: state.sally_connectivity_before,
    pairing_status: pairingStatus,
    expired: state.status === "EXPIRED" || Date.parse(state.expires_at) <= Date.now(),
    ...(hostReady ? { host_ready: {
      receipt_id: hostReady.receipt_id,
      observed_at: hostReady.observed_at,
      machine: hostReady.machine,
      hostname: hostReady.hostname,
      agent_id: hostReady.agent_id,
      proof_kind: hostReady.proof_kind,
      ...(hostReady.pairing_request_id ? { pairing_request_id: hostReady.pairing_request_id } : {}),
      initial_revision: hostReady.initial_revision
    } } : {}),
    ...(pageReady ? { page_ready: {
      receipt_id: pageReady.receipt_id,
      observed_at: pageReady.observed_at,
      page_instance_id: pageReady.page_instance_id,
      time_origin: pageReady.time_origin,
      navigation_count: 1
    } } : {}),
    ...(state.command ? { command: { command_id: state.command.command_id, workstream_id: state.command.workstream_id } } : {}),
    ...(browserCompleted ? { browser_completed: {
      receipt_id: browserCompleted.receipt_id,
      observed_at: browserCompleted.observed_at,
      initial_revision: browserCompleted.initial_revision,
      observed_revision: browserCompleted.observed_revision,
      page_instance_id: browserCompleted.page_instance_id,
      time_origin: browserCompleted.time_origin,
      navigation_count: browserCompleted.navigation_count,
      command_id: browserCompleted.command_id,
      command_claim_id: browserCompleted.command_claim_id,
      terminal_receipt_id: browserCompleted.terminal_receipt_id,
      terminal_receipt_at: browserCompleted.terminal_receipt_at,
      sally_connectivity_after: browserCompleted.sally_connectivity_after
    } } : {}),
    ...(state.blocker ? { blocker: { code: state.blocker.code, observed_at: state.blocker.observed_at } } : {}),
    ...(state.expired_receipt ? { expired_receipt: { receipt_id: state.expired_receipt.receipt_id, observed_at: state.expired_receipt.observed_at } } : {}),
    command_status: command?.status ?? null
  };
}

export function parseWitnessCookie(value: string | undefined, challengeId: string) {
  const [cookieChallenge, capability, extra] = String(value ?? "").split(".");
  if (extra || cookieChallenge !== challengeId || !SHA256_PATTERN.test(capability ?? "")) throw new HarveyControlError("SALLY_WITNESS_SESSION_INVALID", 403);
  return capability;
}
