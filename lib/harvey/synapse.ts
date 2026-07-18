import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { HarveyControlError } from "./machine-control";

export const HARVEY_SYNAPSE_VERBS = ["VERIFY", "PREPARE", "GO", "KNOCK"] as const;
export type HarveySynapseVerb = (typeof HARVEY_SYNAPSE_VERBS)[number];
export type HarveySynapseSeat = "BEN" | "SWANSON_DOSS" | "DINK_SALLY";
export type HarveySynapseRoute = "DOSS_LOOPBACK" | "SALLY_PAIRED_SESSION";
export type HarveySynapseEntryKind = "INSTRUCTION" | "BEN_FOLLOWUP" | "PRESENTED" | "REPLY" | "BLOCKER";

export type HarveySynapseEntry = {
  sequence: number;
  entry_id: string;
  submission_id: string;
  kind: HarveySynapseEntryKind;
  author_seat: HarveySynapseSeat;
  body: string | null;
  body_sha256: string | null;
  reply_to: string | null;
  presented_entry_sha256: string | null;
  authenticated_route: "OPERATOR_INPUT" | HarveySynapseRoute;
  created_at: string;
  previous_entry_sha256: string | null;
  entry_sha256: string;
};

export type HarveySynapseWorkstream = {
  schema: "werkles.harvey-synapse/v1";
  synapse_id: string;
  verb: HarveySynapseVerb;
  subject: string;
  classification: "NON_SECRET_LAN_TRANSCRIPT_PILOT";
  created_at: string;
  updated_at: string;
  revision: number;
  participants: [
    { seat: "BEN"; role_claim: "Operator"; machine: null },
    { seat: "SWANSON_DOSS"; role_claim: "Swanson"; machine: "Doss" },
    { seat: "DINK_SALLY"; role_claim: "Dink"; machine: "Sally" }
  ];
  entries: HarveySynapseEntry[];
};

export type HarveySynapseSeatState = {
  seat: HarveySynapseSeat;
  role_claim: "Operator" | "Swanson" | "Dink";
  machine: "Doss" | "Sally" | null;
  state: "OPERATOR_MESSAGE_POSTED" | "ROUTE_UNBOUND" | "SESSION_PRESENTED_TASK_UNPROVEN" | "ROLE_REPLY_RECORDED" | "BLOCKER";
  last_entry_at: string | null;
};

export type HarveySynapseProjection = {
  schema: "werkles.harvey-synapse-projection/v1";
  generated_at: string;
  classification: "NON_SECRET_LAN_TRANSCRIPT_PILOT";
  truth_rule: "PAIRING_OR_PRESENTATION_DOES_NOT_PROVE_AEYE_TASK_RECEIPT";
  synapse: (HarveySynapseWorkstream & {
    seat_states: HarveySynapseSeatState[];
    aggregate_state: "WAITING_FOR_BOTH_ROLE_REPLIES" | "BOTH_ROLE_REPLIES_RECORDED" | "ROLE_BLOCKER_RECORDED";
  }) | null;
};

