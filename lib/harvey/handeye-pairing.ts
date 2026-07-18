import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import {
  EPHEMERAL_RSA_AUTH_MODE,
  type EphemeralRsaEnvelope,
  type EphemeralRsaPublicJwk,
  publicJwkSha256,
  requireRsa2048PublicJwk,
  verifyEphemeralRsaSignature
} from "@/lib/harvey/ephemeral-rsa";
import {
  HarveyControlError,
  type HarveyMachineActor,
  type HarveyOperatorActor
} from "@/lib/harvey/machine-control";

export const BETSY_PAIRING_TTL_MS = 15 * 60 * 1000;
export const BETSY_PAIRING_ID_PATTERN = /^betsy_pair_[a-f0-9]{32}$/;

const STATE_SCHEMA = "werkles.harvey-handeye-pairing/v1" as const;
const ENVELOPE_SCHEMA = "werkles.harvey-handeye-pairing-envelope/v1" as const;
const PAIRING_CODE_PATTERN = /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const PAGE_INSTANCE_PATTERN = /^[a-f0-9]{32}$/;
const MAX_OPEN_PAIRINGS = 8;
const MAX_NONCES_PER_PAIRING = 512;
const LOCK_ATTEMPTS = 500;
const LOCK_STALE_MS = 30_000;

export type BetsyPairingStatus =
  | "PENDING"
  | "OPERATOR_APPROVED"
  | "REDEEMED"
  | "PAGE_READY"
  | "ACTIVE"
  | "EXPIRED";

type BetsyPairingState = {
  schema: typeof STATE_SCHEMA;
  pairing_id: string;
  status: BetsyPairingStatus;
  machine: "Betsy";
  hostname: "BETSY";
  agent_id: "handeye-betsy-betsy";
  auth_mode: typeof EPHEMERAL_RSA_AUTH_MODE;
  credential_id: string;
  public_key_jwk: EphemeralRsaPublicJwk;
  public_key_sha256: string;
  pairing_code: string;
  created_at: string;
  expires_at: string;
  transitions: Array<{ status: BetsyPairingStatus; observed_at: string; receipt_id: string }>;
  approved_at?: string;
  approved_by?: string;
  redeemed_at?: string;
  page_capability_sha256?: string;
  page_ready_at?: string;
  page_instance_id?: string;
  time_origin?: number;
  navigation_count?: number;
  activated_at?: string;
  expired_at?: string;
};

export type PublicBetsyPairing = {
  pairing_id: string;
  status: BetsyPairingStatus;
  machine: "Betsy";
  hostname: "BETSY";
  agent_id: "handeye-betsy-betsy";
  auth_mode: typeof EPHEMERAL_RSA_AUTH_MODE;
  credential_id: string;
  public_key_sha256: string;
  created_at: string;
  expires_at: string;
  approved_at?: string;
  redeemed_at?: string;
  page_ready_at?: string;
  activated_at?: string;
  expired_at?: string;
};

const pairingRoot = () => path.join(process.cwd(), "data", "harvey", "machine-control", "handeye-pairings");
const stateDirectory = () => path.join(pairingRoot(), "states");
const nonceDirectory = (pairingId: string) => path.join(pairingRoot(), "nonces", pairingId);
const stateFile = (pairingId: string) => path.join(stateDirectory(), `${pairingId}.json`);

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function requirePairingId(value: unknown) {
  const pairingId = String(value ?? "").trim().toLowerCase();
  if (!BETSY_PAIRING_ID_PATTERN.test(pairingId)) throw new HarveyControlError("HANDEYE_PAIRING_ID_INVALID", 400);
  return pairingId;
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
  if (key.length < 16) throw new HarveyControlError("HANDEYE_PAIRING_STATE_SIGNING_KEY_UNAVAILABLE", 503);
  return key;
}

function stateHmac(state: BetsyPairingState) {
  return createHmac("sha256", stateSigningKey()).update(JSON.stringify(stableValue(state)), "utf8").digest("hex");
}

function hasExactKeys(value: unknown, allowed: string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value as Record<string, unknown>);
  const normalized = allowed.map((key) => key.endsWith("?") ? key.slice(0, -1) : key);
  return keys.every((key) => normalized.includes(key))
    && allowed.filter((key) => !key.endsWith("?")).every((key) => keys.includes(key));
}

