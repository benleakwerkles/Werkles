import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { HarveyControlError, type HarveyOperatorActor } from "@/lib/harvey/machine-control";

const MAX_PROJECTION_BYTES = 8 * 1024;
const MAX_RECEIPT_BYTES = 4 * 1024;
const CURRENT_MAX_AGE_MS = 15 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
const SHA256 = /^[a-f0-9]{64}$/;
const MAX_ACTION_RECEIPT_BYTES = 8 * 1024;
const ACTION_LOCK_ATTEMPTS = 300;
const ACTION_LOCK_STALE_MS = 30_000;

export const HARVEY_PASSWORD_ACTION_STATES = ["REPORTED", "OWNERSHIP_CLASSIFIED", "HUMAN_GATE_ACTIVE", "PROVIDER_SECURED", "VAULT_REPAIRED", "REUSE_REVIEWED", "CLOSED", "BLOCKED"] as const;
export const HARVEY_PASSWORD_OWNERSHIP = ["BEN_PRIVATE", "COURTNEY_PRIVATE", "INTENTIONAL_SHARED", "BUSINESS", "UNKNOWN"] as const;
export type HarveyPasswordActionState = (typeof HARVEY_PASSWORD_ACTION_STATES)[number];
export type HarveyPasswordOwnership = (typeof HARVEY_PASSWORD_OWNERSHIP)[number];

export type HarveyPasswordActionReceipt = {
  schema: "werkles.harvey-password-private-action-receipt/v1";
  state: HarveyPasswordActionState;
  ownership: HarveyPasswordOwnership;
  automation_status: "PREPARED_FOR_PRIVATE_HUMAN_ACTION";
  priority_hold: "ACTIVE" | "RELEASED";
  routine_cleanup: "PRESERVED" | "RESUME_ALLOWED";
  human_attestations: {
    provenance: "NONE" | "PRIVATE_HUMAN_OPERATOR";
    provider_secured: "PENDING" | "CONFIRMED";
    vault_repaired: "PENDING" | "CONFIRMED" | "NOT_APPLICABLE";
    reuse_reviewed: "PENDING" | "CONFIRMED" | "DEFERRED";
  };
  blocker_code: "NONE" | "OWNERSHIP_UNRESOLVED" | "PRIVATE_ACTION_INCOMPLETE" | "PRIVATE_GATE_BLOCKED";
  revision: number;
  updated_at: string;
};

export type HarveyPasswordIncidentProjection = {
  schema: "werkles.harvey-password-incident-projection/v1";
  generated_at: string;
  freshness: "CURRENT" | "STALE" | "UNKNOWN";
  source_status: "COMPLETE";
  automation_status: "READ_ONLY";
  workflow_state: "TRIAGE";
  gate: "PRIVATE_HUMAN_ACTION_REQUIRED";
  next_action_code: "REVIEW_PRIVATE_SOURCE";
  counts: {
    total: number;
    open: number;
    in_progress: number;
    blocked: number;
    resolved: number;
  };
};

type ProjectionReceipt = {
  schema: "werkles.harvey-password-incident-export-receipt/v1";
  generated_at: string;
  snapshot_sha256: string;
  ruleset_sha256: string;
  result: "COMPLETED";
  op_cli_used: false;
  onepassword_mutation_performed: false;
  provider_forms_touched: false;
};

function exactKeys(value: Record<string, unknown>, expected: string[], code: string) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new HarveyControlError(code, 503);
  }
}

function record(value: unknown, code: string) {
  if (!value || Array.isArray(value) || typeof value !== "object") throw new HarveyControlError(code, 503);
  return value as Record<string, unknown>;
}

function boundedCount(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 0 || Number(value) > 1_000_000) {
    throw new HarveyControlError("PASSWORD_INCIDENT_COUNT_INVALID", 503);
  }
  return Number(value);
}

function minuteTimestamp(value: unknown, code: string) {
  if (typeof value !== "string") throw new HarveyControlError(code, 503);
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).getUTCSeconds() !== 0 || new Date(parsed).getUTCMilliseconds() !== 0) {
    throw new HarveyControlError(code, 503);
  }
  return { value, parsed };
}