const SYNAPSE_ID = /^harvey_synapse_[a-f0-9]{32}$/;
const ENTRY_ID = /^harvey_synapse_entry_[a-f0-9]{32}$/;
const SUBMISSION_ID = /^[a-f0-9]{32}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const SUBJECT = /^[A-Za-z0-9][A-Za-z0-9 _&'()+.,:/?!-]{0,119}$/;
const MAX_BODY_BYTES = 1024;
const MAX_ENTRIES = 24;
const MAX_WORKSTREAMS = 32;
const LOCK_ATTEMPTS = 250;
const LOCK_STALE_MS = 30_000;
let writeQueue: Promise<unknown> = Promise.resolve();

const root = () => path.join(process.cwd(), "data", "harvey", "synapse");
const workstreamRoot = () => path.join(root(), "workstreams");
const currentFile = () => path.join(root(), "current.json");
const workstreamFile = (synapseId: string) => path.join(workstreamRoot(), `${synapseId}.json`);
const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function canonicalSha256(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");
}

function bodySha256(body: string) {
  return createHash("sha256").update(body, "utf8").digest("hex");
}

function normalizeSubmissionId(value: unknown) {
  const submissionId = String(value ?? "").toLowerCase();
  if (!SUBMISSION_ID.test(submissionId)) throw new HarveyControlError("SYNAPSE_SUBMISSION_ID_INVALID");
  return submissionId;
}

function normalizeSynapseId(value: unknown) {
  const synapseId = String(value ?? "").toLowerCase();
  if (!SYNAPSE_ID.test(synapseId)) throw new HarveyControlError("SYNAPSE_ID_INVALID");
  return synapseId;
}

function normalizeVerb(value: unknown): HarveySynapseVerb {
  const verb = String(value ?? "").toUpperCase();
  if (!HARVEY_SYNAPSE_VERBS.includes(verb as HarveySynapseVerb)) throw new HarveyControlError("SYNAPSE_VERB_INVALID");
  if (verb === "GO") throw new HarveyControlError("SYNAPSE_GO_REQUIRES_PROTECTED_TRANSPORT", 409);
  return verb as HarveySynapseVerb;
}

function normalizeSubject(value: unknown) {
  const subject = String(value ?? "").trim();
  if (!SUBJECT.test(subject)) throw new HarveyControlError("SYNAPSE_SUBJECT_INVALID");
  assertNoObviousSecret(subject);
  return subject;
}

function assertNoObviousSecret(body: string) {
  const patterns = [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
    /\b(?:gh[pousr]|github_pat)_[A-Za-z0-9_]{16,}\b/,
    /\bsk-[A-Za-z0-9_-]{20,}\b/,
    /\b(?:password|passcode|token|secret|recovery\s+(?:key|code))\s*[:=]\s*\S+/i
  ];
  if (patterns.some((pattern) => pattern.test(body))) throw new HarveyControlError("SYNAPSE_SECRET_SHAPE_REJECTED", 400);
}

function normalizeBody(value: unknown) {
  const body = String(value ?? "").trim();
  if (!body) throw new HarveyControlError("SYNAPSE_BODY_REQUIRED");
  if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) throw new HarveyControlError("SYNAPSE_BODY_TOO_LARGE", 413);
  assertNoObviousSecret(body);
  return body;
}

function normalizeEntryId(value: unknown, error = "SYNAPSE_REPLY_TO_INVALID") {
  const entryId = String(value ?? "").toLowerCase();
  if (!ENTRY_ID.test(entryId)) throw new HarveyControlError(error);
  return entryId;
}

function exactKeys(value: Record<string, unknown>, expected: string[], error: string) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) throw new HarveyControlError(error, 500);
}

function assertStoredSafeText(value: string, maxBytes: number) {
  if (Buffer.byteLength(value, "utf8") > maxBytes) throw new HarveyControlError("SYNAPSE_STORED_CONTENT_INVALID", 500);
  try { assertNoObviousSecret(value); }
  catch { throw new HarveyControlError("SYNAPSE_STORED_CONTENT_INVALID", 500); }
}

function entryHashPayload(entry: Omit<HarveySynapseEntry, "entry_sha256">) {
  return entry;
}

function buildEntry(input: {
  submissionId: string;
  kind: HarveySynapseEntryKind;
  authorSeat: HarveySynapseSeat;
  body: string | null;
  replyTo: string | null;
  presentedEntrySha256: string | null;
  authenticatedRoute: "OPERATOR_INPUT" | HarveySynapseRoute;
}, prior?: HarveySynapseEntry): HarveySynapseEntry {
  const withoutHash: Omit<HarveySynapseEntry, "entry_sha256"> = {
    sequence: (prior?.sequence ?? 0) + 1,
    entry_id: `harvey_synapse_entry_${input.submissionId}`,
    submission_id: input.submissionId,
    kind: input.kind,
    author_seat: input.authorSeat,
    body: input.body,
    body_sha256: input.body === null ? null : bodySha256(input.body),
    reply_to: input.replyTo,
    presented_entry_sha256: input.presentedEntrySha256,
    authenticated_route: input.authenticatedRoute,
    created_at: new Date().toISOString(),
    previous_entry_sha256: prior?.entry_sha256 ?? null
  };
  return { ...withoutHash, entry_sha256: canonicalSha256(entryHashPayload(withoutHash)) };
}