function validTimestamp(value: unknown) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function validateState(value: unknown): value is BetsyPairingState {
  if (!hasExactKeys(value, [
    "schema", "pairing_id", "status", "machine", "hostname", "agent_id", "auth_mode", "credential_id",
    "public_key_jwk", "public_key_sha256", "pairing_code", "created_at", "expires_at", "transitions",
    "approved_at?", "approved_by?", "redeemed_at?", "page_capability_sha256?", "page_ready_at?",
    "page_instance_id?", "time_origin?", "navigation_count?", "activated_at?", "expired_at?"
  ])) return false;
  const state = value as BetsyPairingState;
  if (state.schema !== STATE_SCHEMA || !BETSY_PAIRING_ID_PATTERN.test(state.pairing_id) || state.credential_id !== state.pairing_id) return false;
  if (!(["PENDING", "OPERATOR_APPROVED", "REDEEMED", "PAGE_READY", "ACTIVE", "EXPIRED"] as string[]).includes(state.status)) return false;
  if (state.machine !== "Betsy" || state.hostname !== "BETSY" || state.agent_id !== "handeye-betsy-betsy" || state.auth_mode !== EPHEMERAL_RSA_AUTH_MODE) return false;
  let jwk: EphemeralRsaPublicJwk;
  try { jwk = requireRsa2048PublicJwk(state.public_key_jwk); } catch { return false; }
  if (!SHA256_PATTERN.test(state.public_key_sha256) || publicJwkSha256(jwk) !== state.public_key_sha256 || !PAIRING_CODE_PATTERN.test(state.pairing_code)) return false;
  if (!validTimestamp(state.created_at) || !validTimestamp(state.expires_at) || Date.parse(state.expires_at) - Date.parse(state.created_at) !== BETSY_PAIRING_TTL_MS) return false;
  if (!Array.isArray(state.transitions) || !state.transitions.length || state.transitions[0]?.status !== "PENDING") return false;
  if (state.transitions.some((entry) => !entry || !validTimestamp(entry.observed_at) || !/^betsy_pairing_receipt_[a-f0-9]{32}$/.test(entry.receipt_id))) return false;
  if (state.approved_at && !validTimestamp(state.approved_at)) return false;
  if (state.redeemed_at && !validTimestamp(state.redeemed_at)) return false;
  if (state.page_capability_sha256 && !SHA256_PATTERN.test(state.page_capability_sha256)) return false;
  if (state.page_ready_at && !validTimestamp(state.page_ready_at)) return false;
  if (state.page_instance_id && !PAGE_INSTANCE_PATTERN.test(state.page_instance_id)) return false;
  if (state.time_origin !== undefined && !Number.isFinite(state.time_origin)) return false;
  if (state.navigation_count !== undefined && state.navigation_count !== 1) return false;
  if (state.activated_at && !validTimestamp(state.activated_at)) return false;
  if (state.expired_at && !validTimestamp(state.expired_at)) return false;
  return true;
}

function lockOwnerIsAlive(pid: unknown) {
  if (!Number.isInteger(pid) || Number(pid) <= 0) return false;
  try { process.kill(Number(pid), 0); return true; }
  catch (error) { return (error as NodeJS.ErrnoException).code !== "ESRCH"; }
}

async function releaseOwnedLock(lockPath: string, ownerId: string) {
  try {
    const current = JSON.parse(await fs.readFile(lockPath, "utf8")) as { owner_id?: string };
    if (current.owner_id === ownerId) await fs.unlink(lockPath).catch(() => undefined);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

async function withFileLock<T>(target: string, operation: () => Promise<T>) {
  const lockPath = `${target}.lock`;
  const ownerId = randomUUID().replaceAll("-", "");
  await fs.mkdir(path.dirname(lockPath), { recursive: true });
  for (let attempt = 0; attempt < LOCK_ATTEMPTS; attempt += 1) {
    let handle;
    try {
      handle = await fs.open(lockPath, "wx");
      await handle.writeFile(`${JSON.stringify({ owner_id: ownerId, pid: process.pid, created_at: new Date().toISOString() })}\n`, "utf8");
      await handle.close();
      handle = undefined;
      try { return await operation(); }
      finally { await releaseOwnedLock(lockPath, ownerId); }
    } catch (error) {
      await handle?.close().catch(() => undefined);
      const code = (error as NodeJS.ErrnoException).code;
      if (!['EEXIST', 'EPERM', 'EACCES'].includes(code ?? "")) throw error;
      try {
        const observedText = await fs.readFile(lockPath, "utf8");
        let observed: { pid?: number } = {};
        try { observed = JSON.parse(observedText) as { pid?: number }; } catch {}
        const age = Date.now() - (await fs.stat(lockPath)).mtimeMs;
        if (age > LOCK_STALE_MS && !lockOwnerIsAlive(observed.pid) && await fs.readFile(lockPath, "utf8") === observedText) {
          await fs.unlink(lockPath).catch(() => undefined);
        }
      } catch (lockError) {
        if (!['ENOENT', 'EPERM', 'EACCES'].includes((lockError as NodeJS.ErrnoException).code ?? "")) throw lockError;
      }
      await wait(8 + (attempt % 7));
    }
  }
  throw new HarveyControlError("HANDEYE_PAIRING_LOCK_TIMEOUT", 503);
}

async function writeAtomic(file: string, value: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    for (let attempt = 0; ; attempt += 1) {
      try { await fs.rename(temporary, file); break; }
      catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (attempt >= 5 || !['EPERM', 'EACCES', 'EBUSY'].includes(code ?? "")) throw error;
        await wait(15 * (attempt + 1));
      }
    }
  } finally {
    await fs.unlink(temporary).catch(() => undefined);
  }
}

