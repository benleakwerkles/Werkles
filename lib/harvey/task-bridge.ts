import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { HarveyControlError } from "./machine-control";

export type HarveyTaskDispatchState = "QUEUED" | "DELIVERED" | "THINKING" | "REPLIED" | "COMPLETED" | "BLOCKER";

type HarveyTaskBinding = {
  binding_id: string;
  label: string;
  role: string;
  machine: string;
  provider: "Codex";
  host_id: "local";
  thread_id: string;
  state: "BOUND_PROVEN";
  proof: string;
  project_scope: "CURRENT_WERKLES_CHECKOUT";
};

type HarveyTaskBindingSnapshot = Pick<HarveyTaskBinding, "binding_id" | "label" | "role" | "machine" | "provider" | "host_id" | "thread_id" | "project_scope">;

type HarveyTaskEvent = {
  sequence: number;
  type: HarveyTaskDispatchState;
  at: string;
  detail: string;
};

type HarveyTaskUsage = {
  input_tokens: number;
  cached_input_tokens: number;
  output_tokens: number;
};

type HarveyTaskLease = {
  schema: "werkles.harvey-task-binding-lease/v1";
  binding_id: string;
  thread_id: string;
  lease_identity: string;
  dispatch_id: string;
  created_at: string;
  heartbeat_at: string;
  owner_pid: number;
  owner_instance_id: string;
  child_pid: number | null;
};

export type HarveyTaskDispatch = {
  schema: "werkles.harvey-task-dispatch/v1";
  dispatch_id: string;
  submission_id: string;
  binding_id: string;
  thread_id: string;
  binding_snapshot: HarveyTaskBindingSnapshot;
  binding_fingerprint_sha256: string;
  created_at: string;
  updated_at: string;
  state: HarveyTaskDispatchState;
  body: string;
  reply: string | null;
  error: string | null;
  usage: HarveyTaskUsage | null;
  events: HarveyTaskEvent[];
};

const BINDINGS_PATH = path.join(process.cwd(), "foreman", "relay", "HARVEY_DIRECT_TASK_BINDINGS_20260717.json");
const BASE_DIR = path.join(process.cwd(), "data", "harvey", "crew-bridge", "direct-tasks");
const DISPATCH_DIR = path.join(BASE_DIR, "dispatches");
const CLAIM_DIR = path.join(BASE_DIR, "submission-claims");
const LEASE_DIR = path.join(BASE_DIR, "binding-leases");
const THREAD_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const BINDING_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const SUBMISSION_ID = /^[a-f0-9]{32}$/;
const MAX_BODY_BYTES = 4 * 1024;
const MAX_REPLY_BYTES = 8 * 1024;
const MAX_STDOUT_BYTES = 256 * 1024;
const MAX_STDOUT_LINE_BYTES = 64 * 1024;
const MAX_RECORDS = 200;
const MAX_PER_HOUR = 10;
const MAX_PER_DAY = 25;
const MAX_PROJECTED_DISPATCHES = 2;
const LEASE_HEARTBEAT_MS = 1_000;
const LEASE_HEARTBEAT_GRACE_MS = 5_000;
const PROCESS_INSTANCE_ID = randomBytes(16).toString("hex");
const TERMINAL = new Set<HarveyTaskDispatchState>(["COMPLETED", "BLOCKER"]);
const TRANSITIONS: Record<HarveyTaskDispatchState, HarveyTaskDispatchState[]> = {
  QUEUED: ["DELIVERED", "BLOCKER"],
  DELIVERED: ["THINKING", "BLOCKER"],
  THINKING: ["REPLIED", "BLOCKER"],
  REPLIED: ["COMPLETED", "BLOCKER"],
  COMPLETED: [],
  BLOCKER: []
};
const locks = new Map<string, Promise<void>>();

function exactKeys(value: unknown, expected: string[]) {
  if (!value || Array.isArray(value) || typeof value !== "object") return false;
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length && actual.every((key, index) => key === sortedExpected[index]);
}

function bindingSnapshot(binding: HarveyTaskBinding): HarveyTaskBindingSnapshot {
  return {
    binding_id: binding.binding_id,
    label: binding.label,
    role: binding.role,
    machine: binding.machine,
    provider: binding.provider,
    host_id: binding.host_id,
    thread_id: binding.thread_id,
    project_scope: binding.project_scope
  };
}