export function validateHarveyPasswordIncidentProjection(value: unknown, now = Date.now()): HarveyPasswordIncidentProjection {
  const projection = record(value, "PASSWORD_INCIDENT_PROJECTION_INVALID");
  exactKeys(projection, ["schema", "generated_at", "freshness", "source_status", "automation_status", "workflow_state", "gate", "next_action_code", "counts"], "PASSWORD_INCIDENT_PROJECTION_FIELDS_INVALID");
  if (projection.schema !== "werkles.harvey-password-incident-projection/v1") throw new HarveyControlError("PASSWORD_INCIDENT_PROJECTION_SCHEMA_INVALID", 503);
  const timestamp = minuteTimestamp(projection.generated_at, "PASSWORD_INCIDENT_PROJECTION_TIMESTAMP_INVALID");
  if (timestamp.parsed > now + MAX_FUTURE_SKEW_MS) throw new HarveyControlError("PASSWORD_INCIDENT_PROJECTION_FROM_FUTURE", 503);
  const counts = record(projection.counts, "PASSWORD_INCIDENT_COUNTS_INVALID");
  exactKeys(counts, ["total", "open", "in_progress", "blocked", "resolved"], "PASSWORD_INCIDENT_COUNT_FIELDS_INVALID");
  const normalizedCounts = {
    total: boundedCount(counts.total),
    open: boundedCount(counts.open),
    in_progress: boundedCount(counts.in_progress),
    blocked: boundedCount(counts.blocked),
    resolved: boundedCount(counts.resolved)
  };
  if (normalizedCounts.total !== normalizedCounts.open + normalizedCounts.in_progress + normalizedCounts.blocked + normalizedCounts.resolved) {
    throw new HarveyControlError("PASSWORD_INCIDENT_COUNT_INVARIANT_FAILED", 503);
  }
  if (
    projection.source_status !== "COMPLETE"
    || projection.automation_status !== "READ_ONLY"
    || projection.workflow_state !== "TRIAGE"
    || projection.gate !== "PRIVATE_HUMAN_ACTION_REQUIRED"
    || projection.next_action_code !== "REVIEW_PRIVATE_SOURCE"
    || normalizedCounts.total !== 1
    || normalizedCounts.open !== 1
    || normalizedCounts.in_progress !== 0
    || normalizedCounts.blocked !== 0
    || normalizedCounts.resolved !== 0
  ) throw new HarveyControlError("PASSWORD_INCIDENT_SEMANTIC_STATE_INVALID", 503);
  if (projection.freshness !== "CURRENT") throw new HarveyControlError("PASSWORD_INCIDENT_FRESHNESS_INVALID", 503);
  return {
    schema: "werkles.harvey-password-incident-projection/v1",
    generated_at: timestamp.value,
    freshness: now - timestamp.parsed <= CURRENT_MAX_AGE_MS ? "CURRENT" : "STALE",
    source_status: "COMPLETE",
    automation_status: "READ_ONLY",
    workflow_state: "TRIAGE",
    gate: "PRIVATE_HUMAN_ACTION_REQUIRED",
    next_action_code: "REVIEW_PRIVATE_SOURCE",
    counts: normalizedCounts
  };
}

function validateReceipt(value: unknown): ProjectionReceipt {
  const receipt = record(value, "PASSWORD_INCIDENT_RECEIPT_INVALID");
  exactKeys(receipt, ["schema", "generated_at", "snapshot_sha256", "ruleset_sha256", "result", "op_cli_used", "onepassword_mutation_performed", "provider_forms_touched"], "PASSWORD_INCIDENT_RECEIPT_FIELDS_INVALID");
  if (
    receipt.schema !== "werkles.harvey-password-incident-export-receipt/v1"
    || receipt.result !== "COMPLETED"
    || typeof receipt.snapshot_sha256 !== "string"
    || !SHA256.test(receipt.snapshot_sha256)
    || typeof receipt.ruleset_sha256 !== "string"
    || !SHA256.test(receipt.ruleset_sha256)
    || receipt.op_cli_used !== false
    || receipt.onepassword_mutation_performed !== false
    || receipt.provider_forms_touched !== false
  ) throw new HarveyControlError("PASSWORD_INCIDENT_RECEIPT_INVALID", 503);
  minuteTimestamp(receipt.generated_at, "PASSWORD_INCIDENT_RECEIPT_TIMESTAMP_INVALID");
  return receipt as ProjectionReceipt;
}

