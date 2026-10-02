const SHA256 = /^[a-f0-9]{64}$/;
const ID = /^[a-z0-9][a-z0-9-]{2,127}$/;
const GATE_ID = /^(?:[a-z0-9][a-z0-9-]{2,127}|gate\.[a-f0-9]{64})$/;

export const GIMPIRE_ACTIVE_STATUSES = [
  "ACTIVE",
  "WAITING_FOR_RECEIVER",
  "WAITING_FOR_EXTERNAL_EVENT"
] as const;

export const GIMPIRE_STOP_STATUSES = [
  "HUMAN_GATE",
  "PAUSED_BY_OPERATOR",
  "COMPLETED",
  "EXHAUSTED_WITH_EVIDENCE"
] as const;

export const GIMPIRE_IMMUTABLE_STATUSES = [
  "COMPLETED",
  "EXHAUSTED_WITH_EVIDENCE"
] as const;

export type GimpireWorkStatus =
  | typeof GIMPIRE_ACTIVE_STATUSES[number]
  | typeof GIMPIRE_STOP_STATUSES[number];

export type GimpireEvidenceClass =
  | "OPERATOR_TURN"
  | "TOOL_RESULT"
  | "CREW_RECEIPT"
  | "TRUSTED_TERMINAL_RECEIPT_ACCEPTED"
  | "HUMAN_GATE_CHANGED"
  | "OPERATOR_PAUSE"
  | "ROUTE_EXHAUSTION_ACCEPTED"
  | "CONTINUITY_RESTART"
  | "SOURCE_PROOF"
  | "TEST_PROOF"
  | "PACKAGE_PROOF"
  | "SENT"
  | "QUEUED"
  | "THINKING";

export type GimpireWorkState = {
  schema: "werkles.gimpire-active-work-state/v1";
  work_object_id: string;
  project_id: string;
  work_id: string;
  lane_id: string;
  revision: number;
  status: GimpireWorkStatus;
  objective: string;
  terminal_predicate: {
    description: string;
    state: "UNSATISFIED" | "SATISFIED";
    evidence_sha256: string | null;
  };
  quantum: {
    quantum_id: string;
    ideas_used: number;
  };
  last_event_sha256: string | null;
  next_safe_actions: string[];
  materially_different_routes_remaining: boolean;
  wait: null | {
    kind: "RECEIVER" | "EXTERNAL_EVENT";
    evidence_sha256: string;
  };
  human_gate: null | {
    gate_id: string;
    evidence_sha256: string;
  };
  operator_pause: null | {
    directive_id: string;
    evidence_sha256: string;
  };
  exhaustion: null | {
    attempted_route_ids: string[];
    evidence_sha256: string;
  };
  continuity: {
    capsule_sha256: string;
    predecessor_revision: number | null;
  };
};

export type GimpireTransitionProposal = {
  expected_revision: number;
  evidence_class: GimpireEvidenceClass;
  event_sha256: string;
  next: GimpireWorkState;
};