function bindingFingerprint(snapshot: HarveyTaskBindingSnapshot) {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

function leaseIdentity(binding: Pick<HarveyTaskBinding, "provider" | "host_id" | "thread_id">) {
  return `${binding.provider.toLowerCase()}-${binding.host_id}-${binding.thread_id}`;
}

function dispatchPath(submissionId: string) {
  return path.join(DISPATCH_DIR, `harvey_task_${submissionId}.json`);
}

function leasePath(identity: string) {
  return path.join(LEASE_DIR, `${identity}.lock`);
}

function claimPath(submissionId: string) {
  return path.join(CLAIM_DIR, `${submissionId}.claim`);
}

function processIsAlive(pid: number | null) {
  if (!pid || !Number.isSafeInteger(pid) || pid < 1) return false;
  try { process.kill(pid, 0); return true; }
  catch (error) { return (error as NodeJS.ErrnoException).code === "EPERM"; }
}

function validateLease(value: unknown, expectedIdentity?: string): HarveyTaskLease {
  if (!exactKeys(value, ["schema", "binding_id", "thread_id", "lease_identity", "dispatch_id", "created_at", "heartbeat_at", "owner_pid", "owner_instance_id", "child_pid"])) throw new HarveyControlError("TASK_BRIDGE_LEASE_INVALID", 500);
  const lease = value as HarveyTaskLease;
  if (
    lease.schema !== "werkles.harvey-task-binding-lease/v1"
    || !BINDING_ID.test(lease.binding_id)
    || !THREAD_ID.test(lease.thread_id)
    || lease.lease_identity !== `codex-local-${lease.thread_id}`
    || (expectedIdentity !== undefined && lease.lease_identity !== expectedIdentity)
    || !/^harvey_task_[a-f0-9]{32}$/.test(lease.dispatch_id)
    || !Number.isFinite(Date.parse(lease.created_at))
    || !Number.isFinite(Date.parse(lease.heartbeat_at))
    || Date.parse(lease.heartbeat_at) < Date.parse(lease.created_at)
    || !Number.isSafeInteger(lease.owner_pid) || lease.owner_pid < 1
    || !SUBMISSION_ID.test(lease.owner_instance_id)
    || (lease.child_pid !== null && (!Number.isSafeInteger(lease.child_pid) || lease.child_pid < 1))
  ) throw new HarveyControlError("TASK_BRIDGE_LEASE_INVALID", 500);
  return lease;
}

async function readLease(directory: string, expectedIdentity?: string) {
  return validateLease(JSON.parse(await readFile(path.join(directory, "lease.json"), "utf8")), expectedIdentity);
}

function containsSecretShape(body: string) {
  return [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\b(?:gh[pousr]|github_pat)_[A-Za-z0-9_]{16,}\b/,
    /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
    /\b(?:password|passcode|token|secret|recovery\s+(?:key|code))\s*[:=]\s*\S+/i
  ].some((pattern) => pattern.test(body));
}

function normalizeBody(value: unknown) {
  const body = String(value ?? "").trim();
  if (!body) throw new HarveyControlError("TASK_BRIDGE_BODY_REQUIRED");
  if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) throw new HarveyControlError("TASK_BRIDGE_BODY_TOO_LARGE", 413);
  if (containsSecretShape(body)) throw new HarveyControlError("TASK_BRIDGE_SECRET_SHAPE_REJECTED", 400);
  return body;
}

function normalizeReply(value: unknown) {
  const reply = String(value ?? "").trim();
  if (!reply) throw new HarveyControlError("TASK_BRIDGE_REPLY_MISSING", 502);
  if (Buffer.byteLength(reply, "utf8") > MAX_REPLY_BYTES) throw new HarveyControlError("TASK_BRIDGE_REPLY_TOO_LARGE", 502);
  if (containsSecretShape(reply)) throw new HarveyControlError("TASK_BRIDGE_REPLY_QUARANTINED_SECRET_SHAPE", 502);
  return reply;
}

function normalizeUsage(value: unknown): HarveyTaskUsage {
  if (!value || Array.isArray(value) || typeof value !== "object") throw new HarveyControlError("TASK_BRIDGE_USAGE_INVALID", 502);
  const row = value as Record<string, unknown>;
  const integer = (field: string) => {
    if (!Number.isSafeInteger(row[field]) || Number(row[field]) < 0 || Number(row[field]) > 1_000_000_000) throw new HarveyControlError("TASK_BRIDGE_USAGE_INVALID", 502);
    return Number(row[field]);
  };
  return { input_tokens: integer("input_tokens"), cached_input_tokens: integer("cached_input_tokens"), output_tokens: integer("output_tokens") };
}