function participants(): HarveySynapseWorkstream["participants"] {
  return [
    { seat: "BEN", role_claim: "Operator", machine: null },
    { seat: "SWANSON_DOSS", role_claim: "Swanson", machine: "Doss" },
    { seat: "DINK_SALLY", role_claim: "Dink", machine: "Sally" }
  ];
}

async function ensureRoots() {
  await fs.mkdir(workstreamRoot(), { recursive: true });
}

async function writeJsonAtomic(file: string, value: unknown) {
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  try {
    for (let attempt = 0; ; attempt += 1) {
      try {
        await fs.rename(temporary, file);
        break;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (attempt >= 5 || !["EPERM", "EACCES", "EBUSY"].includes(code ?? "")) throw error;
        await wait(15 * (attempt + 1));
      }
    }
  }
  finally { await fs.unlink(temporary).catch(() => undefined); }
}

function queueWrite<T>(operation: () => Promise<T>) {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function withLock<T>(operation: () => Promise<T>) {
  await ensureRoots();
  const lock = path.join(root(), ".write.lock");
  for (let attempt = 0; attempt < LOCK_ATTEMPTS; attempt += 1) {
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
        if (Date.now() - (await fs.stat(lock)).mtimeMs > LOCK_STALE_MS) await fs.unlink(lock);
      } catch (statError) {
        if ((statError as NodeJS.ErrnoException).code !== "ENOENT") throw statError;
      }
      await wait(8 + (attempt % 7));
    }
  }
  throw new HarveyControlError("SYNAPSE_LOCK_TIMEOUT", 503);
}

function validateStoredEntry(value: unknown, index: number, previous: HarveySynapseEntry | undefined): HarveySynapseEntry {
  if (!value || Array.isArray(value) || typeof value !== "object") throw new HarveyControlError("SYNAPSE_STORED_ENTRY_INVALID", 500);
  const entry = value as Record<string, unknown>;
  exactKeys(entry, ["sequence", "entry_id", "submission_id", "kind", "author_seat", "body", "body_sha256", "reply_to", "presented_entry_sha256", "authenticated_route", "created_at", "previous_entry_sha256", "entry_sha256"], "SYNAPSE_STORED_ENTRY_FIELDS_INVALID");
  if (
    entry.sequence !== index + 1
    || !ENTRY_ID.test(String(entry.entry_id ?? ""))
    || !SUBMISSION_ID.test(String(entry.submission_id ?? ""))
    || entry.entry_id !== `harvey_synapse_entry_${entry.submission_id}`
    || !["INSTRUCTION", "BEN_FOLLOWUP", "PRESENTED", "REPLY", "BLOCKER"].includes(String(entry.kind))
    || !["BEN", "SWANSON_DOSS", "DINK_SALLY"].includes(String(entry.author_seat))
    || !["OPERATOR_INPUT", "DOSS_LOOPBACK", "SALLY_PAIRED_SESSION"].includes(String(entry.authenticated_route))
    || !Number.isFinite(Date.parse(String(entry.created_at ?? "")))
    || !SHA256.test(String(entry.entry_sha256 ?? ""))
  ) throw new HarveyControlError("SYNAPSE_STORED_ENTRY_INVALID", 500);
  const typed = entry as unknown as HarveySynapseEntry;
  const expectedPrevious = previous?.entry_sha256 ?? null;
  if (typed.previous_entry_sha256 !== expectedPrevious) throw new HarveyControlError("SYNAPSE_HASH_CHAIN_INVALID", 500);
  if (typed.body === null ? typed.body_sha256 !== null : typeof typed.body !== "string" || typed.body_sha256 !== bodySha256(typed.body)) {
    throw new HarveyControlError("SYNAPSE_BODY_HASH_INVALID", 500);
  }
  if (typed.body !== null) assertStoredSafeText(typed.body, MAX_BODY_BYTES);
  if (typed.reply_to !== null && !ENTRY_ID.test(typed.reply_to)) throw new HarveyControlError("SYNAPSE_STORED_REPLY_TO_INVALID", 500);
  if (typed.presented_entry_sha256 !== null && !SHA256.test(typed.presented_entry_sha256)) throw new HarveyControlError("SYNAPSE_STORED_PRESENTATION_INVALID", 500);
  const expectedRoute = typed.author_seat === "BEN" ? "OPERATOR_INPUT" : typed.author_seat === "SWANSON_DOSS" ? "DOSS_LOOPBACK" : "SALLY_PAIRED_SESSION";
  const semanticShapeValid = typed.authenticated_route === expectedRoute
    && (typed.kind === "INSTRUCTION"
      ? typed.author_seat === "BEN" && typed.body !== null && typed.reply_to === null && typed.presented_entry_sha256 === null
      : typed.kind === "BEN_FOLLOWUP"
        ? typed.author_seat === "BEN" && typed.body !== null && typed.reply_to !== null && typed.presented_entry_sha256 === null
      : typed.kind === "PRESENTED"
        ? typed.author_seat !== "BEN" && typed.body === null && typed.body_sha256 === null && typed.reply_to !== null && typed.presented_entry_sha256 !== null
        : typed.author_seat !== "BEN" && typed.body !== null && typed.reply_to !== null && typed.presented_entry_sha256 === null);
  if (!semanticShapeValid) throw new HarveyControlError("SYNAPSE_STORED_ENTRY_SEMANTICS_INVALID", 500);
  const { entry_sha256, ...withoutHash } = typed;
  if (canonicalSha256(entryHashPayload(withoutHash)) !== entry_sha256) throw new HarveyControlError("SYNAPSE_ENTRY_HASH_INVALID", 500);
  return typed;
}

