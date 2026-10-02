import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { types } from "node:util";
import { canonicalJson } from "./station-crypto-core.mjs";
import { snapshotAeyemnesiaSourceInput as snapshotAdminInput } from "./aeyemnesia-authorized-source-reader.mjs";
import { evaluatePookaAdminCanonicalClaim } from "./pooka-admin-canonical-claim-predicate.mjs";

import {
  admitGimpireWorkTransition,
  validateGimpireWorkState,
  type GimpireTransitionProposal,
  type GimpireWorkState
} from "./gimpire-active-work-governor.ts";
import { verifyGimpireSignedTerminalProof } from "./gimpire-transport-verifier.ts";
import {
  PookaKindAuthorityGateMemory,
  type PookaKindOperatorGateReceipt
} from "./authority-gate-memory.ts";
import { claimGimpireActionOnce } from "./gimpire-action-attempt-store.ts";
import { GimpireOperatorAuthorityTrustRoot } from "./gimpire-authority-admission.ts";

const ID = /^[a-z0-9][a-z0-9-]{2,127}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const MAX_TRANSITIONS = 512;

type StoredTransition = {
  proposal_sha256: string;
  proposal: GimpireTransitionProposal;
  state_sha256: string;
  state: GimpireWorkState;
};

export type GimpireActiveWorkLedger = {
  schema: "werkles.gimpire-active-work-ledger/v1";
  project_id: string;
  work_object_id: string;
  initial_state_sha256: string;
  initial_state: GimpireWorkState;
  revision: number;
  transitions: StoredTransition[];
};

export type GimpireOperatorResumeClaim = {
  schema: "werkles.gimpire-operator-resume-claim/v1";
  project_id: string;
  work_object_id: string;
  work_id: string;
  paused_revision: number;
  pause_directive_id: string;
  pause_evidence_sha256: string;
  proposal_sha256: string;
};


function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function hashGimpireCustody(value: unknown) {
  return createHash("sha256").update(canonical(value), "utf8").digest("hex");
}

function canonicalObject(value: unknown, keys: readonly string[], code: string) {
  if (typeof value !== "string") throw new Error(code);
  let parsed: unknown;
  try { parsed = JSON.parse(value); }
  catch { throw new Error(code); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)
    || !exact(parsed as Record<string, unknown>, keys) || JSON.stringify(parsed) !== value) throw new Error(code);
  return parsed as Record<string, unknown>;
}

function exact(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function location(root: string, projectId: string, workObjectId: string) {
  if (!ID.test(projectId) || !ID.test(workObjectId)) throw new Error("GIMPIRE_LEDGER_ID_INVALID");
  const base = path.resolve(root);
  const directory = path.resolve(base, projectId);
  if (!directory.toLowerCase().startsWith(`${base}${path.sep}`.toLowerCase())) throw new Error("GIMPIRE_LEDGER_BOUNDARY_INVALID");
  return {
    directory,
    file: path.join(directory, `${workObjectId}.json`),
    lock: path.join(directory, `${workObjectId}.lock`)
  };
}

function validateProposal(value: unknown): GimpireTransitionProposal {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || !exact(value as Record<string, unknown>, ["expected_revision", "evidence_class", "event_sha256", "next"])) {
    throw new Error("GIMPIRE_LEDGER_PROPOSAL_INVALID");
  }
  const proposal = value as GimpireTransitionProposal;
  if (!Number.isSafeInteger(proposal.expected_revision) || !SHA256.test(proposal.event_sha256)) {
    throw new Error("GIMPIRE_LEDGER_PROPOSAL_INVALID");
  }
  return proposal;
}