function validateDispatch(value: unknown): HarveyTaskDispatch {
  if (!exactKeys(value, ["schema", "dispatch_id", "submission_id", "binding_id", "thread_id", "binding_snapshot", "binding_fingerprint_sha256", "created_at", "updated_at", "state", "body", "reply", "error", "usage", "events"])) throw new HarveyControlError("TASK_BRIDGE_STORED_DISPATCH_INVALID", 500);
  const dispatch = value as HarveyTaskDispatch;
  const snapshot = dispatch.binding_snapshot;
  if (
    dispatch.schema !== "werkles.harvey-task-dispatch/v1"
    || !SUBMISSION_ID.test(dispatch.submission_id)
    || dispatch.dispatch_id !== `harvey_task_${dispatch.submission_id}`
    || !BINDING_ID.test(dispatch.binding_id)
    || !THREAD_ID.test(dispatch.thread_id)
    || !exactKeys(snapshot, ["binding_id", "label", "role", "machine", "provider", "host_id", "thread_id", "project_scope"])
    || snapshot.binding_id !== dispatch.binding_id
    || snapshot.thread_id !== dispatch.thread_id
    || !BINDING_ID.test(snapshot.binding_id)
    || !THREAD_ID.test(snapshot.thread_id)
    || snapshot.provider !== "Codex"
    || snapshot.host_id !== "local"
    || snapshot.project_scope !== "CURRENT_WERKLES_CHECKOUT"
    || !snapshot.label || !snapshot.role || !snapshot.machine
    || dispatch.binding_fingerprint_sha256 !== bindingFingerprint(snapshot)
    || !Number.isFinite(Date.parse(dispatch.created_at))
    || !Number.isFinite(Date.parse(dispatch.updated_at))
    || !Object.hasOwn(TRANSITIONS, dispatch.state)
    || typeof dispatch.body !== "string"
    || Buffer.byteLength(dispatch.body, "utf8") > MAX_BODY_BYTES
    || containsSecretShape(dispatch.body)
    || (dispatch.reply !== null && (typeof dispatch.reply !== "string" || Buffer.byteLength(dispatch.reply, "utf8") > MAX_REPLY_BYTES || containsSecretShape(dispatch.reply)))
    || (dispatch.error !== null && (typeof dispatch.error !== "string" || dispatch.error.length > 256))
    || (dispatch.usage !== null && (!exactKeys(dispatch.usage, ["input_tokens", "cached_input_tokens", "output_tokens"]) || Object.values(dispatch.usage).some((amount) => !Number.isSafeInteger(amount) || amount < 0 || amount > 1_000_000_000)))
    || !Array.isArray(dispatch.events)
    || dispatch.events.length < 1
    || dispatch.events.length > 8
  ) throw new HarveyControlError("TASK_BRIDGE_STORED_DISPATCH_INVALID", 500);
  let prior: HarveyTaskDispatchState | null = null;
  let priorTime = 0;
  dispatch.events.forEach((event, index) => {
    const eventTime = Date.parse(event.at);
    if (!exactKeys(event, ["sequence", "type", "at", "detail"]) || event.sequence !== index + 1 || !Object.hasOwn(TRANSITIONS, event.type) || !Number.isFinite(eventTime) || eventTime < priorTime || typeof event.detail !== "string" || event.detail.length > 512 || (prior && !TRANSITIONS[prior].includes(event.type))) throw new HarveyControlError("TASK_BRIDGE_STORED_DISPATCH_INVALID", 500);
    prior = event.type;
    priorTime = eventTime;
  });
  if (
    dispatch.events[0].type !== "QUEUED"
    || dispatch.created_at !== dispatch.events[0].at
    || dispatch.updated_at !== dispatch.events.at(-1)?.at
    || prior !== dispatch.state
    || (dispatch.reply !== null) !== ["REPLIED", "COMPLETED"].includes(dispatch.state)
    || (dispatch.error !== null) !== (dispatch.state === "BLOCKER")
    || (dispatch.usage !== null) !== (dispatch.state === "COMPLETED")
  ) throw new HarveyControlError("TASK_BRIDGE_STORED_DISPATCH_INVALID", 500);
  return dispatch;
}