function validateStoredWorkstream(value: unknown): HarveySynapseWorkstream {
  if (!value || Array.isArray(value) || typeof value !== "object") throw new HarveyControlError("SYNAPSE_STORED_WORKSTREAM_INVALID", 500);
  const workstream = value as Record<string, unknown>;
  exactKeys(workstream, ["schema", "synapse_id", "verb", "subject", "classification", "created_at", "updated_at", "revision", "participants", "entries"], "SYNAPSE_STORED_WORKSTREAM_FIELDS_INVALID");
  if (
    workstream.schema !== "werkles.harvey-synapse/v1"
    || !SYNAPSE_ID.test(String(workstream.synapse_id ?? ""))
    || !HARVEY_SYNAPSE_VERBS.includes(workstream.verb as HarveySynapseVerb)
    || workstream.verb === "GO"
    || !SUBJECT.test(String(workstream.subject ?? ""))
    || workstream.classification !== "NON_SECRET_LAN_TRANSCRIPT_PILOT"
    || !Number.isFinite(Date.parse(String(workstream.created_at ?? "")))
    || !Number.isFinite(Date.parse(String(workstream.updated_at ?? "")))
    || !Number.isSafeInteger(workstream.revision)
    || Number(workstream.revision) < 1
    || !Array.isArray(workstream.entries)
    || workstream.entries.length < 1
    || workstream.entries.length > MAX_ENTRIES
    || canonicalSha256(workstream.participants) !== canonicalSha256(participants())
  ) throw new HarveyControlError("SYNAPSE_STORED_WORKSTREAM_INVALID", 500);
  assertStoredSafeText(String(workstream.subject), 120);
  let previous: HarveySynapseEntry | undefined;
  const entries = workstream.entries.map((entry, index) => {
    const validated = validateStoredEntry(entry, index, previous);
    previous = validated;
    return validated;
  });
  if (entries[0]?.kind !== "INSTRUCTION" || entries[0]?.author_seat !== "BEN" || entries[0]?.reply_to !== null) throw new HarveyControlError("SYNAPSE_STORED_FIRST_ENTRY_INVALID", 500);
  if (new Set(entries.map((entry) => entry.submission_id)).size !== entries.length) throw new HarveyControlError("SYNAPSE_STORED_SUBMISSION_DUPLICATE", 500);
  entries.forEach((entry, index) => {
    if (entry.reply_to === null) return;
    const targetIndex = entries.findIndex((candidate) => candidate.entry_id === entry.reply_to);
    if (targetIndex < 0 || targetIndex >= index) throw new HarveyControlError("SYNAPSE_STORED_REPLY_TARGET_INVALID", 500);
    const target = entries[targetIndex];
    if (entry.kind === "BEN_FOLLOWUP" && (target.author_seat !== "BEN" || !["INSTRUCTION", "BEN_FOLLOWUP"].includes(target.kind))) {
      throw new HarveyControlError("SYNAPSE_STORED_FOLLOWUP_BINDING_INVALID", 500);
    }
    if (entry.kind === "PRESENTED") {
      if (!["INSTRUCTION", "BEN_FOLLOWUP"].includes(target.kind) || target.author_seat !== "BEN" || entry.presented_entry_sha256 !== target.entry_sha256) {
        throw new HarveyControlError("SYNAPSE_STORED_PRESENTATION_BINDING_INVALID", 500);
      }
    }
    if (entry.kind === "REPLY" || entry.kind === "BLOCKER") {
      if (!["INSTRUCTION", "BEN_FOLLOWUP"].includes(target.kind) || target.author_seat !== "BEN") {
        throw new HarveyControlError("SYNAPSE_STORED_REPLY_BINDING_INVALID", 500);
      }
    }
  });
  const presentationKeys = entries
    .filter((entry) => entry.kind === "PRESENTED")
    .map((entry) => `${entry.author_seat}:${entry.reply_to}`);
  if (new Set(presentationKeys).size !== presentationKeys.length) throw new HarveyControlError("SYNAPSE_STORED_PRESENTATION_DUPLICATE", 500);
  if (workstream.revision !== entries.length || workstream.updated_at !== entries.at(-1)?.created_at) throw new HarveyControlError("SYNAPSE_STORED_REVISION_INVALID", 500);
  return { ...(workstream as unknown as HarveySynapseWorkstream), entries };
}