async function fixedImportFiles() {
  const localAppData = process.env.LOCALAPPDATA?.trim();
  if (!localAppData || !path.isAbsolute(localAppData)) throw new HarveyControlError("PASSWORD_INCIDENT_IMPORT_ROOT_UNAVAILABLE", 503);
  const configuredRoot = path.join(localAppData, "Werkles", "Harvey", "imports", "password-project");
  let rootReal: string;
  try { rootReal = await fs.realpath(configuredRoot); }
  catch { throw new HarveyControlError("PASSWORD_INCIDENT_IMPORT_UNAVAILABLE", 503); }
  const appDataReal = await fs.realpath(localAppData);
  if (!rootReal.toLowerCase().startsWith(`${appDataReal.toLowerCase()}${path.sep}`)) throw new HarveyControlError("PASSWORD_INCIDENT_IMPORT_ROOT_INVALID", 503);
  const projection = path.join(rootReal, "current.json");
  const receipt = path.join(rootReal, "current.receipt.json");
  for (const file of [projection, receipt]) {
    const stat = await fs.lstat(file).catch(() => null);
    if (!stat?.isFile() || stat.isSymbolicLink()) throw new HarveyControlError("PASSWORD_INCIDENT_IMPORT_FILE_INVALID", 503);
    const real = await fs.realpath(file);
    if (path.dirname(real).toLowerCase() !== rootReal.toLowerCase()) throw new HarveyControlError("PASSWORD_INCIDENT_IMPORT_PATH_INVALID", 503);
  }
  return { projection, receipt, rootReal };
}

async function boundedText(file: string, rootReal: string, maximum: number, code: string) {
  const handle = await fs.open(file, "r");
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.size < 2 || before.size > maximum) throw new HarveyControlError(code, 503);
    const text = await handle.readFile("utf8");
    const after = await handle.stat();
    const pathStat = await fs.lstat(file);
    const real = await fs.realpath(file);
    if (
      pathStat.isSymbolicLink()
      || !pathStat.isFile()
      || path.dirname(real).toLowerCase() !== rootReal.toLowerCase()
      || before.dev !== after.dev
      || before.ino !== after.ino
      || before.size !== after.size
      || before.mtimeMs !== after.mtimeMs
      || pathStat.size !== after.size
    ) throw new HarveyControlError("PASSWORD_INCIDENT_IMPORT_CHANGED_DURING_READ", 503);
    return text;
  } finally {
    await handle.close();
  }
}

export async function readHarveyPasswordIncidentProjection() {
  const files = await fixedImportFiles();
  const projectionText = (await boundedText(files.projection, files.rootReal, MAX_PROJECTION_BYTES, "PASSWORD_INCIDENT_PROJECTION_SIZE_INVALID")).trim();
  const receiptText = (await boundedText(files.receipt, files.rootReal, MAX_RECEIPT_BYTES, "PASSWORD_INCIDENT_RECEIPT_SIZE_INVALID")).trim();
  let projectionValue: unknown;
  let receiptValue: unknown;
  try {
    projectionValue = JSON.parse(projectionText);
    receiptValue = JSON.parse(receiptText);
  } catch {
    throw new HarveyControlError("PASSWORD_INCIDENT_IMPORT_JSON_INVALID", 503);
  }
  if (JSON.stringify(projectionValue) !== projectionText || JSON.stringify(receiptValue) !== receiptText) {
    throw new HarveyControlError("PASSWORD_INCIDENT_IMPORT_NOT_CANONICAL", 503);
  }
  const receipt = validateReceipt(receiptValue);
  const actualHash = createHash("sha256").update(projectionText, "utf8").digest("hex");
  if (actualHash !== receipt.snapshot_sha256) throw new HarveyControlError("PASSWORD_INCIDENT_IMPORT_HASH_MISMATCH", 503);
  const projection = validateHarveyPasswordIncidentProjection(projectionValue);
  if (receipt.generated_at !== projection.generated_at) throw new HarveyControlError("PASSWORD_INCIDENT_RECEIPT_TIMESTAMP_MISMATCH", 503);
  const rulesetPath = path.join(process.cwd(), "scripts", "foreman", "Export-HarveyPasswordIncidentProjection.ps1");
  const rulesetReal = await fs.realpath(rulesetPath).catch(() => "");
  const repoReal = await fs.realpath(process.cwd());
  if (!rulesetReal || !rulesetReal.toLowerCase().startsWith(`${repoReal.toLowerCase()}${path.sep}`)) throw new HarveyControlError("PASSWORD_INCIDENT_RULESET_UNAVAILABLE", 503);
  const rulesetStat = await fs.lstat(rulesetReal);
  if (!rulesetStat.isFile() || rulesetStat.isSymbolicLink() || rulesetStat.size < 2 || rulesetStat.size > 1024 * 1024) throw new HarveyControlError("PASSWORD_INCIDENT_RULESET_INVALID", 503);
  const rulesetHash = createHash("sha256").update(await fs.readFile(rulesetReal)).digest("hex");
  if (receipt.ruleset_sha256 !== rulesetHash) throw new HarveyControlError("PASSWORD_INCIDENT_RULESET_HASH_MISMATCH", 503);
  return projection;
}