async function writeJsonAtomic(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    for (let attempt = 0; ; attempt += 1) {
      try { await rename(temporary, file); break; }
      catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (!["EPERM", "EACCES", "EBUSY"].includes(code ?? "") || attempt >= 39) throw error;
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function readDispatch(file: string) {
  return validateDispatch(JSON.parse(await readFile(file, "utf8")));
}

async function withLock<T>(key: string, work: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => { release = resolve; });
  const queued = previous.then(() => current);
  locks.set(key, queued);
  await previous;
  try { return await work(); }
  finally {
    release();
    if (locks.get(key) === queued) locks.delete(key);
  }
}

async function bindings(): Promise<HarveyTaskBinding[]> {
  const document = JSON.parse(await readFile(BINDINGS_PATH, "utf8")) as Record<string, unknown>;
  if (!exactKeys(document, ["schema", "generated_at", "truth_rule", "bindings"]) || document.schema !== "werkles.harvey-direct-task-bindings/v1" || !Number.isFinite(Date.parse(String(document.generated_at))) || typeof document.truth_rule !== "string" || !Array.isArray(document.bindings)) throw new HarveyControlError("TASK_BINDINGS_INVALID", 500);
  const seen = new Set<string>();
  const seenThreads = new Set<string>();
  const rows = document.bindings as HarveyTaskBinding[];
  for (const binding of rows) {
    if (
      !exactKeys(binding, ["binding_id", "label", "role", "machine", "provider", "host_id", "thread_id", "state", "proof", "project_scope"])
      || !BINDING_ID.test(binding.binding_id)
      || !THREAD_ID.test(binding.thread_id)
      || binding.provider !== "Codex"
      || binding.host_id !== "local"
      || binding.state !== "BOUND_PROVEN"
      || binding.project_scope !== "CURRENT_WERKLES_CHECKOUT"
      || !binding.label || !binding.role || !binding.machine || !binding.proof
      || seen.has(binding.binding_id)
      || seenThreads.has(binding.thread_id)
    ) throw new HarveyControlError("TASK_BINDINGS_INVALID", 500);
    seen.add(binding.binding_id);
    seenThreads.add(binding.thread_id);
  }
  return rows;
}

async function resolveCodexInvocation() {
  const configured = process.env.HARVEY_CODEX_EXECUTABLE?.trim();
  if (configured) {
    if (!path.isAbsolute(configured)) throw new HarveyControlError("TASK_BRIDGE_CODEX_PATH_INVALID", 503);
    await stat(configured);
    let prefix: string[] = [];
    if (process.env.HARVEY_CODEX_PREFIX_ARGS_JSON?.trim()) {
      const parsed = JSON.parse(process.env.HARVEY_CODEX_PREFIX_ARGS_JSON);
      if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string" || item.length > 512)) throw new HarveyControlError("TASK_BRIDGE_CODEX_PREFIX_INVALID", 503);
      prefix = parsed;
    }
    return { executable: configured, prefix };
  }
  const root = path.join(process.env.LOCALAPPDATA ?? "", "OpenAI", "Codex", "bin");
  const candidates: Array<{ file: string; modified: number }> = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(root, entry.name, "codex.exe");
    try { candidates.push({ file, modified: (await stat(file)).mtimeMs }); } catch { /* keep searching */ }
  }
  candidates.sort((left, right) => right.modified - left.modified);
  if (!candidates[0]) throw new HarveyControlError("TASK_BRIDGE_CODEX_EXECUTABLE_NOT_FOUND", 503);
  return { executable: candidates[0].file, prefix: [] as string[] };
}

function childEnvironment(): NodeJS.ProcessEnv {
  const allowed = ["SystemRoot", "WINDIR", "ComSpec", "PATHEXT", "PATH", "TEMP", "TMP", "USERPROFILE", "HOME", "LOCALAPPDATA", "APPDATA", "PROGRAMDATA", "ProgramFiles", "ProgramFiles(x86)", "CODEX_HOME"];
  return { NODE_ENV: process.env.NODE_ENV ?? "production", ...Object.fromEntries(allowed.flatMap((key) => process.env[key] ? [[key, process.env[key] as string]] : [])) };
}

async function acquireBindingLease(binding: HarveyTaskBinding, dispatchId: string) {
  const identity = leaseIdentity(binding);
  const directory = leasePath(identity);
  try { await mkdir(directory, { recursive: false }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      try {
        const prior = await readLease(directory, identity);
        if (!processIsAlive(prior.owner_pid) && !processIsAlive(prior.child_pid)) {
          const quarantine = `${directory}.reap-${process.pid}-${randomBytes(4).toString("hex")}`;
          await rename(directory, quarantine);
          try { await mkdir(directory, { recursive: false }); }
          catch (mkdirError) {
            await rm(quarantine, { recursive: true, force: true });
            if ((mkdirError as NodeJS.ErrnoException).code === "EEXIST") throw new HarveyControlError("TASK_BRIDGE_BINDING_BUSY", 409);
            throw mkdirError;
          }
          await rm(quarantine, { recursive: true, force: true });
        } else throw new HarveyControlError("TASK_BRIDGE_BINDING_BUSY", 409);
      } catch (leaseError) {
        if (leaseError instanceof HarveyControlError && leaseError.message === "TASK_BRIDGE_BINDING_BUSY") throw leaseError;
        throw new HarveyControlError("TASK_BRIDGE_BINDING_BUSY_UNVERIFIED_LEASE", 409);
      }
    } else throw error;
  }
  const now = new Date().toISOString();
  const record: HarveyTaskLease = { schema: "werkles.harvey-task-binding-lease/v1", binding_id: binding.binding_id, thread_id: binding.thread_id, lease_identity: identity, dispatch_id: dispatchId, created_at: now, heartbeat_at: now, owner_pid: process.pid, owner_instance_id: PROCESS_INSTANCE_ID, child_pid: null };
  await writeJsonAtomic(path.join(directory, "lease.json"), record);
  return { directory, record };
}

async function mutateDispatch(submissionId: string, work: (dispatch: HarveyTaskDispatch) => HarveyTaskDispatch) {
  return withLock(submissionId, async () => {
    const file = dispatchPath(submissionId);
    const next = validateDispatch(work(await readDispatch(file)));
    await writeJsonAtomic(file, next);
    return next;
  });
}