async function readWorkstream(synapseId: string) {
  const raw = JSON.parse(await fs.readFile(workstreamFile(synapseId), "utf8"));
  const validated = validateStoredWorkstream(raw);
  if (validated.synapse_id !== synapseId) throw new HarveyControlError("SYNAPSE_STORED_ID_MISMATCH", 500);
  return validated;
}

async function readCurrentId() {
  try {
    const pointer = JSON.parse(await fs.readFile(currentFile(), "utf8")) as Record<string, unknown>;
    exactKeys(pointer, ["schema", "synapse_id"], "SYNAPSE_CURRENT_POINTER_FIELDS_INVALID");
    if (pointer.schema !== "werkles.harvey-synapse-pointer/v1" || !SYNAPSE_ID.test(String(pointer.synapse_id ?? ""))) throw new HarveyControlError("SYNAPSE_CURRENT_POINTER_INVALID", 500);
    return String(pointer.synapse_id);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function existingEntry(workstream: HarveySynapseWorkstream, submissionId: string) {
  return workstream.entries.find((entry) => entry.submission_id === submissionId);
}

function assertIdempotentEntry(existing: HarveySynapseEntry, candidate: Omit<HarveySynapseEntry, "sequence" | "created_at" | "previous_entry_sha256" | "entry_sha256">) {
  if (
    existing.entry_id !== candidate.entry_id
    || existing.kind !== candidate.kind
    || existing.author_seat !== candidate.author_seat
    || existing.body !== candidate.body
    || existing.body_sha256 !== candidate.body_sha256
    || existing.reply_to !== candidate.reply_to
    || existing.presented_entry_sha256 !== candidate.presented_entry_sha256
    || existing.authenticated_route !== candidate.authenticated_route
  ) throw new HarveyControlError("SYNAPSE_SUBMISSION_CONFLICT", 409);
}

async function appendEntry(workstream: HarveySynapseWorkstream, entry: HarveySynapseEntry) {
  if (workstream.entries.length >= MAX_ENTRIES) throw new HarveyControlError("SYNAPSE_ENTRY_CAPACITY_EXCEEDED", 429);
  const updated: HarveySynapseWorkstream = {
    ...workstream,
    updated_at: entry.created_at,
    revision: workstream.revision + 1,
    entries: [...workstream.entries, entry]
  };
  validateStoredWorkstream(updated);
  await writeJsonAtomic(workstreamFile(workstream.synapse_id), updated);
  return updated;
}

export function synapseSeatForRoute(route: HarveySynapseRoute): Exclude<HarveySynapseSeat, "BEN"> {
  return route === "DOSS_LOOPBACK" ? "SWANSON_DOSS" : "DINK_SALLY";
}

export async function createHarveySynapse(input: Record<string, unknown>, route: HarveySynapseRoute) {
  const submissionId = normalizeSubmissionId(input.submission_id);
  const verb = normalizeVerb(input.verb);
  const subject = normalizeSubject(input.subject);
  const body = normalizeBody(input.body);
  const synapseId = `harvey_synapse_${submissionId}`;
  return queueWrite(() => withLock(async () => {
    const currentId = await readCurrentId();
    if (currentId && currentId !== synapseId) throw new HarveyControlError("SYNAPSE_ALREADY_ACTIVE", 409);
    const file = workstreamFile(synapseId);
    try {
      const existing = await readWorkstream(synapseId);
      const initial = existing.entries[0];
      if (existing.verb !== verb || existing.subject !== subject || initial.body !== body || initial.kind !== "INSTRUCTION" || initial.author_seat !== "BEN") {
        throw new HarveyControlError("SYNAPSE_SUBMISSION_CONFLICT", 409);
      }
      if (currentId === null) await writeJsonAtomic(currentFile(), { schema: "werkles.harvey-synapse-pointer/v1", synapse_id: synapseId });
      return existing;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const files = (await fs.readdir(workstreamRoot(), { withFileTypes: true })).filter((entry) => entry.isFile() && /^harvey_synapse_[a-f0-9]{32}\.json$/.test(entry.name));
    if (files.length >= MAX_WORKSTREAMS) throw new HarveyControlError("SYNAPSE_WORKSTREAM_CAPACITY_EXCEEDED", 429);
    const first = buildEntry({ submissionId, kind: "INSTRUCTION", authorSeat: "BEN", body, replyTo: null, presentedEntrySha256: null, authenticatedRoute: "OPERATOR_INPUT" });
    const workstream: HarveySynapseWorkstream = {
      schema: "werkles.harvey-synapse/v1",
      synapse_id: synapseId,
      verb,
      subject,
      classification: "NON_SECRET_LAN_TRANSCRIPT_PILOT",
      created_at: first.created_at,
      updated_at: first.created_at,
      revision: 1,
      participants: participants(),
      entries: [first]
    };
    validateStoredWorkstream(workstream);
    await writeJsonAtomic(file, workstream);
    await writeJsonAtomic(currentFile(), { schema: "werkles.harvey-synapse-pointer/v1", synapse_id: synapseId });
    return workstream;
  }));
}

export async function appendHarveySynapseBenFollowup(input: Record<string, unknown>, route: HarveySynapseRoute) {
  const synapseId = normalizeSynapseId(input.synapse_id);
  const submissionId = normalizeSubmissionId(input.submission_id);
  const body = normalizeBody(input.body);
  return queueWrite(() => withLock(async () => {
    const workstream = await readWorkstream(synapseId);
    const existing = existingEntry(workstream, submissionId);
    if (existing) {
      assertIdempotentEntry(existing, {
        entry_id: `harvey_synapse_entry_${submissionId}`,
        submission_id: submissionId,
        kind: "BEN_FOLLOWUP",
        author_seat: "BEN",
        body,
        body_sha256: bodySha256(body),
        reply_to: existing.reply_to,
        presented_entry_sha256: null,
        authenticated_route: "OPERATOR_INPUT"
      });
      return workstream;
    }
    const prior = workstream.entries.at(-1);
    const currentOperatorEntry = [...workstream.entries].reverse().find((entry) => entry.author_seat === "BEN" && ["INSTRUCTION", "BEN_FOLLOWUP"].includes(entry.kind));
    if (!currentOperatorEntry) throw new HarveyControlError("SYNAPSE_OPERATOR_ENTRY_MISSING", 500);
    const entry = buildEntry({ submissionId, kind: "BEN_FOLLOWUP", authorSeat: "BEN", body, replyTo: currentOperatorEntry.entry_id, presentedEntrySha256: null, authenticatedRoute: "OPERATOR_INPUT" }, prior);
    return appendEntry(workstream, entry);
  }));
}

export async function recordHarveySynapsePresentation(input: Record<string, unknown>, route: HarveySynapseRoute) {
  const synapseId = normalizeSynapseId(input.synapse_id);
  const submissionId = normalizeSubmissionId(input.submission_id);
  const replyTo = normalizeEntryId(input.reply_to, "SYNAPSE_PRESENTED_ENTRY_INVALID");
  const presentedEntrySha256 = String(input.presented_entry_sha256 ?? "").toLowerCase();
  if (!SHA256.test(presentedEntrySha256)) throw new HarveyControlError("SYNAPSE_PRESENTED_HASH_INVALID");
  const authorSeat = synapseSeatForRoute(route);
  return queueWrite(() => withLock(async () => {
    const workstream = await readWorkstream(synapseId);
    const existing = existingEntry(workstream, submissionId);
    if (existing) {
      assertIdempotentEntry(existing, {
        entry_id: `harvey_synapse_entry_${submissionId}`,
        submission_id: submissionId,
        kind: "PRESENTED",
        author_seat: authorSeat,
        body: null,
        body_sha256: null,
        reply_to: replyTo,
        presented_entry_sha256: presentedEntrySha256,
        authenticated_route: route
      });
      return workstream;
    }
    const presented = workstream.entries.find((entry) => entry.entry_id === replyTo);
    const currentOperatorEntry = [...workstream.entries].reverse().find((entry) => entry.author_seat === "BEN" && ["INSTRUCTION", "BEN_FOLLOWUP"].includes(entry.kind));
    if (!presented || currentOperatorEntry?.entry_id !== presented.entry_id || presented.entry_sha256 !== presentedEntrySha256 || !["INSTRUCTION", "BEN_FOLLOWUP"].includes(presented.kind)) {
      throw new HarveyControlError("SYNAPSE_PRESENTED_ENTRY_MISMATCH", 409);
    }
    const priorPresentation = workstream.entries.find((entry) => entry.kind === "PRESENTED" && entry.author_seat === authorSeat && entry.reply_to === replyTo);
    if (priorPresentation) return workstream;
    const prior = workstream.entries.at(-1);
    const entry = buildEntry({ submissionId, kind: "PRESENTED", authorSeat, body: null, replyTo, presentedEntrySha256, authenticatedRoute: route }, prior);
    return appendEntry(workstream, entry);
  }));
}

export async function appendHarveySynapseRoleReply(input: Record<string, unknown>, route: HarveySynapseRoute) {
  const synapseId = normalizeSynapseId(input.synapse_id);
  const submissionId = normalizeSubmissionId(input.submission_id);
  const replyTo = normalizeEntryId(input.reply_to);
  const body = normalizeBody(input.body);
  const requestedKind = String(input.kind ?? "REPLY").toUpperCase();
  if (!['REPLY', 'BLOCKER'].includes(requestedKind)) throw new HarveyControlError("SYNAPSE_REPLY_KIND_INVALID");
  const kind = requestedKind as "REPLY" | "BLOCKER";
  const authorSeat = synapseSeatForRoute(route);
  return queueWrite(() => withLock(async () => {
    const workstream = await readWorkstream(synapseId);
    const existing = existingEntry(workstream, submissionId);
    if (existing) {
      assertIdempotentEntry(existing, {
        entry_id: `harvey_synapse_entry_${submissionId}`,
        submission_id: submissionId,
        kind,
        author_seat: authorSeat,
        body,
        body_sha256: bodySha256(body),
        reply_to: replyTo,
        presented_entry_sha256: null,
        authenticated_route: route
      });
      return workstream;
    }
    const currentOperatorEntry = [...workstream.entries].reverse().find((entry) => entry.author_seat === "BEN" && ["INSTRUCTION", "BEN_FOLLOWUP"].includes(entry.kind));
    if (!currentOperatorEntry || currentOperatorEntry.entry_id !== replyTo) throw new HarveyControlError("SYNAPSE_REPLY_TARGET_NOT_CURRENT", 409);
    const prior = workstream.entries.at(-1);
    const entry = buildEntry({ submissionId, kind, authorSeat, body, replyTo, presentedEntrySha256: null, authenticatedRoute: route }, prior);
    return appendEntry(workstream, entry);
  }));
}

function seatState(workstream: HarveySynapseWorkstream, seat: HarveySynapseSeat): HarveySynapseSeatState {
  const participant = workstream.participants.find((candidate) => candidate.seat === seat)!;
  if (seat === "BEN") {
    const last = [...workstream.entries].reverse().find((entry) => entry.author_seat === "BEN");
    return { ...participant, state: "OPERATOR_MESSAGE_POSTED", last_entry_at: last?.created_at ?? null };
  }
  const currentOperatorEntry = [...workstream.entries].reverse().find((entry) => entry.author_seat === "BEN" && ["INSTRUCTION", "BEN_FOLLOWUP"].includes(entry.kind));
  const entries = workstream.entries.filter((entry) => entry.author_seat === seat && entry.reply_to === currentOperatorEntry?.entry_id);
  const last = entries.at(-1);
  const outcome = [...entries].reverse().find((entry) => entry.kind === "REPLY" || entry.kind === "BLOCKER");
  const presented = [...entries].reverse().find((entry) => entry.kind === "PRESENTED");
  return {
    ...participant,
    state: outcome?.kind === "BLOCKER" ? "BLOCKER" : outcome?.kind === "REPLY" ? "ROLE_REPLY_RECORDED" : presented ? "SESSION_PRESENTED_TASK_UNPROVEN" : "ROUTE_UNBOUND",
    last_entry_at: (outcome ?? presented ?? last)?.created_at ?? null
  };
}

export async function readHarveySynapseProjection(): Promise<HarveySynapseProjection> {
  await ensureRoots();
  const currentId = await readCurrentId();
  const workstream = currentId ? await readWorkstream(currentId) : null;
  if (!workstream) return {
    schema: "werkles.harvey-synapse-projection/v1",
    generated_at: new Date().toISOString(),
    classification: "NON_SECRET_LAN_TRANSCRIPT_PILOT",
    truth_rule: "PAIRING_OR_PRESENTATION_DOES_NOT_PROVE_AEYE_TASK_RECEIPT",
    synapse: null
  };
  const seatStates = workstream.participants.map((participant) => seatState(workstream, participant.seat));
  const aeyeStates = seatStates.filter((seat) => seat.seat !== "BEN");
  return {
    schema: "werkles.harvey-synapse-projection/v1",
    generated_at: new Date().toISOString(),
    classification: "NON_SECRET_LAN_TRANSCRIPT_PILOT",
    truth_rule: "PAIRING_OR_PRESENTATION_DOES_NOT_PROVE_AEYE_TASK_RECEIPT",
    synapse: {
      ...workstream,
      seat_states: seatStates,
      aggregate_state: aeyeStates.some((seat) => seat.state === "BLOCKER")
        ? "ROLE_BLOCKER_RECORDED"
        : aeyeStates.every((seat) => seat.state === "ROLE_REPLY_RECORDED")
          ? "BOTH_ROLE_REPLIES_RECORDED"
          : "WAITING_FOR_BOTH_ROLE_REPLIES"
    }
  };
}