function actionInputKeys(value: Record<string, unknown>, expected: string[]) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new HarveyControlError("PASSWORD_ACTION_INPUT_FIELDS_INVALID", 400);
  }
}

function validTimestamp(value: unknown) {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

export function validateHarveyPasswordActionReceipt(value: unknown): HarveyPasswordActionReceipt {
  const receipt = record(value, "PASSWORD_ACTION_RECEIPT_INVALID");
  exactKeys(receipt, ["schema", "state", "ownership", "automation_status", "priority_hold", "routine_cleanup", "human_attestations", "blocker_code", "revision", "updated_at"], "PASSWORD_ACTION_RECEIPT_FIELDS_INVALID");
  const attestations = record(receipt.human_attestations, "PASSWORD_ACTION_ATTESTATIONS_INVALID");
  exactKeys(attestations, ["provenance", "provider_secured", "vault_repaired", "reuse_reviewed"], "PASSWORD_ACTION_ATTESTATION_FIELDS_INVALID");
  const state = String(receipt.state) as HarveyPasswordActionState;
  const ownership = String(receipt.ownership) as HarveyPasswordOwnership;
  if (
    receipt.schema !== "werkles.harvey-password-private-action-receipt/v1"
    || !HARVEY_PASSWORD_ACTION_STATES.includes(state)
    || !HARVEY_PASSWORD_OWNERSHIP.includes(ownership)
    || receipt.automation_status !== "PREPARED_FOR_PRIVATE_HUMAN_ACTION"
    || !["ACTIVE", "RELEASED"].includes(String(receipt.priority_hold))
    || !["PRESERVED", "RESUME_ALLOWED"].includes(String(receipt.routine_cleanup))
    || !["NONE", "PRIVATE_HUMAN_OPERATOR"].includes(String(attestations.provenance))
    || !["PENDING", "CONFIRMED"].includes(String(attestations.provider_secured))
    || !["PENDING", "CONFIRMED", "NOT_APPLICABLE"].includes(String(attestations.vault_repaired))
    || !["PENDING", "CONFIRMED", "DEFERRED"].includes(String(attestations.reuse_reviewed))
    || !["NONE", "OWNERSHIP_UNRESOLVED", "PRIVATE_ACTION_INCOMPLETE", "PRIVATE_GATE_BLOCKED"].includes(String(receipt.blocker_code))
    || !Number.isSafeInteger(receipt.revision)
    || Number(receipt.revision) < 1
    || Number(receipt.revision) > 1_000_000
    || !validTimestamp(receipt.updated_at)
  ) throw new HarveyControlError("PASSWORD_ACTION_RECEIPT_INVALID", 503);

  const providerSecured = String(attestations.provider_secured);
  const vaultRepaired = String(attestations.vault_repaired);
  const reuseReviewed = String(attestations.reuse_reviewed);
  const humanState = state !== "REPORTED";
  const closed = state === "CLOSED";
  const blocked = state === "BLOCKED";
  if (
    (state === "REPORTED" && (ownership !== "UNKNOWN" || attestations.provenance !== "NONE"))
    || (humanState && attestations.provenance !== "PRIVATE_HUMAN_OPERATOR")
    || (["HUMAN_GATE_ACTIVE", "PROVIDER_SECURED", "VAULT_REPAIRED", "REUSE_REVIEWED", "CLOSED"].includes(state) && ownership === "UNKNOWN")
    || (["REPORTED", "OWNERSHIP_CLASSIFIED", "HUMAN_GATE_ACTIVE"].includes(state) && providerSecured !== "PENDING")
    || (["REPORTED", "OWNERSHIP_CLASSIFIED", "HUMAN_GATE_ACTIVE", "PROVIDER_SECURED"].includes(state) && vaultRepaired !== "PENDING")
    || (["REPORTED", "OWNERSHIP_CLASSIFIED", "HUMAN_GATE_ACTIVE", "PROVIDER_SECURED", "VAULT_REPAIRED"].includes(state) && reuseReviewed !== "PENDING")
    || (["PROVIDER_SECURED", "VAULT_REPAIRED", "REUSE_REVIEWED", "CLOSED"].includes(state) && providerSecured !== "CONFIRMED")
    || (["VAULT_REPAIRED", "REUSE_REVIEWED", "CLOSED"].includes(state) && !["CONFIRMED", "NOT_APPLICABLE"].includes(vaultRepaired))
    || (["REUSE_REVIEWED", "CLOSED"].includes(state) && !["CONFIRMED", "DEFERRED"].includes(reuseReviewed))
    || (closed && (receipt.priority_hold !== "RELEASED" || receipt.routine_cleanup !== "RESUME_ALLOWED" || receipt.blocker_code !== "NONE"))
    || (!closed && (receipt.priority_hold !== "ACTIVE" || receipt.routine_cleanup !== "PRESERVED"))
    || (blocked !== (receipt.blocker_code !== "NONE"))
  ) throw new HarveyControlError("PASSWORD_ACTION_RECEIPT_INVARIANT_FAILED", 503);
  return receipt as HarveyPasswordActionReceipt;
}

async function privateActionPaths(create: boolean) {
  const localAppData = process.env.LOCALAPPDATA?.trim();
  if (!localAppData || !path.isAbsolute(localAppData)) throw new HarveyControlError("PASSWORD_ACTION_ROOT_UNAVAILABLE", 503);
  const localAppDataReal = await fs.realpath(localAppData).catch(() => "");
  if (!localAppDataReal) throw new HarveyControlError("PASSWORD_ACTION_ROOT_UNAVAILABLE", 503);
  const configuredRoot = path.join(localAppData, "Werkles", "Harvey", "private", "password-incident-action");
  if (create) await fs.mkdir(configuredRoot, { recursive: true });
  const rootReal = await fs.realpath(configuredRoot).catch((error: NodeJS.ErrnoException) => {
    if (!create && error.code === "ENOENT") return "";
    throw new HarveyControlError("PASSWORD_ACTION_ROOT_UNAVAILABLE", 503);
  });
  if (!rootReal) return { rootReal: "", file: "", lock: "" };
  if (!rootReal.toLowerCase().startsWith(`${localAppDataReal.toLowerCase()}${path.sep}`)) throw new HarveyControlError("PASSWORD_ACTION_ROOT_INVALID", 503);
  const rootStat = await fs.lstat(rootReal);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new HarveyControlError("PASSWORD_ACTION_ROOT_INVALID", 503);
  return { rootReal, file: path.join(rootReal, "current.json"), lock: path.join(rootReal, ".write.lock") };
}

async function readActionReceiptFile(): Promise<HarveyPasswordActionReceipt | null> {
  const files = await privateActionPaths(false);
  if (!files.rootReal) return null;
  const stat = await fs.lstat(files.file).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!stat) return null;
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size < 2 || stat.size > MAX_ACTION_RECEIPT_BYTES) throw new HarveyControlError("PASSWORD_ACTION_FILE_INVALID", 503);
  const real = await fs.realpath(files.file);
  if (path.dirname(real).toLowerCase() !== files.rootReal.toLowerCase()) throw new HarveyControlError("PASSWORD_ACTION_FILE_INVALID", 503);
  try {
    const receipt = validateHarveyPasswordActionReceipt(JSON.parse(await fs.readFile(real, "utf8")));
    if (
      receipt.state !== "REPORTED"
      || receipt.ownership !== "UNKNOWN"
      || receipt.priority_hold !== "ACTIVE"
      || receipt.routine_cleanup !== "PRESERVED"
      || receipt.human_attestations.provenance !== "NONE"
      || receipt.human_attestations.provider_secured !== "PENDING"
      || receipt.human_attestations.vault_repaired !== "PENDING"
      || receipt.human_attestations.reuse_reviewed !== "PENDING"
      || receipt.blocker_code !== "NONE"
      || receipt.revision !== 1
    ) throw new HarveyControlError("PASSWORD_ACTION_PRIVATE_HUMAN_CHANNEL_REQUIRED", 409);
    return receipt;
  }
  catch (error) {
    if (error instanceof HarveyControlError) throw error;
    throw new HarveyControlError("PASSWORD_ACTION_FILE_INVALID", 503);
  }
}