export function validateGimpireActiveWorkLedger(value: unknown): GimpireActiveWorkLedger {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || !exact(value as Record<string, unknown>, [
      "schema", "project_id", "work_object_id", "initial_state_sha256", "initial_state", "revision", "transitions"
    ])) throw new Error("GIMPIRE_LEDGER_INVALID");
  const ledger = value as GimpireActiveWorkLedger;
  if (ledger.schema !== "werkles.gimpire-active-work-ledger/v1"
    || !ID.test(ledger.project_id) || !ID.test(ledger.work_object_id)
    || !SHA256.test(ledger.initial_state_sha256)
    || !Number.isSafeInteger(ledger.revision) || ledger.revision < 0
    || !Array.isArray(ledger.transitions) || ledger.transitions.length !== ledger.revision
    || ledger.transitions.length > MAX_TRANSITIONS) throw new Error("GIMPIRE_LEDGER_INVALID");

  let current = validateGimpireWorkState(ledger.initial_state);
  if (current.revision !== 0 || current.project_id !== ledger.project_id
    || current.work_object_id !== ledger.work_object_id
    || hashGimpireCustody(current) !== ledger.initial_state_sha256) throw new Error("GIMPIRE_LEDGER_INITIAL_STATE_INVALID");
  const eventHashes = new Set<string>();
  for (const raw of ledger.transitions) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)
      || !exact(raw as unknown as Record<string, unknown>, ["proposal_sha256", "proposal", "state_sha256", "state"])) {
      throw new Error("GIMPIRE_LEDGER_TRANSITION_INVALID");
    }
    const proposal = validateProposal(raw.proposal);
    if (!SHA256.test(raw.proposal_sha256) || raw.proposal_sha256 !== hashGimpireCustody(proposal)
      || eventHashes.has(proposal.event_sha256)) throw new Error("GIMPIRE_LEDGER_TRANSITION_INVALID");
    const admitted = admitGimpireWorkTransition(current, proposal);
    const stored = validateGimpireWorkState(raw.state);
    if (!SHA256.test(raw.state_sha256) || raw.state_sha256 !== hashGimpireCustody(stored)
      || canonical(stored) !== canonical(admitted)) throw new Error("GIMPIRE_LEDGER_TRANSITION_INVALID");
    eventHashes.add(proposal.event_sha256);
    current = stored;
  }
  if (current.revision !== ledger.revision) throw new Error("GIMPIRE_LEDGER_REVISION_INVALID");
  return ledger;
}

function initialLedger(stateValue: unknown): GimpireActiveWorkLedger {
  const state = validateGimpireWorkState(stateValue);
  if (state.revision !== 0 || state.last_event_sha256 !== null || state.continuity.predecessor_revision !== null) {
    throw new Error("GIMPIRE_LEDGER_INITIAL_STATE_INVALID");
  }
  return validateGimpireActiveWorkLedger({
    schema: "werkles.gimpire-active-work-ledger/v1",
    project_id: state.project_id,
    work_object_id: state.work_object_id,
    initial_state_sha256: hashGimpireCustody(state),
    initial_state: state,
    revision: 0,
    transitions: []
  });
}

async function readExisting(file: string) {
  return validateGimpireActiveWorkLedger(JSON.parse(await fs.readFile(file, "utf8")));
}

async function replaceAtomically(file: string, value: GimpireActiveWorkLedger) {
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    await fs.rename(temporary, file);
  } finally {
    await fs.rm(temporary, { force: true }).catch(() => undefined);
  }
}

async function withLock<T>(lock: string, action: () => Promise<T>) {
  try { await fs.mkdir(lock); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new Error("GIMPIRE_LEDGER_BUSY");
    throw error;
  }
  try { return await action(); }
  finally { await fs.rm(lock, { recursive: true, force: true }); }
}