async function transition(submissionId: string, expected: HarveyTaskDispatchState, next: HarveyTaskDispatchState, detail: string, changes: Partial<Pick<HarveyTaskDispatch, "reply" | "error" | "usage">> = {}) {
  return mutateDispatch(submissionId, (dispatch) => {
    if (TERMINAL.has(dispatch.state)) return dispatch;
    if (dispatch.state !== expected || !TRANSITIONS[expected].includes(next)) throw new HarveyControlError("TASK_BRIDGE_STATE_TRANSITION_INVALID", 500);
    const at = new Date().toISOString();
    return { ...dispatch, ...changes, state: next, updated_at: at, events: [...dispatch.events, { sequence: dispatch.events.length + 1, type: next, at, detail }] };
  });
}

async function block(submissionId: string, error: string, detail: string) {
  return mutateDispatch(submissionId, (dispatch) => {
    if (TERMINAL.has(dispatch.state)) return dispatch;
    const at = new Date().toISOString();
    return { ...dispatch, state: "BLOCKER", updated_at: at, reply: null, usage: null, error: error.slice(0, 256), events: [...dispatch.events, { sequence: dispatch.events.length + 1, type: "BLOCKER", at, detail }] };
  });
}

function promptFor(dispatch: HarveyTaskDispatch, binding: HarveyTaskBinding) {
  return [
    `[HARVEY DIRECT MESSAGE ${dispatch.dispatch_id}]`,
    `TO: ${binding.label}@${binding.machine} via ${binding.provider} task ${binding.thread_id}`,
    "FROM: Ben via Harvey",
    "",
    dispatch.body,
    "",
    "Reply directly to Ben. You are a chat-only receiver in this turn: do not use tools, read files, inspect environment state, or claim completion of unperformed work."
  ].join("\n");
}