const ACTIVE = new Set<string>(GIMPIRE_ACTIVE_STATUSES);
const TRANSPORT_OR_INTERMEDIATE = new Set<GimpireEvidenceClass>([
  "SOURCE_PROOF", "TEST_PROOF", "PACKAGE_PROOF", "SENT", "QUEUED", "THINKING"
]);

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exact(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function text(value: unknown, code: string, maximum = 2048) {
  if (typeof value !== "string" || value.trim().length === 0 || Buffer.byteLength(value, "utf8") > maximum) {
    throw new Error(code);
  }
  return value.trim();
}

function hash(value: unknown, code: string) {
  if (typeof value !== "string" || !SHA256.test(value)) throw new Error(code);
  return value;
}

function id(value: unknown, code: string) {
  const normalized = text(value, code, 128);
  if (!ID.test(normalized)) throw new Error(code);
  return normalized;
}

function gateId(value: unknown, code: string) {
  const normalized = text(value, code, 80);
  if (!GATE_ID.test(normalized)) throw new Error(code);
  return normalized;
}

function validateActions(value: unknown) {
  if (!Array.isArray(value) || value.length > 2) throw new Error("GIMPIRE_NEXT_ACTIONS_INVALID");
  const actions = value.map((item) => text(item, "GIMPIRE_NEXT_ACTIONS_INVALID", 512));
  if (new Set(actions).size !== actions.length) throw new Error("GIMPIRE_NEXT_ACTIONS_INVALID");
  return actions;
}

export function validateGimpireWorkState(value: unknown): GimpireWorkState {
  if (!record(value) || !exact(value, [
    "schema", "work_object_id", "project_id", "work_id", "lane_id", "revision", "status", "objective",
    "terminal_predicate", "quantum", "last_event_sha256", "next_safe_actions",
    "materially_different_routes_remaining", "wait", "human_gate", "operator_pause", "exhaustion", "continuity"
  ]) || value.schema !== "werkles.gimpire-active-work-state/v1") throw new Error("GIMPIRE_WORK_STATE_INVALID");

  const workObjectId = id(value.work_object_id, "GIMPIRE_WORK_IDENTITY_INVALID");
  const projectId = id(value.project_id, "GIMPIRE_WORK_IDENTITY_INVALID");
  const workId = id(value.work_id, "GIMPIRE_WORK_IDENTITY_INVALID");
  const laneId = id(value.lane_id, "GIMPIRE_WORK_IDENTITY_INVALID");
  if (!Number.isSafeInteger(value.revision) || Number(value.revision) < 0) throw new Error("GIMPIRE_REVISION_INVALID");
  if (![...GIMPIRE_ACTIVE_STATUSES, ...GIMPIRE_STOP_STATUSES].includes(value.status as never)) {
    throw new Error("GIMPIRE_STATUS_INVALID");
  }

  if (!record(value.terminal_predicate) || !exact(value.terminal_predicate, ["description", "state", "evidence_sha256"])) {
    throw new Error("GIMPIRE_TERMINAL_PREDICATE_INVALID");
  }
  const terminalState = value.terminal_predicate.state;
  if (!['UNSATISFIED', 'SATISFIED'].includes(String(terminalState))) throw new Error("GIMPIRE_TERMINAL_PREDICATE_INVALID");
  const terminalEvidence = value.terminal_predicate.evidence_sha256 === null
    ? null
    : hash(value.terminal_predicate.evidence_sha256, "GIMPIRE_TERMINAL_PREDICATE_INVALID");
  if ((terminalState === "SATISFIED") !== (terminalEvidence !== null)) throw new Error("GIMPIRE_TERMINAL_PREDICATE_INVALID");

  if (!record(value.quantum) || !exact(value.quantum, ["quantum_id", "ideas_used"])) throw new Error("GIMPIRE_QUANTUM_INVALID");
  const quantumId = id(value.quantum.quantum_id, "GIMPIRE_QUANTUM_INVALID");
  if (!Number.isSafeInteger(value.quantum.ideas_used) || Number(value.quantum.ideas_used) < 0 || Number(value.quantum.ideas_used) > 2) {
    throw new Error("GIMPIRE_QUANTUM_IDEA_LIMIT_EXCEEDED");
  }

  const status = value.status as GimpireWorkStatus;
  const nextSafeActions = validateActions(value.next_safe_actions);
  if (typeof value.materially_different_routes_remaining !== "boolean") throw new Error("GIMPIRE_ROUTE_STATE_INVALID");

  const wait = value.wait === null ? null : (() => {
    if (!record(value.wait) || !exact(value.wait, ["kind", "evidence_sha256"]) || !["RECEIVER", "EXTERNAL_EVENT"].includes(String(value.wait.kind))) {
      throw new Error("GIMPIRE_WAIT_INVALID");
    }
    return { kind: value.wait.kind as "RECEIVER" | "EXTERNAL_EVENT", evidence_sha256: hash(value.wait.evidence_sha256, "GIMPIRE_WAIT_INVALID") };
  })();
  const humanGate = value.human_gate === null ? null : (() => {
    if (!record(value.human_gate) || !exact(value.human_gate, ["gate_id", "evidence_sha256"])) throw new Error("GIMPIRE_HUMAN_GATE_INVALID");
    return { gate_id: gateId(value.human_gate.gate_id, "GIMPIRE_HUMAN_GATE_INVALID"), evidence_sha256: hash(value.human_gate.evidence_sha256, "GIMPIRE_HUMAN_GATE_INVALID") };
  })();
  const operatorPause = value.operator_pause === null ? null : (() => {
    if (!record(value.operator_pause) || !exact(value.operator_pause, ["directive_id", "evidence_sha256"])) throw new Error("GIMPIRE_OPERATOR_PAUSE_INVALID");
    return { directive_id: id(value.operator_pause.directive_id, "GIMPIRE_OPERATOR_PAUSE_INVALID"), evidence_sha256: hash(value.operator_pause.evidence_sha256, "GIMPIRE_OPERATOR_PAUSE_INVALID") };
  })();
  const exhaustion = value.exhaustion === null ? null : (() => {
    if (!record(value.exhaustion) || !exact(value.exhaustion, ["attempted_route_ids", "evidence_sha256"]) || !Array.isArray(value.exhaustion.attempted_route_ids) || value.exhaustion.attempted_route_ids.length === 0) {
      throw new Error("GIMPIRE_EXHAUSTION_INVALID");
    }
    const attemptedRouteIds = value.exhaustion.attempted_route_ids.map((item) => id(item, "GIMPIRE_EXHAUSTION_INVALID"));
    if (new Set(attemptedRouteIds).size !== attemptedRouteIds.length) throw new Error("GIMPIRE_EXHAUSTION_INVALID");
    return { attempted_route_ids: attemptedRouteIds, evidence_sha256: hash(value.exhaustion.evidence_sha256, "GIMPIRE_EXHAUSTION_INVALID") };
  })();

  if (!record(value.continuity) || !exact(value.continuity, ["capsule_sha256", "predecessor_revision"])) throw new Error("GIMPIRE_CONTINUITY_INVALID");
  const predecessorRevision = value.continuity.predecessor_revision;
  if (predecessorRevision !== null && (!Number.isSafeInteger(predecessorRevision) || Number(predecessorRevision) < 0 || Number(predecessorRevision) >= Number(value.revision))) {
    throw new Error("GIMPIRE_CONTINUITY_INVALID");
  }

  if (status === "COMPLETED" && terminalState !== "SATISFIED") throw new Error("GIMPIRE_FALSE_COMPLETION");
  if (status !== "COMPLETED" && terminalState === "SATISFIED") throw new Error("GIMPIRE_TERMINAL_STATE_CONFLICT");
  if (status === "HUMAN_GATE" && !humanGate) throw new Error("GIMPIRE_HUMAN_GATE_REQUIRED");
  if (status !== "HUMAN_GATE" && humanGate) throw new Error("GIMPIRE_HUMAN_GATE_CONFLICT");
  if (status === "PAUSED_BY_OPERATOR" && !operatorPause) throw new Error("GIMPIRE_OPERATOR_PAUSE_REQUIRED");
  if (status !== "PAUSED_BY_OPERATOR" && operatorPause) throw new Error("GIMPIRE_OPERATOR_PAUSE_CONFLICT");
  if (status === "EXHAUSTED_WITH_EVIDENCE" && (!exhaustion || value.materially_different_routes_remaining)) throw new Error("GIMPIRE_EXHAUSTION_UNPROVEN");
  if (status !== "EXHAUSTED_WITH_EVIDENCE" && exhaustion) throw new Error("GIMPIRE_EXHAUSTION_CONFLICT");
  if (status === "WAITING_FOR_RECEIVER" && wait?.kind !== "RECEIVER") throw new Error("GIMPIRE_WAIT_INVALID");
  if (status === "WAITING_FOR_EXTERNAL_EVENT" && wait?.kind !== "EXTERNAL_EVENT") throw new Error("GIMPIRE_WAIT_INVALID");
  if (!status.startsWith("WAITING_") && wait) throw new Error("GIMPIRE_WAIT_CONFLICT");
  if (ACTIVE.has(status) && status === "ACTIVE" && nextSafeActions.length === 0) throw new Error("GIMPIRE_ACTIVE_NEXT_ACTION_REQUIRED");

  return {
    schema: "werkles.gimpire-active-work-state/v1",
    work_object_id: workObjectId,
    project_id: projectId,
    work_id: workId,
    lane_id: laneId,
    revision: Number(value.revision),
    status,
    objective: text(value.objective, "GIMPIRE_OBJECTIVE_INVALID", 4096),
    terminal_predicate: { description: text(value.terminal_predicate.description, "GIMPIRE_TERMINAL_PREDICATE_INVALID", 2048), state: terminalState as "UNSATISFIED" | "SATISFIED", evidence_sha256: terminalEvidence },
    quantum: { quantum_id: quantumId, ideas_used: Number(value.quantum.ideas_used) },
    last_event_sha256: value.last_event_sha256 === null ? null : hash(value.last_event_sha256, "GIMPIRE_EVENT_INVALID"),
    next_safe_actions: nextSafeActions,
    materially_different_routes_remaining: value.materially_different_routes_remaining,
    wait,
    human_gate: humanGate,
    operator_pause: operatorPause,
    exhaustion,
    continuity: { capsule_sha256: hash(value.continuity.capsule_sha256, "GIMPIRE_CONTINUITY_INVALID"), predecessor_revision: predecessorRevision as number | null }
  };
}

export function admitGimpireWorkTransition(currentValue: unknown, proposalValue: unknown): GimpireWorkState {
  const current = validateGimpireWorkState(currentValue);
  if (!record(proposalValue) || !exact(proposalValue, ["expected_revision", "evidence_class", "event_sha256", "next"])) {
    throw new Error("GIMPIRE_TRANSITION_INVALID");
  }
  if (!Number.isSafeInteger(proposalValue.expected_revision) || proposalValue.expected_revision !== current.revision) {
    throw new Error("GIMPIRE_REVISION_CONFLICT");
  }
  const evidenceClass = String(proposalValue.evidence_class) as GimpireEvidenceClass;
  if (![
    "OPERATOR_TURN", "TOOL_RESULT", "CREW_RECEIPT", "TRUSTED_TERMINAL_RECEIPT_ACCEPTED", "HUMAN_GATE_CHANGED",
    "OPERATOR_PAUSE", "ROUTE_EXHAUSTION_ACCEPTED", "CONTINUITY_RESTART", "SOURCE_PROOF", "TEST_PROOF", "PACKAGE_PROOF", "SENT", "QUEUED", "THINKING"
  ].includes(evidenceClass)) throw new Error("GIMPIRE_EVIDENCE_CLASS_INVALID");
  const eventSha256 = hash(proposalValue.event_sha256, "GIMPIRE_EVENT_INVALID");
  if (eventSha256 === current.last_event_sha256) throw new Error("GIMPIRE_EVENT_REPLAY");
  const next = validateGimpireWorkState(proposalValue.next);

  for (const field of ["work_object_id", "project_id", "work_id", "lane_id", "objective"] as const) {
    if (next[field] !== current[field]) throw new Error("GIMPIRE_SCOPE_DRIFT");
  }
  if (next.terminal_predicate.description !== current.terminal_predicate.description) throw new Error("GIMPIRE_TERMINAL_PREDICATE_DRIFT");
  if (next.revision !== current.revision + 1 || next.last_event_sha256 !== eventSha256 || next.continuity.predecessor_revision !== current.revision) {
    throw new Error("GIMPIRE_TRANSITION_CUSTODY_INVALID");
  }
  if (GIMPIRE_IMMUTABLE_STATUSES.includes(current.status as never)) throw new Error("GIMPIRE_STOPPED_WORK_IMMUTABLE");
  if (current.status === "HUMAN_GATE" && evidenceClass !== "HUMAN_GATE_CHANGED") {
    throw new Error("GIMPIRE_HUMAN_GATE_RESOLUTION_REQUIRED");
  }
  if (current.status === "HUMAN_GATE" && next.status === "HUMAN_GATE") {
    throw new Error("GIMPIRE_HUMAN_GATE_NO_MATERIAL_CHANGE");
  }
  if (current.status === "PAUSED_BY_OPERATOR"
    && !["OPERATOR_TURN", "CONTINUITY_RESTART"].includes(evidenceClass)) {
    throw new Error("GIMPIRE_OPERATOR_RESUME_REQUIRED");
  }
  if (next.status === "COMPLETED" && evidenceClass !== "TRUSTED_TERMINAL_RECEIPT_ACCEPTED") throw new Error("GIMPIRE_FALSE_COMPLETION");
  if (next.status === "COMPLETED" && next.terminal_predicate.evidence_sha256 !== eventSha256) throw new Error("GIMPIRE_TERMINAL_EVIDENCE_SUBSTITUTION");
  if (TRANSPORT_OR_INTERMEDIATE.has(evidenceClass) && next.terminal_predicate.state === "SATISFIED") {
    throw new Error("GIMPIRE_INTERMEDIATE_IS_NOT_EFFECT");
  }
  if (next.status === "HUMAN_GATE" && evidenceClass !== "HUMAN_GATE_CHANGED") throw new Error("GIMPIRE_HUMAN_GATE_UNTRUSTED");
  if (next.status === "HUMAN_GATE" && next.human_gate?.evidence_sha256 !== eventSha256) throw new Error("GIMPIRE_HUMAN_GATE_EVIDENCE_SUBSTITUTION");
  if (next.status === "PAUSED_BY_OPERATOR" && evidenceClass !== "OPERATOR_PAUSE") throw new Error("GIMPIRE_OPERATOR_PAUSE_UNTRUSTED");
  if (next.status === "PAUSED_BY_OPERATOR" && next.operator_pause?.evidence_sha256 !== eventSha256) throw new Error("GIMPIRE_OPERATOR_PAUSE_EVIDENCE_SUBSTITUTION");
  if (next.status === "EXHAUSTED_WITH_EVIDENCE" && next.materially_different_routes_remaining) throw new Error("GIMPIRE_EXHAUSTION_UNPROVEN");
  if (next.status === "EXHAUSTED_WITH_EVIDENCE" && evidenceClass !== "ROUTE_EXHAUSTION_ACCEPTED") throw new Error("GIMPIRE_EXHAUSTION_UNTRUSTED");
  if (next.status === "EXHAUSTED_WITH_EVIDENCE" && next.exhaustion?.evidence_sha256 !== eventSha256) throw new Error("GIMPIRE_EXHAUSTION_EVIDENCE_SUBSTITUTION");
  if (next.status.startsWith("WAITING_") && next.wait?.evidence_sha256 !== eventSha256) throw new Error("GIMPIRE_WAIT_EVIDENCE_SUBSTITUTION");
  if (next.quantum.quantum_id === current.quantum.quantum_id && next.quantum.ideas_used < current.quantum.ideas_used) {
    throw new Error("GIMPIRE_QUANTUM_IDEA_COUNT_REGRESSION");
  }
  if (next.quantum.quantum_id !== current.quantum.quantum_id && next.quantum.ideas_used !== 0) {
    throw new Error("GIMPIRE_NEW_QUANTUM_MUST_RESET_IDEAS");
  }
  if (next.quantum.quantum_id !== current.quantum.quantum_id && !["OPERATOR_TURN", "CREW_RECEIPT", "CONTINUITY_RESTART"].includes(evidenceClass)) {
    throw new Error("GIMPIRE_QUANTUM_BOUNDARY_UNTRUSTED");
  }
  return next;
}

export function projectGimpireHallMonitor(stateValue: unknown) {
  const state = validateGimpireWorkState(stateValue);
  const stopped = GIMPIRE_STOP_STATUSES.includes(state.status as never);
  const immutable = GIMPIRE_IMMUTABLE_STATUSES.includes(state.status as never);
  return Object.freeze({
    work_object_id: state.work_object_id,
    revision: state.revision,
    status: state.status,
    execution_quantum_complete_is_work_complete: false as const,
    work_complete: state.status === "COMPLETED",
    may_stop: stopped,
    must_continue_on_material_event: !immutable,
    next_safe_actions: Object.freeze([...state.next_safe_actions]),
    recurrence_authorized: false as const,
    generic_idle_permitted: false as const
  });
}