export async function createGimpireActiveWorkLedger(input: { root: string; initial_state: unknown }) {
  const next = initialLedger(input.initial_state);
  const target = location(input.root, next.project_id, next.work_object_id);
  await fs.mkdir(target.directory, { recursive: true });
  return withLock(target.lock, async () => {
    try {
      const existing = await readExisting(target.file);
      if (canonical(existing) === canonical(next)) return Object.freeze({ ledger: existing, created: false as const });
      throw new Error("GIMPIRE_LEDGER_ALREADY_EXISTS");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    await replaceAtomically(target.file, next);
    return Object.freeze({ ledger: next, created: true as const });
  });
}

export async function readGimpireActiveWorkLedger(input: { root: string; project_id: string; work_object_id: string }) {
  return readExisting(location(input.root, input.project_id, input.work_object_id).file);
}

export async function claimGimpireActionAgainstCurrentWorkOnce(input: {
  work_root: string;
  attempt_root: string;
  project_id: string;
  work_object_id: string;
  expected_work_revision: number;
  action_id: string;
  action_sha256: string;
  claimed_at: string;
}) {
  const target = location(input.work_root, input.project_id, input.work_object_id);
  return withLock(target.lock, async () => {
    const ledger = await readExisting(target.file);
    const current = ledger.transitions.at(-1)?.state ?? ledger.initial_state;
    if (current.revision !== input.expected_work_revision) throw new Error("GIMPIRE_ACTION_WORK_REVISION_CHANGED");
    if (!["ACTIVE", "WAITING_FOR_RECEIVER", "WAITING_FOR_EXTERNAL_EVENT"].includes(current.status)) {
      throw new Error("GIMPIRE_ACTION_WORK_NO_LONGER_EXECUTABLE");
    }
    return claimGimpireActionOnce({
      root: input.attempt_root,
      project_id: input.project_id,
      work_object_id: input.work_object_id,
      expected_work_revision: input.expected_work_revision,
      action_id: input.action_id,
      action_sha256: input.action_sha256,
      claimed_at: input.claimed_at
    });
  });
}

/** Backend-only admin admission. Uses the SAME lock as canonical work writers.
 * Registration requires a signature-verified binding from the mission backend;
 * this store never establishes Operator authority or verifies a signature.
 * Revocation wins if committed before reservation. Reservation wins otherwise;
 * revocation does not cancel reserved/in-flight effects. No execution is done
 * here. Root custody, fsync/power-loss and effect verification remain separate.
 */
export function createGimpireAdminAdmissionStore(configuration: {
  work_root: string; attempt_root: string; project_id: string; work_object_id: string; now: () => number;
}) {
  return buildAdminAdmissionStore(configuration,false);
}
export function createGimpirePreappAdmissionStore(configuration: {
  work_root: string; attempt_root: string; project_id: string; work_object_id: string; now: () => number;
}) {
  return buildAdminAdmissionStore(configuration,true);
}
function buildAdminAdmissionStore(configuration: {
  work_root: string; attempt_root: string; project_id: string; work_object_id: string; now: () => number;
}, preapp: boolean) {
  if (!configuration || types.isProxy(configuration) || Object.getPrototypeOf(configuration) !== Object.prototype) throw Error("ADMIN_ADMISSION_CONFIG_INVALID");
  const descriptors = Object.getOwnPropertyDescriptors(configuration);
  if (Reflect.ownKeys(descriptors).some(k => typeof k !== "string")
    || !exact(descriptors, ["work_root", "attempt_root", "project_id", "work_object_id", "now"])
    || Object.values(descriptors).some(d => !d.enumerable || !Object.hasOwn(d, "value"))) throw Error("ADMIN_ADMISSION_CONFIG_INVALID");
  const c = Object.fromEntries(Object.entries(descriptors).map(([k,d]) => [k,d.value])) as typeof configuration;
  if (![c.work_root,c.attempt_root].every(p => typeof p === "string" && path.isAbsolute(p))
    || typeof c.now !== "function" || types.isProxy(c.now)) throw Error("ADMIN_ADMISSION_CONFIG_INVALID");
  const target = location(c.work_root,c.project_id,c.work_object_id);
  const digest = (v: unknown) => createHash("sha256").update(canonicalJson(v)).digest("hex");
  function identity(b: any) {
    if (!b || !b.action || ![b.operator_key_sha256,b.mission_id,b.host,b.receiver_ref,b.action.action_id].every(v=>typeof v==="string")
      || !Number.isSafeInteger(b.revision)) throw Error("ADMIN_ADMISSION_BINDING_INVALID");
    return digest({operator_key_sha256:b.operator_key_sha256,mission_id:b.mission_id,revision:b.revision,host:b.host,receiver_ref:b.receiver_ref,action_id:b.action.action_id});
  }
  const fileFor = (b: any) => path.join(target.directory,`${c.work_object_id}.admin-${identity(b)}.json`);
  const handoffFile = (h: string) => {
    if (!/^[a-f0-9]{64}$/.test(h)) throw Error("PREAPP_HANDOFF_DIGEST_INVALID");
    return path.join(target.directory,`${c.work_object_id}.preapp-${h}.json`);
  };
  async function readHandoffStatus(h: string) {
    const record=snapshotAdminInput(JSON.parse(await fs.readFile(handoffFile(h),"utf8")));
    if (!exact(record,["handoff_sha256","status"]) || record.handoff_sha256!==h
      || !["OPEN","REVOKED"].includes(record.status)) throw Error("PREAPP_HANDOFF_STATUS_INVALID");
    return record;
  }
  async function current() {
    const ledger=await readExisting(target.file);
    const state=ledger.transitions.at(-1)?.state ?? ledger.initial_state;
    return {project_id:state.project_id,work_object_id:state.work_object_id,revision:state.revision,status:state.status};
  }
  async function readRecord(file: string) {
    const r=snapshotAdminInput(JSON.parse(await fs.readFile(file,"utf8")));
    if (!exact(r,["binding","mapping","mission_state",...(preapp?["handoff","handoff_sha256"]:[])])) throw Error("ADMIN_ADMISSION_RECORD_INVALID");
    if (preapp && digest(r.handoff)!==r.handoff_sha256) throw Error("PREAPP_HANDOFF_RECORD_INVALID");
    return r;
  }
  async function save(file: string,value: unknown) {
    const temporary=`${file}.${process.pid}.${randomUUID()}.tmp`;
    try {await fs.writeFile(temporary,JSON.stringify(value)+"\n",{flag:"wx"});await fs.rename(temporary,file);}
    finally {await fs.rm(temporary,{force:true}).catch(()=>undefined);}
  }
  return Object.freeze({
    async registerVerifiedBindingOnce(raw: unknown) {
      const request=snapshotAdminInput(raw);
      if (!exact(request,["binding","expected_work_revision",...(preapp?["handoff"]:[])])) throw Error("ADMIN_ADMISSION_REQUEST_INVALID");
      const b=request.binding,file=fileFor(b);
      if (preapp && (request.handoff?.schema!=="werkles.pooka-preordained-mission-handoff/v1"
        || request.handoff.project_id!==c.project_id || request.handoff.work_object_id!==c.work_object_id
        || request.handoff.work_revision!==request.expected_work_revision
        || digest(request.handoff.grant)!==b.grant_sha256
        || !request.handoff.grant.actions.some((a:any)=>canonicalJson(a)===canonicalJson(b.action)))) throw Error("PREAPP_HANDOFF_BINDING_CONFLICT");
      return withLock(target.lock,async()=>{
        const mapping={binding_sha256:digest(b),project_id:c.project_id,work_object_id:c.work_object_id,expected_work_revision:request.expected_work_revision};
        const mission_state={mission_id:b.mission_id,revision:b.revision,status:"OPEN",binding_sha256:mapping.binding_sha256,project_id:c.project_id,work_object_id:c.work_object_id,work_revision:request.expected_work_revision};
        evaluatePookaAdminCanonicalClaim({binding:b,mapping,mission_state,work_state:await current(),now_ms:c.now()});
        if(preapp) {
          const h=digest(request.handoff);
          try {if((await readHandoffStatus(h)).status!=="OPEN")throw Error("PREAPP_HANDOFF_REVOKED");}
          catch(error){
            if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;
            // Absence is not proof of first registration. Any surviving action
            // for this handoff means status custody was lost; never recreate OPEN.
            const names=await fs.readdir(target.directory);
            for(const name of names.filter(n=>n.startsWith(`${c.work_object_id}.admin-`) && n.endsWith(".json"))) {
              const prior=snapshotAdminInput(JSON.parse(await fs.readFile(path.join(target.directory,name),"utf8")));
              if(prior.handoff_sha256===h)throw Error("PREAPP_HANDOFF_STATUS_CUSTODY_LOST");
            }
            await save(handoffFile(h),{handoff_sha256:h,status:"OPEN"});
          }
        }
        try {
          const existing=await readRecord(file);
          if (digest(existing.binding)!==digest(b) || canonicalJson(existing.mapping)!==canonicalJson(mapping)) throw Error("ADMIN_ADMISSION_IMMUTABLE_BINDING_CONFLICT");
          if (preapp && existing.handoff_sha256!==digest(request.handoff)) throw Error("PREAPP_HANDOFF_IMMUTABLE_CONFLICT");
          if (existing.mission_state.status!=="OPEN") throw Error("ADMIN_ADMISSION_REVOKED");
          return Object.freeze({state:"EXACT_REGISTRATION_REPLAY"});
        } catch(error) {if ((error as NodeJS.ErrnoException).code!=="ENOENT") throw error;}
        await save(file,{binding:b,mapping,mission_state,...(preapp?{handoff:request.handoff,handoff_sha256:digest(request.handoff)}:{})});
        return Object.freeze({state:"REGISTERED_NOT_EXECUTED"});
      });
    },
    async revokeVerifiedBindingOnce(raw: unknown) {
      const request=snapshotAdminInput(raw);
      if(preapp && !exact(request,["binding","handoff_sha256"])) throw Error("PREAPP_HANDOFF_REQUIRED");
      const b=preapp?request.binding:request,file=fileFor(b);
      return withLock(target.lock,async()=>{
        const record=await readRecord(file);
        if(preapp && record.handoff_sha256!==request.handoff_sha256) throw Error("PREAPP_HANDOFF_IMMUTABLE_CONFLICT");
        if (digest(record.binding)!==digest(b)) throw Error("ADMIN_ADMISSION_IMMUTABLE_BINDING_CONFLICT");
        if(preapp) {
          const status=await readHandoffStatus(record.handoff_sha256);
          await save(handoffFile(record.handoff_sha256),{...status,status:"REVOKED"});
          return Object.freeze({state:"REVOKED",scope:"COMPLETE_HANDOFF",in_flight_cancellation_proved:false});
        }
        await save(file,{...record,mission_state:{...record.mission_state,status:"REVOKED"}});
        return Object.freeze({state:"REVOKED",in_flight_cancellation_proved:false});
      });
    },
    async claimVerifiedActionOnce(raw: unknown) {
      const request=snapshotAdminInput(raw);
      if(preapp && !exact(request,["binding","handoff_sha256"])) throw Error("PREAPP_HANDOFF_REQUIRED");
      const b=preapp?request.binding:request,file=fileFor(b);
      return withLock(target.lock,async()=>{
        const record=await readRecord(file);
        if(preapp && record.handoff_sha256!==request.handoff_sha256) throw Error("PREAPP_HANDOFF_IMMUTABLE_CONFLICT");
        if(preapp && (await readHandoffStatus(record.handoff_sha256)).status!=="OPEN")throw Error("PREAPP_HANDOFF_REVOKED");
        if (digest(record.binding)!==digest(b)) throw Error("ADMIN_ADMISSION_IMMUTABLE_BINDING_CONFLICT");
        const work_state=await current();
        const now=c.now();
        const admitted=evaluatePookaAdminCanonicalClaim({binding:b,mapping:record.mapping,mission_state:record.mission_state,work_state,now_ms:now});
        const claim=await claimGimpireActionOnce({root:c.attempt_root,project_id:c.project_id,work_object_id:c.work_object_id,...admitted,claimed_at:new Date(now).toISOString()});
        // Persistence can cross the deadline. Retain its IN_FLIGHT reservation
        // but refuse admission: expiry/invalid clock never silently frees retry.
        const after=c.now();
        if (!Number.isSafeInteger(after) || after<now || after>=b.expires_at_ms) throw Error("ADMIN_ADMISSION_EXPIRED_AFTER_PERSISTENCE");
        return Object.freeze({state:claim.decision==="EXECUTE_ONCE"?"CLAIMED":"REFUSED",binding_sha256:digest(b)});
      });
    }
  });
}

export function projectGimpireActiveWorkReplay(ledgerValue: unknown, proposalValue: unknown) {
  const ledger = validateGimpireActiveWorkLedger(ledgerValue);
  const proposal = validateProposal(proposalValue);
  const replay = ledger.transitions.find((entry) => entry.proposal.event_sha256 === proposal.event_sha256);
  if (!replay) return Object.freeze({ state: "NOT_FOUND" as const });
  if (replay.proposal_sha256 !== hashGimpireCustody(proposal)) throw new Error("GIMPIRE_EVENT_REPLAY_CONFLICT");
  return Object.freeze({ state: "EXACT_REPLAY" as const, stored_state: replay.state });
}

async function appendGimpireActiveWorkOnce(input: {
  root: string;
  project_id: string;
  work_object_id: string;
  proposal: GimpireTransitionProposal;
}) {
  const proposal = validateProposal(input.proposal);
  const proposalSha256 = hashGimpireCustody(proposal);
  const target = location(input.root, input.project_id, input.work_object_id);
  return withLock(target.lock, async () => {
    const currentLedger = await readExisting(target.file);
    if (currentLedger.project_id !== input.project_id || currentLedger.work_object_id !== input.work_object_id) {
      throw new Error("GIMPIRE_LEDGER_SCOPE_MISMATCH");
    }
    const replay = projectGimpireActiveWorkReplay(currentLedger, proposal);
    if (replay.state === "EXACT_REPLAY") {
      return Object.freeze({ ledger: currentLedger, state: replay.stored_state, replay: true as const });
    }
    if (currentLedger.revision !== proposal.expected_revision) throw new Error("GIMPIRE_LEDGER_REVISION_CONFLICT");
    if (currentLedger.transitions.length >= MAX_TRANSITIONS) throw new Error("GIMPIRE_LEDGER_CAPACITY_EXCEEDED");
    const current = currentLedger.transitions.at(-1)?.state ?? currentLedger.initial_state;
    const state = admitGimpireWorkTransition(current, proposal);
    const next = validateGimpireActiveWorkLedger({
      ...currentLedger,
      revision: currentLedger.revision + 1,
      transitions: [...currentLedger.transitions, {
        proposal_sha256: proposalSha256,
        proposal,
        state_sha256: hashGimpireCustody(state),
        state
      }]
    });
    await replaceAtomically(target.file, next);
    return Object.freeze({ ledger: next, state, replay: false as const });
  });
}

export async function advanceGimpireActiveWorkOnce(input: {
  root: string;
  project_id: string;
  work_object_id: string;
  proposal: unknown;
}) {
  const proposal = validateProposal(input.proposal);
  if (proposal.evidence_class === "TRUSTED_TERMINAL_RECEIPT_ACCEPTED") {
    throw new Error("GIMPIRE_SIGNED_TERMINAL_PROOF_REQUIRED");
  }
  if (["HUMAN_GATE_CHANGED", "OPERATOR_PAUSE", "ROUTE_EXHAUSTION_ACCEPTED"].includes(proposal.evidence_class)) {
    throw new Error("GIMPIRE_VERIFIED_STOP_AUTHORITY_REQUIRED");
  }
  const ledger = await readGimpireActiveWorkLedger(input);
  const current = ledger.transitions.at(-1)?.state ?? ledger.initial_state;
  if (current.status === "PAUSED_BY_OPERATOR") {
    throw new Error("GIMPIRE_VERIFIED_OPERATOR_RESUME_REQUIRED");
  }
  return appendGimpireActiveWorkOnce({ ...input, proposal });
}

export async function advanceGimpireTerminalWorkOnce(input: {
  root: string;
  project_id: string;
  work_object_id: string;
  trusted_coordinator_public_key_pem: string;
  terminal_proof: unknown;
  proposal: unknown;
}) {
  const proposal = validateProposal(input.proposal);
  const ledger = await readGimpireActiveWorkLedger(input);
  const replay = projectGimpireActiveWorkReplay(ledger, proposal);
  if (replay.state === "EXACT_REPLAY") {
    return Object.freeze({ ledger, state: replay.stored_state, replay: true as const });
  }
  if (proposal.evidence_class !== "TRUSTED_TERMINAL_RECEIPT_ACCEPTED") {
    throw new Error("GIMPIRE_TERMINAL_EVIDENCE_CLASS_INVALID");
  }
  const current = ledger.transitions.at(-1)?.state ?? ledger.initial_state;
  const proof = verifyGimpireSignedTerminalProof(input.terminal_proof, input.trusted_coordinator_public_key_pem);
  const task = canonicalObject(proof.dispatch.body, [
    "schema", "project_id", "work_object_id", "work_id", "expected_revision", "expected_state_sha256", "terminal_predicate"
  ], "GIMPIRE_TERMINAL_TASK_INVALID");
  const report = canonicalObject(proof.dispatch.reply, [
    "schema", "project_id", "work_object_id", "work_id", "observed_revision", "terminal_predicate", "effect_evidence_sha256", "receiver_effect_state"
  ], "GIMPIRE_TERMINAL_REPORT_INVALID");
  if (task.schema !== "werkles.gimpire-terminal-work-task/v1"
    || report.schema !== "werkles.gimpire-terminal-work-report/v1"
    || proof.dispatch.project_id !== input.project_id
    || task.project_id !== input.project_id || report.project_id !== input.project_id
    || task.work_object_id !== input.work_object_id || report.work_object_id !== input.work_object_id
    || task.work_id !== current.work_id || report.work_id !== current.work_id
    || task.expected_revision !== current.revision || report.observed_revision !== current.revision
    || task.expected_state_sha256 !== hashGimpireCustody(current)
    || task.terminal_predicate !== current.terminal_predicate.description
    || report.terminal_predicate !== current.terminal_predicate.description
    || report.receiver_effect_state !== "RECEIVER_EFFECT_PROVED"
    || typeof report.effect_evidence_sha256 !== "string" || !SHA256.test(report.effect_evidence_sha256)
    || proposal.event_sha256 !== proof.attestation_sha256
    || proposal.expected_revision !== current.revision) {
    throw new Error("GIMPIRE_TERMINAL_PROOF_MISBOUND");
  }
  return appendGimpireActiveWorkOnce({
    root: input.root,
    project_id: input.project_id,
    work_object_id: input.work_object_id,
    proposal
  });
}

export async function advanceGimpireHumanGateResolutionOnce(input: {
  root: string;
  project_id: string;
  work_object_id: string;
  authority_gate_memory: PookaKindAuthorityGateMemory;
  operator_receipt: PookaKindOperatorGateReceipt;
  applied_at: string;
  proposal: unknown;
}) {
  const proposal = validateProposal(input.proposal);
  const ledger = await readGimpireActiveWorkLedger(input);
  const replay = projectGimpireActiveWorkReplay(ledger, proposal);
  if (replay.state === "EXACT_REPLAY") {
    return Object.freeze({ ledger, state: replay.stored_state, replay: true as const });
  }
  const current = ledger.transitions.at(-1)?.state ?? ledger.initial_state;
  if (current.status !== "HUMAN_GATE" || !current.human_gate
    || proposal.evidence_class !== "HUMAN_GATE_CHANGED"
    || !(input.authority_gate_memory instanceof PookaKindAuthorityGateMemory)) {
    throw new Error("GIMPIRE_VERIFIED_HUMAN_GATE_RESOLUTION_REQUIRED");
  }
  return input.authority_gate_memory.applyOperatorReceiptWithCustody(
    input.operator_receipt,
    input.applied_at,
    async (resolution) => {
      if (resolution.gate.gate_id !== current.human_gate!.gate_id
        || resolution.gate.fingerprint_sha256 !== input.operator_receipt.fingerprint_sha256
        || resolution.gate.state !== "APPROVED"
        || resolution.gate.resolution_receipt_sha256 !== proposal.event_sha256
        || proposal.expected_revision !== current.revision) {
        throw new Error("GIMPIRE_HUMAN_GATE_RESOLUTION_MISBOUND");
      }
      return appendGimpireActiveWorkOnce({
        root: input.root,
        project_id: input.project_id,
        work_object_id: input.work_object_id,
        proposal
      });
    }
  );
}

async function advanceGimpireOperatorResumeOnce(trustRoot: GimpireOperatorAuthorityTrustRoot, input: {
  root: string;
  project_id: string;
  work_object_id: string;
  proposal: unknown;
  operator_resume_attestation: unknown;
}) {
  const proposal = validateProposal(input.proposal);
  const ledger = await readGimpireActiveWorkLedger(input);
  const replay = projectGimpireActiveWorkReplay(ledger, proposal);
  if (replay.state === "EXACT_REPLAY") {
    return Object.freeze({ ledger, state: replay.stored_state, replay: true as const });
  }
  const current = ledger.transitions.at(-1)?.state ?? ledger.initial_state;
  if (current.status !== "PAUSED_BY_OPERATOR" || !current.operator_pause
    || !["OPERATOR_TURN", "CONTINUITY_RESTART"].includes(proposal.evidence_class)) {
    throw new Error("GIMPIRE_VERIFIED_OPERATOR_RESUME_REQUIRED");
  }
  const claim: GimpireOperatorResumeClaim = Object.freeze({
    schema: "werkles.gimpire-operator-resume-claim/v1",
    project_id: current.project_id,
    work_object_id: current.work_object_id,
    work_id: current.work_id,
    paused_revision: current.revision,
    pause_directive_id: current.operator_pause.directive_id,
    pause_evidence_sha256: current.operator_pause.evidence_sha256,
    proposal_sha256: hashGimpireCustody(proposal)
  });
  trustRoot.verifyExactClaim(
    input.operator_resume_attestation,
    claim,
    "werkles.gimpire-operator-resume-attestation/v1"
  );
  return appendGimpireActiveWorkOnce({
    root: input.root,
    project_id: input.project_id,
    work_object_id: input.work_object_id,
    proposal
  });
}

export function createGimpireOperatorResumeController(input: {
  operator_authority_trust_root: GimpireOperatorAuthorityTrustRoot;
}) {
  if (!input || !(input.operator_authority_trust_root instanceof GimpireOperatorAuthorityTrustRoot)) {
    throw new Error("GIMPIRE_OPERATOR_RESUME_TRUST_ROOT_REQUIRED");
  }
  const trustRoot = input.operator_authority_trust_root;
  return Object.freeze({
    resumeOnce(request: Parameters<typeof advanceGimpireOperatorResumeOnce>[1]) {
      return advanceGimpireOperatorResumeOnce(trustRoot, request);
    }
  });
}
