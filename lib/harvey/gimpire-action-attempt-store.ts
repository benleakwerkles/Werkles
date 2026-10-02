import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const ID = /^[a-z0-9][a-z0-9-]{2,127}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const MAX_ATTEMPTS = 512;

type Attempt = {
  attempt_id: string;
  action_id: string;
  action_sha256: string;
  expected_work_revision: number;
  state: "IN_FLIGHT" | "SUCCEEDED" | "BLOCKED";
  claimed_at: string;
  terminal_at: string | null;
  evidence_class: string | null;
  event_sha256: string | null;
  result_sha256: string | null;
};

type AttemptLedger = {
  schema: "werkles.gimpire-action-attempt-ledger/v1";
  project_id: string;
  work_object_id: string;
  revision: number;
  attempts: Attempt[];
};

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

function hash(value: unknown) {
  return createHash("sha256").update(canonical(value), "utf8").digest("hex");
}

function instant(value: unknown, code: string) {
  if (typeof value !== "string") throw new Error(code);
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString() !== value) throw new Error(code);
  return value;
}

function exact(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort(); const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function location(root: string, projectId: string, workObjectId: string) {
  if (!ID.test(projectId) || !ID.test(workObjectId)) throw new Error("GIMPIRE_ACTION_ATTEMPT_ID_INVALID");
  const base = path.resolve(root); const directory = path.resolve(base, projectId);
  if (!directory.toLowerCase().startsWith(`${base}${path.sep}`.toLowerCase())) throw new Error("GIMPIRE_ACTION_ATTEMPT_BOUNDARY_INVALID");
  return { directory, file: path.join(directory, `${workObjectId}.json`), lock: path.join(directory, `${workObjectId}.lock`) };
}

function validate(value: unknown, projectId: string, workObjectId: string): AttemptLedger {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || !exact(value as Record<string, unknown>, ["schema", "project_id", "work_object_id", "revision", "attempts"])) {
    throw new Error("GIMPIRE_ACTION_ATTEMPT_LEDGER_INVALID");
  }
  const ledger = value as AttemptLedger;
  if (ledger.schema !== "werkles.gimpire-action-attempt-ledger/v1" || ledger.project_id !== projectId
    || ledger.work_object_id !== workObjectId || !Number.isSafeInteger(ledger.revision) || ledger.revision < 0
    || !Array.isArray(ledger.attempts) || ledger.attempts.length > MAX_ATTEMPTS || ledger.revision < ledger.attempts.length) {
    throw new Error("GIMPIRE_ACTION_ATTEMPT_LEDGER_INVALID");
  }
  const ids = new Set<string>(); const actionIds = new Set<string>();
  for (const item of ledger.attempts) {
    if (!item || !exact(item as unknown as Record<string, unknown>, [
      "attempt_id", "action_id", "action_sha256", "expected_work_revision", "state", "claimed_at", "terminal_at",
      "evidence_class", "event_sha256", "result_sha256"
    ]) || !SHA256.test(item.attempt_id) || !ID.test(item.action_id) || !SHA256.test(item.action_sha256)
      || !Number.isSafeInteger(item.expected_work_revision) || item.expected_work_revision < 0
      || !["IN_FLIGHT", "SUCCEEDED", "BLOCKED"].includes(item.state)
      || ids.has(item.attempt_id) || actionIds.has(item.action_id)) throw new Error("GIMPIRE_ACTION_ATTEMPT_LEDGER_INVALID");
    instant(item.claimed_at, "GIMPIRE_ACTION_ATTEMPT_TIME_INVALID");
    const terminal = item.state !== "IN_FLIGHT";
    if (terminal !== Boolean(item.terminal_at && item.evidence_class && item.event_sha256 && item.result_sha256)
      || (!terminal && [item.terminal_at, item.evidence_class, item.event_sha256, item.result_sha256].some((part) => part !== null))) {
      throw new Error("GIMPIRE_ACTION_ATTEMPT_TERMINAL_INVALID");
    }
    if (terminal) {
      instant(item.terminal_at, "GIMPIRE_ACTION_ATTEMPT_TIME_INVALID");
      if (!SHA256.test(item.event_sha256!) || !SHA256.test(item.result_sha256!)) throw new Error("GIMPIRE_ACTION_ATTEMPT_TERMINAL_INVALID");
    }
    ids.add(item.attempt_id); actionIds.add(item.action_id);
  }
  return ledger;
}

export function validateGimpireActionAttemptLedger(value: unknown, projectId: string, workObjectId: string) {
  return validate(value, projectId, workObjectId);
}

async function read(file: string, projectId: string, workObjectId: string) {
  try { return validate(JSON.parse(await fs.readFile(file, "utf8")), projectId, workObjectId); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return validate({
      schema: "werkles.gimpire-action-attempt-ledger/v1", project_id: projectId, work_object_id: workObjectId, revision: 0, attempts: []
    }, projectId, workObjectId);
    throw error;
  }
}

export async function recoverGimpireActionAttempt(input: {
  root: string; project_id: string; work_object_id: string; action_id: string; action_sha256: string;
}) {
  if (!ID.test(input.action_id) || !SHA256.test(input.action_sha256)) throw new Error("GIMPIRE_ACTION_RECOVERY_INVALID");
  const target = location(input.root, input.project_id, input.work_object_id);
  const ledger = await read(target.file, input.project_id, input.work_object_id);
  const existing = ledger.attempts.find((item) => item.action_id === input.action_id);
  if (!existing) return Object.freeze({ decision: "NOT_FOUND" as const, ledger_revision: ledger.revision });
  if (existing.action_sha256 !== input.action_sha256) throw new Error("GIMPIRE_ACTION_CLAIM_CONFLICT");
  return Object.freeze({
    decision: existing.state === "IN_FLIGHT" ? "RESULT_UNKNOWN_NO_RETRY" as const : "TERMINAL_REPLAY" as const,
    attempt: existing,
    ledger_revision: ledger.revision
  });
}