async function writeState(state: BetsyPairingState) {
  await writeAtomic(stateFile(state.pairing_id), { schema: ENVELOPE_SCHEMA, state, hmac_sha256: stateHmac(state) });
}

async function readState(pairingId: string) {
  let value: unknown;
  try { value = JSON.parse(await fs.readFile(stateFile(pairingId), "utf8")); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new HarveyControlError("HANDEYE_PAIRING_NOT_FOUND", 404);
    throw new HarveyControlError("HANDEYE_PAIRING_STATE_INVALID", 503);
  }
  if (!hasExactKeys(value, ["schema", "state", "hmac_sha256"])) throw new HarveyControlError("HANDEYE_PAIRING_STATE_INVALID", 503);
  const envelope = value as { schema?: unknown; state?: unknown; hmac_sha256?: unknown };
  if (envelope.schema !== ENVELOPE_SCHEMA || !validateState(envelope.state) || !SHA256_PATTERN.test(String(envelope.hmac_sha256 ?? ""))) {
    throw new HarveyControlError("HANDEYE_PAIRING_STATE_INVALID", 503);
  }
  const expected = Buffer.from(stateHmac(envelope.state), "hex");
  const actual = Buffer.from(String(envelope.hmac_sha256), "hex");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new HarveyControlError("HANDEYE_PAIRING_STATE_INVALID", 503);
  return envelope.state;
}

function addTransition(state: BetsyPairingState, status: BetsyPairingStatus, observedAt = new Date().toISOString()) {
  state.status = status;
  state.transitions.push({ status, observed_at: observedAt, receipt_id: `betsy_pairing_receipt_${randomUUID().replaceAll("-", "")}` });
}

async function expireIfNeeded(state: BetsyPairingState) {
  if (state.status !== "EXPIRED" && Date.parse(state.expires_at) <= Date.now()) {
    const now = new Date().toISOString();
    state.expired_at = now;
    addTransition(state, "EXPIRED", now);
    await writeState(state);
  }
  return state;
}

function assertNotExpired(state: BetsyPairingState) {
  if (state.status === "EXPIRED" || Date.parse(state.expires_at) <= Date.now()) throw new HarveyControlError("EPHEMERAL_CREDENTIAL_EXPIRED", 401);
}

function publicPairing(state: BetsyPairingState): PublicBetsyPairing {
  return {
    pairing_id: state.pairing_id,
    status: state.status,
    machine: state.machine,
    hostname: state.hostname,
    agent_id: state.agent_id,
    auth_mode: state.auth_mode,
    credential_id: state.credential_id,
    public_key_sha256: state.public_key_sha256,
    created_at: state.created_at,
    expires_at: state.expires_at,
    ...(state.approved_at ? { approved_at: state.approved_at } : {}),
    ...(state.redeemed_at ? { redeemed_at: state.redeemed_at } : {}),
    ...(state.page_ready_at ? { page_ready_at: state.page_ready_at } : {}),
    ...(state.activated_at ? { activated_at: state.activated_at } : {}),
    ...(state.expired_at ? { expired_at: state.expired_at } : {})
  };
}

function operatorPairing(state: BetsyPairingState) {
  return { ...publicPairing(state), pairing_code: state.pairing_code };
}

function pairingCode(pairingId: string, publicKeySha256: string) {
  const value = createHash("sha256").update(`${STATE_SCHEMA}\n${pairingId}\n${publicKeySha256}`, "utf8").digest("hex").slice(0, 12).toUpperCase();
  return `${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8, 12)}`;
}

async function allPairingIds() {
  await fs.mkdir(stateDirectory(), { recursive: true });
  return (await fs.readdir(stateDirectory()))
    .filter((name) => /^betsy_pair_[a-f0-9]{32}\.json$/.test(name))
    .map((name) => name.slice(0, -5))
    .sort();
}

