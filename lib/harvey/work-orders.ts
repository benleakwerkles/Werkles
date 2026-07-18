import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { HARVEY_MACHINES, HarveyControlError, type HarveyOperatorActor } from "./machine-control";

export const HARVEY_WORK_ORDER_VERBS = ["VERIFY", "PREPARE", "GO", "KNOCK"] as const;
export type HarveyWorkOrderVerb = (typeof HARVEY_WORK_ORDER_VERBS)[number];

export type HarveyWorkOrder = {
  schema: "werkles.harvey-work-order/v1";
  work_order_id: string;
  submission_id: string;
  verb: HarveyWorkOrderVerb;
  target: string;
  instruction: string;
  status: "QUEUED_LOCAL";
  route_state: "UNBOUND";
  created_at: string;
  created_by: string;
  timeline: Array<{ stage: "DRAFT" | "QUEUED"; at: string }>;
};

const TARGET_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 _&'()+.,:/-]{0,79}$/;
const MAX_INSTRUCTION_BYTES = 8 * 1024;
const MAX_WORK_ORDERS = 512;
let workOrderWriteQueue: Promise<unknown> = Promise.resolve();
const WORK_ORDER_LOCK_ATTEMPTS = 300;
const WORK_ORDER_LOCK_STALE_MS = 30_000;

const workOrderRoot = () => path.join(process.cwd(), "data", "harvey", "work-orders");

function normalizeVerb(value: unknown): HarveyWorkOrderVerb {
  const verb = String(value ?? "").toUpperCase();
  if (!HARVEY_WORK_ORDER_VERBS.includes(verb as HarveyWorkOrderVerb)) throw new HarveyControlError("WORK_ORDER_VERB_INVALID");
  return verb as HarveyWorkOrderVerb;
}

function normalizeTarget(value: unknown) {
  const target = String(value ?? "").trim();
  if (!TARGET_PATTERN.test(target)) throw new HarveyControlError("WORK_ORDER_TARGET_INVALID");
  const machine = HARVEY_MACHINES.find((candidate) => candidate.toLowerCase() === target.toLowerCase());
  return machine ?? target;
}

function normalizeInstruction(value: unknown) {
  const instruction = String(value ?? "").trim();
  if (!instruction) throw new HarveyControlError("WORK_ORDER_INSTRUCTION_REQUIRED");
  if (Buffer.byteLength(instruction, "utf8") > MAX_INSTRUCTION_BYTES) throw new HarveyControlError("WORK_ORDER_INSTRUCTION_TOO_LARGE", 413);
  if ([
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\b(?:gh[pousr]|github_pat)_[A-Za-z0-9_]{16,}\b/,
    /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
    /\b(?:password|passcode|token|secret|recovery\s+(?:key|code))\s*[:=]\s*\S+/i
  ].some((pattern) => pattern.test(instruction))) throw new HarveyControlError("WORK_ORDER_SECRET_SHAPE_REJECTED", 400);
  return instruction;
}

function normalizeSubmissionId(value: unknown) {
  const submissionId = String(value ?? "").toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(submissionId)) throw new HarveyControlError("WORK_ORDER_SUBMISSION_ID_INVALID");
  return submissionId;
}

async function writeAtomic(file: string, value: HarveyWorkOrder) {
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  try { await fs.link(temporary, file); }
  finally { await fs.unlink(temporary).catch(() => undefined); }
}

async function assertCapacity() {
  const root = workOrderRoot();
  const entries = (await fs.readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /^harvey_work_[a-f0-9]{32}\.json$/.test(entry.name));
  if (entries.length >= MAX_WORK_ORDERS) throw new HarveyControlError("WORK_ORDER_CAPACITY_EXCEEDED", 429);
}

function queueWorkOrderWrite<T>(operation: () => Promise<T>) {
  const result = workOrderWriteQueue.then(operation, operation);
  workOrderWriteQueue = result.then(() => undefined, () => undefined);
  return result;
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function withWorkOrderLock<T>(operation: () => Promise<T>) {
  const lock = path.join(workOrderRoot(), ".create.lock");
  for (let attempt = 0; attempt < WORK_ORDER_LOCK_ATTEMPTS; attempt += 1) {
    let handle: Awaited<ReturnType<typeof fs.open>> | undefined;
    try {
      handle = await fs.open(lock, "wx");
      await handle.writeFile(`${JSON.stringify({ pid: process.pid, acquired_at: new Date().toISOString() })}\n`, "utf8");
      try { return await operation(); }
      finally {
        await handle.close().catch(() => undefined);
        handle = undefined;
        await fs.unlink(lock).catch(() => undefined);
      }
    } catch (error) {
      await handle?.close().catch(() => undefined);
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      try {
        if (Date.now() - (await fs.stat(lock)).mtimeMs > WORK_ORDER_LOCK_STALE_MS) await fs.unlink(lock);
      } catch (statError) {
        if ((statError as NodeJS.ErrnoException).code !== "ENOENT") throw statError;
      }
      await wait(8 + (attempt % 7));
    }
  }
  throw new HarveyControlError("WORK_ORDER_LOCK_TIMEOUT", 503);
}

export async function createHarveyWorkOrder(input: Record<string, unknown>, actor: HarveyOperatorActor) {
  if (actor.role !== "operator") throw new HarveyControlError("OPERATOR_AUTH_REQUIRED", 403);
  const submissionId = normalizeSubmissionId(input.submission_id);
  const verb = normalizeVerb(input.verb);
  const target = normalizeTarget(input.target);
  const instruction = normalizeInstruction(input.instruction);
  const now = new Date().toISOString();
  const workOrder: HarveyWorkOrder = {
    schema: "werkles.harvey-work-order/v1",
    work_order_id: `harvey_work_${submissionId}`,
    submission_id: submissionId,
    verb,
    target,
    instruction,
    status: "QUEUED_LOCAL",
    route_state: "UNBOUND",
    created_at: now,
    created_by: actor.operator_id,
    timeline: [{ stage: "DRAFT", at: now }, { stage: "QUEUED", at: now }]
  };
  return queueWorkOrderWrite(async () => {
    await fs.mkdir(workOrderRoot(), { recursive: true });
    return withWorkOrderLock(async () => {
      const file = path.join(workOrderRoot(), `${workOrder.work_order_id}.json`);
      try {
        const existing = JSON.parse(await fs.readFile(file, "utf8")) as HarveyWorkOrder;
        if (existing.schema !== workOrder.schema || existing.submission_id !== submissionId || existing.verb !== verb || existing.target !== target || existing.instruction !== instruction) {
          throw new HarveyControlError("WORK_ORDER_SUBMISSION_CONFLICT", 409);
        }
        return existing;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      await assertCapacity();
      await writeAtomic(file, workOrder);
      return workOrder;
    });
  });
}