async function write(file: string, ledger: AttemptLedger) {
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  try { await fs.writeFile(temporary, `${JSON.stringify(ledger, null, 2)}\n`, { encoding: "utf8", flag: "wx" }); await fs.rename(temporary, file); }
  finally { await fs.rm(temporary, { force: true }).catch(() => undefined); }
}

async function locked<T>(lock: string, action: () => Promise<T>) {
  try { await fs.mkdir(lock); } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new Error("GIMPIRE_ACTION_ATTEMPT_BUSY"); throw error;
  }
  try { return await action(); } finally { await fs.rm(lock, { recursive: true, force: true }); }
}

export async function claimGimpireActionOnce(input: {
  root: string; project_id: string; work_object_id: string; expected_work_revision: number;
  action_id: string; action_sha256: string; claimed_at: string;
}) {
  if (!Number.isSafeInteger(input.expected_work_revision) || input.expected_work_revision < 0 || !ID.test(input.action_id)
    || !SHA256.test(input.action_sha256)) throw new Error("GIMPIRE_ACTION_CLAIM_INVALID");
  instant(input.claimed_at, "GIMPIRE_ACTION_ATTEMPT_TIME_INVALID");
  const target = location(input.root, input.project_id, input.work_object_id); await fs.mkdir(target.directory, { recursive: true });
  return locked(target.lock, async () => {
    const ledger = await read(target.file, input.project_id, input.work_object_id);
    const existing = ledger.attempts.find((item) => item.action_id === input.action_id);
    if (existing) {
      if (existing.action_sha256 !== input.action_sha256 || existing.expected_work_revision !== input.expected_work_revision) {
        throw new Error("GIMPIRE_ACTION_CLAIM_CONFLICT");
      }
      return Object.freeze({ decision: existing.state === "IN_FLIGHT" ? "RESULT_UNKNOWN_NO_RETRY" as const : "TERMINAL_REPLAY" as const, attempt: existing, ledger_revision: ledger.revision });
    }
    if (ledger.attempts.length >= MAX_ATTEMPTS) throw new Error("GIMPIRE_ACTION_ATTEMPT_CAPACITY_EXCEEDED");
    const attempt: Attempt = {
      attempt_id: hash({ project_id: input.project_id, work_object_id: input.work_object_id, expected_work_revision: input.expected_work_revision, action_id: input.action_id, action_sha256: input.action_sha256 }),
      action_id: input.action_id, action_sha256: input.action_sha256, expected_work_revision: input.expected_work_revision,
      state: "IN_FLIGHT", claimed_at: input.claimed_at, terminal_at: null, evidence_class: null, event_sha256: null, result_sha256: null
    };
    const next = validate({ ...ledger, revision: ledger.revision + 1, attempts: [...ledger.attempts, attempt] }, input.project_id, input.work_object_id);
    await write(target.file, next);
    return Object.freeze({ decision: "EXECUTE_ONCE" as const, attempt, ledger_revision: next.revision });
  });
}

export async function recordGimpireActionResultOnce(input: {
  root: string; project_id: string; work_object_id: string; action_id: string; action_sha256: string; attempt_id: string;
  state: "SUCCEEDED" | "BLOCKED"; terminal_at: string; evidence_class: string; event_sha256: string; result_sha256: string;
}) {
  if (!ID.test(input.action_id) || ![input.action_sha256, input.attempt_id, input.event_sha256, input.result_sha256].every((item) => SHA256.test(item))
    || !["SUCCEEDED", "BLOCKED"].includes(input.state) || typeof input.evidence_class !== "string" || input.evidence_class.length < 3) {
    throw new Error("GIMPIRE_ACTION_RESULT_INVALID");
  }
  instant(input.terminal_at, "GIMPIRE_ACTION_ATTEMPT_TIME_INVALID");
  const target = location(input.root, input.project_id, input.work_object_id);
  return locked(target.lock, async () => {
    const ledger = await read(target.file, input.project_id, input.work_object_id);
    const index = ledger.attempts.findIndex((item) => item.action_id === input.action_id);
    if (index < 0) throw new Error("GIMPIRE_ACTION_CLAIM_REQUIRED");
    const current = ledger.attempts[index];
    if (current.action_sha256 !== input.action_sha256 || current.attempt_id !== input.attempt_id) throw new Error("GIMPIRE_ACTION_RESULT_CONFLICT");
    const terminal = { ...current, state: input.state, terminal_at: input.terminal_at, evidence_class: input.evidence_class, event_sha256: input.event_sha256, result_sha256: input.result_sha256 };
    if (current.state !== "IN_FLIGHT") {
      if (canonical(current) !== canonical(terminal)) throw new Error("GIMPIRE_ACTION_RESULT_CONFLICT");
      return Object.freeze({ decision: "TERMINAL_REPLAY" as const, attempt: current, ledger_revision: ledger.revision });
    }
    const attempts = [...ledger.attempts]; attempts[index] = terminal;
    const next = validate({ ...ledger, revision: ledger.revision + 1, attempts }, input.project_id, input.work_object_id);
    await write(target.file, next);
    return Object.freeze({ decision: "TERMINAL_RECORDED" as const, attempt: terminal, ledger_revision: next.revision });
  });
}