export async function requestBetsyHandeyePairing(input: Record<string, unknown>) {
  const publicKeyJwk = requireRsa2048PublicJwk(input.public_key_jwk);
  const fingerprint = publicJwkSha256(publicKeyJwk);
  return withFileLock(path.join(pairingRoot(), ".create"), async () => {
    const states: BetsyPairingState[] = [];
    for (const id of await allPairingIds()) {
      const state = await withFileLock(stateFile(id), async () => expireIfNeeded(await readState(id)));
      states.push(state);
    }
    const existing = states.find((state) => state.public_key_sha256 === fingerprint && state.status !== "EXPIRED");
    if (existing) return { ...operatorPairing(existing) };
    if (states.filter((state) => state.status !== "EXPIRED").length >= MAX_OPEN_PAIRINGS) {
      throw new HarveyControlError("HANDEYE_PAIRING_CAPACITY_EXCEEDED", 429);
    }
    const now = new Date();
    const pairingId = `betsy_pair_${randomBytes(16).toString("hex")}`;
    const state: BetsyPairingState = {
      schema: STATE_SCHEMA,
      pairing_id: pairingId,
      status: "PENDING",
      machine: "Betsy",
      hostname: "BETSY",
      agent_id: "handeye-betsy-betsy",
      auth_mode: EPHEMERAL_RSA_AUTH_MODE,
      credential_id: pairingId,
      public_key_jwk: publicKeyJwk,
      public_key_sha256: fingerprint,
      pairing_code: pairingCode(pairingId, fingerprint),
      created_at: now.toISOString(),
      expires_at: new Date(now.getTime() + BETSY_PAIRING_TTL_MS).toISOString(),
      transitions: [{ status: "PENDING", observed_at: now.toISOString(), receipt_id: `betsy_pairing_receipt_${randomUUID().replaceAll("-", "")}` }]
    };
    await writeState(state);
    return operatorPairing(state);
  });
}

export async function readBetsyHandeyePairingStatus(input: Record<string, unknown>) {
  const pairingId = requirePairingId(input.pairing_id);
  return withFileLock(stateFile(pairingId), async () => publicPairing(await expireIfNeeded(await readState(pairingId))));
}