async function runDispatch(dispatch: HarveyTaskDispatch, binding: HarveyTaskBinding, lease: { directory: string; record: HarveyTaskLease }) {
  let child: ReturnType<typeof spawn> | null = null;
  let buffer = "";
  let phase: HarveyTaskDispatchState = "QUEUED";
  let writeChain: Promise<unknown> = Promise.resolve();
  let timedOut = false;
  let stdoutBytes = 0;
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let heartbeatChain: Promise<unknown> = Promise.resolve();
  let releaseLease = false;
  const schedule = (work: () => Promise<unknown>) => {
    writeChain = writeChain.then(work, work);
    void writeChain.catch(() => undefined);
  };
  const failStream = (error: string, detail: string) => {
    if (phase === "BLOCKER" || phase === "COMPLETED") return;
    phase = "BLOCKER";
    schedule(() => block(dispatch.submission_id, error, detail));
    child?.kill();
  };
  try {
    const invocation = await resolveCodexInvocation();
    const hardening = [
      "--disable", "shell_tool", "--disable", "apps", "--disable", "browser_use", "--disable", "browser_use_external",
      "--disable", "computer_use", "--disable", "multi_agent", "--disable", "image_generation",
      "-c", 'sandbox_mode="read-only"', "-c", 'approval_policy="never"'
    ];
    const args = [...invocation.prefix, "exec", "resume", "--json", ...hardening, binding.thread_id, "-"];
    child = spawn(invocation.executable, args, { cwd: process.cwd(), env: childEnvironment(), shell: false, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    if (!Number.isSafeInteger(child.pid) || Number(child.pid) < 1) throw new HarveyControlError("TASK_BRIDGE_CHILD_ID_UNAVAILABLE", 503);
    lease.record.child_pid = Number(child.pid);
    lease.record.heartbeat_at = new Date().toISOString();
    await writeJsonAtomic(path.join(lease.directory, "lease.json"), lease.record);
    heartbeatTimer = setInterval(() => {
      heartbeatChain = heartbeatChain.then(async () => {
        lease.record.heartbeat_at = new Date().toISOString();
        await writeJsonAtomic(path.join(lease.directory, "lease.json"), lease.record);
      }).catch(() => failStream("TASK_BRIDGE_LEASE_HEARTBEAT_FAILED", "Harvey could not prove continued ownership of the exact task lease."));
    }, LEASE_HEARTBEAT_MS);
    const timeout = setTimeout(() => { timedOut = true; child?.kill(); }, 15 * 60 * 1000);
    child!.stderr!.resume();
    child!.stdout!.setEncoding("utf8");
    child!.stdout!.on("data", (chunk: string) => {
      if (phase === "BLOCKER" || phase === "COMPLETED") return;
      stdoutBytes += Buffer.byteLength(chunk, "utf8");
      if (stdoutBytes > MAX_STDOUT_BYTES) {
        failStream("TASK_BRIDGE_STDOUT_TOO_LARGE", "Provider stdout exceeded Harvey's bounded event-stream allowance.");
        return;
      }
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      if (Buffer.byteLength(buffer, "utf8") > MAX_STDOUT_LINE_BYTES) {
        failStream("TASK_BRIDGE_STDOUT_LINE_TOO_LARGE", "Provider emitted an overlong event-stream line.");
        return;
      }
      for (const line of lines) {
        if (Buffer.byteLength(line, "utf8") > MAX_STDOUT_LINE_BYTES) {
          failStream("TASK_BRIDGE_STDOUT_LINE_TOO_LARGE", "Provider emitted an overlong event-stream line.");
          return;
        }
        if (!line.trim()) continue;
        let event: Record<string, unknown>;
        try { event = JSON.parse(line) as Record<string, unknown>; } catch { continue; }
        if (event.type === "thread.started") {
          if (phase !== "QUEUED" || String(event.thread_id ?? "") !== binding.thread_id) {
            phase = "BLOCKER";
            schedule(() => block(dispatch.submission_id, "TASK_BRIDGE_THREAD_ID_MISMATCH", "Provider did not start the exact bound task identity."));
            child?.kill();
          } else {
            phase = "DELIVERED";
            schedule(() => transition(dispatch.submission_id, "QUEUED", "DELIVERED", "Codex resumed the exact allowlisted task id."));
          }
        } else if (event.type === "turn.started") {
          if (phase !== "DELIVERED") {
            phase = "BLOCKER";
            schedule(() => block(dispatch.submission_id, "TASK_BRIDGE_EVENT_ORDER_INVALID", "turn.started arrived before exact task identity was proven."));
            child?.kill();
          } else {
            phase = "THINKING";
            schedule(() => transition(dispatch.submission_id, "DELIVERED", "THINKING", "The exact bound task emitted turn.started."));
          }
        } else if (event.type === "item.completed") {
          const item = event.item && typeof event.item === "object" ? event.item as Record<string, unknown> : null;
          if (item?.type !== "agent_message") continue;
          if (phase !== "THINKING") {
            phase = "BLOCKER";
            schedule(() => block(dispatch.submission_id, "TASK_BRIDGE_EVENT_ORDER_INVALID", "Agent reply arrived before exact task delivery and thinking were proven."));
            child?.kill();
          } else {
            try {
              const reply = normalizeReply(item.text);
              phase = "REPLIED";
              schedule(() => transition(dispatch.submission_id, "THINKING", "REPLIED", "The exact bound task returned a bounded, screened agent message.", { reply }));
            } catch (error) {
              phase = "BLOCKER";
              schedule(() => block(dispatch.submission_id, error instanceof Error ? error.message : "TASK_BRIDGE_REPLY_QUARANTINED", "Provider reply was quarantined and not stored or displayed."));
              child?.kill();
            }
          }
        } else if (event.type === "turn.completed") {
          if (phase !== "REPLIED") {
            phase = "BLOCKER";
            schedule(() => block(dispatch.submission_id, "TASK_BRIDGE_EVENT_ORDER_INVALID", "turn.completed arrived without a valid reply from the exact task."));
          } else {
            try {
              const usage = normalizeUsage(event.usage);
              phase = "COMPLETED";
              schedule(() => transition(dispatch.submission_id, "REPLIED", "COMPLETED", "The exact bound provider turn completed after its reply.", { usage }));
            } catch (error) {
              failStream(error instanceof Error ? error.message : "TASK_BRIDGE_USAGE_INVALID", "Provider completion did not include valid bounded token usage.");
            }
          }
        } else if (event.type === "turn.failed" || event.type === "error") {
          phase = "BLOCKER";
          schedule(() => block(dispatch.submission_id, "TASK_BRIDGE_PROVIDER_FAILURE", "The provider event stream reported failure."));
        }
      }
    });
    child!.stdin!.end(promptFor(dispatch, binding), "utf8");
    const exitCode = await new Promise<number | null>((resolve, reject) => {
      child?.once("error", reject);
      child?.once("close", resolve);
    });
    clearTimeout(timeout);
    await writeChain;
    const latest = await readDispatch(dispatchPath(dispatch.submission_id));
    if (!TERMINAL.has(latest.state)) await block(dispatch.submission_id, timedOut ? "TASK_BRIDGE_TIMEOUT" : "TASK_BRIDGE_NONTERMINAL_EXIT", `Codex exited before a terminal reply (exit ${String(exitCode)}).`);
    releaseLease = TERMINAL.has((await readDispatch(dispatchPath(dispatch.submission_id))).state);
  } catch (error) {
    await writeChain.catch(() => undefined);
    await block(dispatch.submission_id, error instanceof Error ? error.message : "TASK_BRIDGE_LAUNCH_FAILED", "Harvey could not launch or complete the hardened task adapter.").catch(() => undefined);
    releaseLease = await readDispatch(dispatchPath(dispatch.submission_id)).then((latest) => TERMINAL.has(latest.state)).catch(() => false);
  } finally {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    await heartbeatChain.catch(() => undefined);
    if (releaseLease) await rm(lease.directory, { recursive: true, force: true });
  }
}

async function listDispatches() {
  await mkdir(DISPATCH_DIR, { recursive: true });
  const rows: HarveyTaskDispatch[] = [];
  for (const name of await readdir(DISPATCH_DIR)) {
    if (!/^harvey_task_[a-f0-9]{32}\.json$/.test(name)) continue;
    rows.push(await readDispatch(path.join(DISPATCH_DIR, name)));
  }
  rows.sort((left, right) => right.created_at.localeCompare(left.created_at));
  return rows;
}

async function recoverOrphan(dispatch: HarveyTaskDispatch) {
  const identity = leaseIdentity(dispatch.binding_snapshot);
  const directory = leasePath(identity);
  let lease: HarveyTaskLease;
  try {
    lease = await readLease(directory, identity);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return TERMINAL.has(dispatch.state) ? dispatch : block(dispatch.submission_id, "TASK_BRIDGE_ORPHANED_AFTER_RESTART", "Harvey found a nonterminal dispatch with no provider lease.");
    }
    return TERMINAL.has(dispatch.state) ? dispatch : block(dispatch.submission_id, "TASK_BRIDGE_LEASE_INVALID_QUARANTINED", "Harvey blocked an unverifiable lease and kept the exact task route locked.");
  }
  if (lease.dispatch_id !== dispatch.dispatch_id || lease.binding_id !== dispatch.binding_id || lease.thread_id !== dispatch.thread_id) {
    return TERMINAL.has(dispatch.state) ? dispatch : block(dispatch.submission_id, "TASK_BRIDGE_LEASE_IDENTITY_MISMATCH", "Harvey blocked a lease that did not match the stored dispatch identity.");
  }
  const heartbeatFresh = Date.now() - Date.parse(lease.heartbeat_at) <= LEASE_HEARTBEAT_GRACE_MS;
  const ownerAlive = processIsAlive(lease.owner_pid);
  const childAlive = processIsAlive(lease.child_pid);
  const launchWindow = lease.child_pid === null && dispatch.state === "QUEUED";
  const active = heartbeatFresh && ownerAlive && (childAlive || launchWindow);
  if (TERMINAL.has(dispatch.state)) {
    if (!ownerAlive && !childAlive) await rm(directory, { recursive: true, force: true });
    return dispatch;
  }
  if (active) return dispatch;
  if (!ownerAlive && !childAlive) await rm(directory, { recursive: true, force: true });
  return block(dispatch.submission_id, "TASK_BRIDGE_LEASE_UNVERIFIABLE_QUARANTINED", "Harvey could not verify a live owner, child, and heartbeat; the dispatch was blocked and any possibly live task route remains locked.");
}

export async function createHarveyTaskDispatch(input: Record<string, unknown>) {
  const submissionId = String(input.submission_id ?? "").toLowerCase();
  const bindingId = String(input.binding_id ?? "").toLowerCase();
  if (!SUBMISSION_ID.test(submissionId) || !BINDING_ID.test(bindingId)) throw new HarveyControlError("TASK_BRIDGE_INPUT_INVALID");
  const body = normalizeBody(input.body);
  const allBindings = await bindings();
  const binding = allBindings.find((candidate) => candidate.binding_id === bindingId);
  if (!binding) throw new HarveyControlError("TASK_BRIDGE_BINDING_NOT_FOUND", 404);
  await mkdir(DISPATCH_DIR, { recursive: true });
  await mkdir(CLAIM_DIR, { recursive: true });
  await mkdir(LEASE_DIR, { recursive: true });

  try {
    const prior = await readDispatch(dispatchPath(submissionId));
    if (prior.binding_id !== bindingId || prior.body !== body) throw new HarveyControlError("TASK_BRIDGE_IDEMPOTENCY_CONFLICT", 409);
    return prior;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const dispatchId = `harvey_task_${submissionId}`;
  let lease: Awaited<ReturnType<typeof acquireBindingLease>> | null = null;
  for (let attempt = 0; attempt < 50 && !lease; attempt += 1) {
    try { lease = await acquireBindingLease(binding, dispatchId); }
    catch (error) {
      if (!(error instanceof HarveyControlError) || !["TASK_BRIDGE_BINDING_BUSY", "TASK_BRIDGE_BINDING_BUSY_UNVERIFIED_LEASE"].includes(error.message)) throw error;
      if (error.message === "TASK_BRIDGE_BINDING_BUSY_UNVERIFIED_LEASE") {
        let freshInitialization = false;
        try {
          const leaseDirectory = await stat(leasePath(leaseIdentity(binding)));
          freshInitialization = Date.now() - leaseDirectory.birthtimeMs < 2_000;
        } catch (statError) {
          freshInitialization = (statError as NodeJS.ErrnoException).code === "ENOENT";
        }
        if (!freshInitialization) throw error;
        await new Promise((resolve) => setTimeout(resolve, 50));
        continue;
      }
      try {
        const prior = await readDispatch(dispatchPath(submissionId));
        if (prior.binding_id !== bindingId || prior.body !== body) throw new HarveyControlError("TASK_BRIDGE_IDEMPOTENCY_CONFLICT", 409);
        return prior;
      } catch (readError) {
        if ((readError as NodeJS.ErrnoException).code !== "ENOENT") throw readError;
      }

      let retryableLease = false;
      const identity = leaseIdentity(binding);
      try {
        const activeLease = await readLease(leasePath(identity), identity);
        if (activeLease.dispatch_id === dispatchId) retryableLease = true;
        else {
          const activeSubmissionId = activeLease.dispatch_id.replace(/^harvey_task_/, "");
          if (SUBMISSION_ID.test(activeSubmissionId)) {
            const activeDispatch = await readDispatch(dispatchPath(activeSubmissionId));
            retryableLease = TERMINAL.has(activeDispatch.state);
          }
        }
      } catch (leaseReadError) {
        retryableLease = (leaseReadError as NodeJS.ErrnoException).code === "ENOENT";
      }
      if (!retryableLease) throw error;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  if (!lease) throw new HarveyControlError("TASK_BRIDGE_BINDING_BUSY", 409);
  let claimed = false;
  try {
    await mkdir(claimPath(submissionId), { recursive: false });
    claimed = true;
  } catch (error) {
    await rm(lease.directory, { recursive: true, force: true });
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      const prior = await readDispatch(dispatchPath(submissionId));
      if (prior.binding_id !== bindingId || prior.body !== body) throw new HarveyControlError("TASK_BRIDGE_IDEMPOTENCY_CONFLICT", 409);
      return prior;
    } catch (readError) {
      if ((readError as NodeJS.ErrnoException).code === "ENOENT") throw new HarveyControlError("TASK_BRIDGE_SUBMISSION_PENDING", 409);
      throw readError;
    }
  }

  try {
    const existing = await listDispatches();
    const nowMs = Date.now();
    if (existing.length >= MAX_RECORDS) throw new HarveyControlError("TASK_BRIDGE_RECORD_CAP_REACHED", 429);
    if (existing.filter((row) => row.thread_id === binding.thread_id && nowMs - Date.parse(row.created_at) < 60 * 60 * 1000).length >= MAX_PER_HOUR) throw new HarveyControlError("TASK_BRIDGE_HOURLY_CAP_REACHED", 429);
    if (existing.filter((row) => row.thread_id === binding.thread_id && nowMs - Date.parse(row.created_at) < 24 * 60 * 60 * 1000).length >= MAX_PER_DAY) throw new HarveyControlError("TASK_BRIDGE_DAILY_CAP_REACHED", 429);
    const now = new Date().toISOString();
    const dispatch: HarveyTaskDispatch = {
      schema: "werkles.harvey-task-dispatch/v1",
      dispatch_id: dispatchId,
      submission_id: submissionId,
      binding_id: bindingId,
      thread_id: binding.thread_id,
      binding_snapshot: bindingSnapshot(binding),
      binding_fingerprint_sha256: bindingFingerprint(bindingSnapshot(binding)),
      created_at: now,
      updated_at: now,
      state: "QUEUED",
      body,
      reply: null,
      error: null,
      usage: null,
      events: [{ sequence: 1, type: "QUEUED", at: now, detail: "Harvey atomically accepted the message for one exact allowlisted task." }]
    };
    validateDispatch(dispatch);
    await writeJsonAtomic(dispatchPath(submissionId), dispatch);
    void runDispatch(dispatch, binding, lease);
    return dispatch;
  } catch (error) {
    if (claimed) await rm(claimPath(submissionId), { recursive: true, force: true });
    await rm(lease.directory, { recursive: true, force: true });
    throw error;
  }
}

export async function readHarveyTaskBridgeProjection() {
  const allBindings = await bindings();
  const recovered: HarveyTaskDispatch[] = [];
  for (const dispatch of await listDispatches()) recovered.push(await recoverOrphan(dispatch));
  return {
    schema: "werkles.harvey-task-bridge/v1" as const,
    generated_at: new Date().toISOString(),
    truth_rule: "DELIVERED and THINKING require ordered Codex JSON events from the exact allowlisted task. Harvey does not claim a separate READ state because Codex exposes no read receipt.",
    limits: {
      max_records: MAX_RECORDS,
      per_thread_hour: MAX_PER_HOUR,
      per_thread_day: MAX_PER_DAY,
      provider_billing: "CURRENT_CODEX_ACCOUNT_OR_QUOTA_BILLING_UNINSPECTED" as const,
      budget_basis: "HARVEY_LOCAL_INTEGRATION_EXISTING_CODEX_STANDING_THREAD_AUTHORIZED" as const
    },
    bindings: await Promise.all(allBindings.map(async (binding) => {
      let busy = false;
      try { await stat(leasePath(leaseIdentity(binding))); busy = true; } catch { /* no lease */ }
      return { ...binding, busy };
    })),
    dispatches: recovered.slice(0, MAX_PROJECTED_DISPATCHES)
  };
}