export async function readHarveyPasswordActionReceipt() {
  return readActionReceiptFile();
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function withActionLock<T>(operation: () => Promise<T>) {
  const files = await privateActionPaths(true);
  for (let attempt = 0; attempt < ACTION_LOCK_ATTEMPTS; attempt += 1) {
    let handle: Awaited<ReturnType<typeof fs.open>> | undefined;
    try {
      handle = await fs.open(files.lock, "wx");
      await handle.writeFile(`${JSON.stringify({ acquired_at: new Date().toISOString() })}\n`, "utf8");
      try { return await operation(); }
      finally {
        await handle.close().catch(() => undefined);
        handle = undefined;
        await fs.unlink(files.lock).catch(() => undefined);
      }
    } catch (error) {
      await handle?.close().catch(() => undefined);
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      try { if (Date.now() - (await fs.stat(files.lock)).mtimeMs > ACTION_LOCK_STALE_MS) await fs.unlink(files.lock); }
      catch (statError) { if ((statError as NodeJS.ErrnoException).code !== "ENOENT") throw statError; }
      await wait(8 + (attempt % 7));
    }
  }
  throw new HarveyControlError("PASSWORD_ACTION_LOCK_TIMEOUT", 503);
}

async function writeActionReceipt(value: HarveyPasswordActionReceipt) {
  const validated = validateHarveyPasswordActionReceipt(value);
  const files = await privateActionPaths(true);
  const temporary = path.join(files.rootReal, `current.${process.pid}.${randomUUID()}.tmp`);
  await fs.writeFile(temporary, `${JSON.stringify(validated)}\n`, { encoding: "utf8", flag: "wx" });
  try { await fs.rename(temporary, files.file); }
  finally { await fs.unlink(temporary).catch(() => undefined); }
  return validated;
}

export async function updateHarveyPasswordActionReceipt(input: Record<string, unknown>, actor: HarveyOperatorActor) {
  if (actor.role !== "operator") throw new HarveyControlError("OPERATOR_AUTH_REQUIRED", 403);
  return withActionLock(async () => {
    const current = await readActionReceiptFile();
    const operation = String(input.operation ?? "");
    if (!operation) throw new HarveyControlError("PASSWORD_ACTION_OPERATION_INVALID", 400);
    if (operation !== "PREPARE") throw new HarveyControlError("PASSWORD_ACTION_PRIVATE_HUMAN_CHANNEL_REQUIRED", 409);
    const now = new Date().toISOString();
    actionInputKeys(input, ["operation"]);
    if (current) return current;
    return writeActionReceipt({
      schema: "werkles.harvey-password-private-action-receipt/v1",
      state: "REPORTED",
      ownership: "UNKNOWN",
      automation_status: "PREPARED_FOR_PRIVATE_HUMAN_ACTION",
      priority_hold: "ACTIVE",
      routine_cleanup: "PRESERVED",
      human_attestations: { provenance: "NONE", provider_secured: "PENDING", vault_repaired: "PENDING", reuse_reviewed: "PENDING" },
      blocker_code: "NONE",
      revision: 1,
      updated_at: now
    });
  });
}