export async function readOperatorBetsyHandeyePairings(actor: HarveyOperatorActor) {
  if (actor.role !== "operator") throw new HarveyControlError("OPERATOR_AUTH_REQUIRED", 403);
  const pairings = [];
  for (const id of await allPairingIds()) {
    pairings.push(await withFileLock(stateFile(id), async () => operatorPairing(await expireIfNeeded(await readState(id)))));
  }
  return pairings.sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export async function approveBetsyHandeyePairing(input: Record<string, unknown>, actor: HarveyOperatorActor) {
  if (actor.role !== "operator") throw new HarveyControlError("OPERATOR_AUTH_REQUIRED", 403);
  const pairingId = requirePairingId(input.pairing_id);
  const pairingCode = String(input.pairing_code ?? "").trim().toUpperCase();
  return withFileLock(stateFile(pairingId), async () => {
    const state = await expireIfNeeded(await readState(pairingId));
    assertNotExpired(state);
    if (state.status !== "PENDING") throw new HarveyControlError("HANDEYE_PAIRING_APPROVAL_STATE_INVALID", 409);
    if (pairingCode !== state.pairing_code) throw new HarveyControlError("HANDEYE_PAIRING_CODE_MISMATCH", 403);
    const now = new Date().toISOString();
    state.approved_at = now;
    state.approved_by = actor.operator_id;
    addTransition(state, "OPERATOR_APPROVED", now);
    await writeState(state);
    return operatorPairing(state);
  });
}

async function consumeNonce(state: BetsyPairingState, envelope: EphemeralRsaEnvelope) {
  const directory = nonceDirectory(state.pairing_id);
  await fs.mkdir(directory, { recursive: true });
  const nonceFile = path.join(directory, `${envelope.nonce}.json`);
  let handle;
  try {
    handle = await fs.open(nonceFile, "wx");
    await handle.writeFile(`${JSON.stringify({ timestamp: envelope.timestamp, credential_id: state.credential_id })}\n`, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new HarveyControlError("REQUEST_REPLAYED", 409);
    throw error;
  } finally {
    await handle?.close();
  }
  const entries = (await fs.readdir(directory, { withFileTypes: true })).filter((entry) => entry.isFile() && entry.name.endsWith(".json"));
  const live = [];
  for (const entry of entries) {
    const file = path.join(directory, entry.name);
    try {
      const modified = (await fs.stat(file)).mtimeMs;
      if (modified < Date.parse(state.expires_at) - BETSY_PAIRING_TTL_MS) await fs.unlink(file).catch(() => undefined);
      else live.push(file);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  if (live.length > MAX_NONCES_PER_PAIRING) {
    await fs.unlink(nonceFile).catch(() => undefined);
    throw new HarveyControlError("EPHEMERAL_NONCE_CAPACITY_EXCEEDED", 503);
  }
}

function actorFromState(state: BetsyPairingState): HarveyMachineActor {
  return {
    role: "machine",
    machine: "Betsy",
    hostname: "BETSY",
    agent_id: "handeye-betsy-betsy",
    auth_mode: EPHEMERAL_RSA_AUTH_MODE,
    credential_id: state.credential_id,
    credential_expires_at: state.expires_at,
    capabilities: ["PING"]
  };
}

async function authenticateLocked(
  request: Request,
  rawBody: string,
  envelope: EphemeralRsaEnvelope,
  allowedStatuses: BetsyPairingStatus[]
) {
  const state = await expireIfNeeded(await readState(envelope.credentialId));
  assertNotExpired(state);
  if (!allowedStatuses.includes(state.status)) throw new HarveyControlError("EPHEMERAL_CREDENTIAL_NOT_ACTIVE", 403);
  verifyEphemeralRsaSignature(request, rawBody, envelope, state.public_key_jwk);
  await consumeNonce(state, envelope);
  return state;
}

export async function redeemBetsyHandeyePairing(
  input: Record<string, unknown>,
  request: Request,
  rawBody: string,
  envelope: EphemeralRsaEnvelope
) {
  const pairingId = requirePairingId(input.pairing_id);
  if (pairingId !== envelope.credentialId) throw new HarveyControlError("EPHEMERAL_CREDENTIAL_BODY_MISMATCH", 403);
  return withFileLock(stateFile(pairingId), async () => {
    const state = await authenticateLocked(request, rawBody, envelope, ["OPERATOR_APPROVED"]);
    const now = new Date().toISOString();
    const pageCapability = randomBytes(32).toString("hex");
    state.redeemed_at = now;
    state.page_capability_sha256 = createHash("sha256").update(pageCapability, "utf8").digest("hex");
    addTransition(state, "REDEEMED", now);
    await writeState(state);
    return { ...publicPairing(state), page_capability: pageCapability };
  });
}

export async function recordBetsyHandeyePageReady(input: Record<string, unknown>) {
  const pairingId = requirePairingId(input.pairing_id);
  const pageCapability = String(input.page_capability ?? "").trim().toLowerCase();
  const pageInstanceId = String(input.page_instance_id ?? "").trim().toLowerCase();
  const timeOrigin = Number(input.time_origin);
  const navigationCount = Number(input.navigation_count);
  if (!/^[a-f0-9]{64}$/.test(pageCapability)) throw new HarveyControlError("HANDEYE_PAGE_CAPABILITY_INVALID", 401);
  if (!PAGE_INSTANCE_PATTERN.test(pageInstanceId) || !Number.isFinite(timeOrigin) || navigationCount !== 1) {
    throw new HarveyControlError("HANDEYE_PAGE_READY_EVIDENCE_INVALID", 400);
  }
  return withFileLock(stateFile(pairingId), async () => {
    const state = await expireIfNeeded(await readState(pairingId));
    assertNotExpired(state);
    if (state.status !== "REDEEMED" || !state.page_capability_sha256) throw new HarveyControlError("HANDEYE_PAGE_READY_STATE_INVALID", 409);
    const actual = createHash("sha256").update(pageCapability, "utf8").digest();
    const expected = Buffer.from(state.page_capability_sha256, "hex");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new HarveyControlError("HANDEYE_PAGE_CAPABILITY_INVALID", 401);
    const now = new Date().toISOString();
    state.page_ready_at = now;
    state.page_instance_id = pageInstanceId;
    state.time_origin = timeOrigin;
    state.navigation_count = navigationCount;
    addTransition(state, "PAGE_READY", now);
    await writeState(state);
    state.activated_at = now;
    addTransition(state, "ACTIVE", now);
    await writeState(state);
    return publicPairing(state);
  });
}

export async function authenticateActiveBetsyEphemeralRequest(
  request: Request,
  rawBody: string,
  envelope: EphemeralRsaEnvelope
): Promise<HarveyMachineActor> {
  return withFileLock(stateFile(envelope.credentialId), async () => actorFromState(
    await authenticateLocked(request, rawBody, envelope, ["ACTIVE"])
  ));
}
