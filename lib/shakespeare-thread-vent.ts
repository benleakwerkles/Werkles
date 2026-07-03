export type ThreadStatus = "GREEN" | "WATCH" | "STOP";

type SignalSeverity = "WATCH" | "STOP";

type ThreadVentSignal = {
  id: string;
  severity: SignalSeverity;
  reason: string;
};

export type ThreadVentInput = {
  mission?: string;
  role?: string;
  machine?: string;
  executionContext?: string;
  threadId?: string;
  turnCount?: number;
  tokenEstimate?: number;
  responseLatencyMs?: number;
  baselineLatencyMs?: number;
  missedRoleMachineContext?: boolean;
  missedRoleMachineContextCount?: number;
  repeatedSettledDoctrine?: boolean;
  repeatedSettledDoctrineCount?: number;
  vagueReceipts?: boolean;
  vagueReceiptCount?: number;
  userCorrectionCount?: number;
  latestKnownState?: string;
  nextAction?: string;
};

export type ThreadVentOutput = {
  THREAD_STATUS: ThreadStatus;
  REBOOT_REQUIRED: boolean;
  COMPACT_REBOOT_PACKET: string;
  signals: ThreadVentSignal[];
};

const WATCH_TURN_COUNT = 70;
const STOP_TURN_COUNT = 110;
const WATCH_TOKEN_ESTIMATE = 70000;
const STOP_TOKEN_ESTIMATE = 110000;
const WATCH_LATENCY_MS = 45000;
const STOP_LATENCY_MS = 90000;
const WATCH_LATENCY_RATIO = 1.75;
const STOP_LATENCY_RATIO = 3;

function countFromFlag(flag: boolean | undefined, count: number | undefined) {
  if (typeof count === "number") return count;
  return flag ? 1 : 0;
}

function pushLengthSignals(input: ThreadVentInput, signals: ThreadVentSignal[]) {
  if (typeof input.turnCount === "number") {
    if (input.turnCount >= STOP_TURN_COUNT) {
      signals.push({
        id: "THREAD_LENGTH_TURNS",
        severity: "STOP",
        reason: `thread turn count ${input.turnCount} >= ${STOP_TURN_COUNT}`,
      });
    } else if (input.turnCount >= WATCH_TURN_COUNT) {
      signals.push({
        id: "THREAD_LENGTH_TURNS",
        severity: "WATCH",
        reason: `thread turn count ${input.turnCount} >= ${WATCH_TURN_COUNT}`,
      });
    }
  }

  if (typeof input.tokenEstimate === "number") {
    if (input.tokenEstimate >= STOP_TOKEN_ESTIMATE) {
      signals.push({
        id: "THREAD_LENGTH_TOKENS",
        severity: "STOP",
        reason: `thread token estimate ${input.tokenEstimate} >= ${STOP_TOKEN_ESTIMATE}`,
      });
    } else if (input.tokenEstimate >= WATCH_TOKEN_ESTIMATE) {
      signals.push({
        id: "THREAD_LENGTH_TOKENS",
        severity: "WATCH",
        reason: `thread token estimate ${input.tokenEstimate} >= ${WATCH_TOKEN_ESTIMATE}`,
      });
    }
  }
}

function pushLatencySignals(input: ThreadVentInput, signals: ThreadVentSignal[]) {
  if (typeof input.responseLatencyMs !== "number") return;

  const baseline = typeof input.baselineLatencyMs === "number" && input.baselineLatencyMs > 0
    ? input.baselineLatencyMs
    : null;
  const latencyRatio = baseline ? input.responseLatencyMs / baseline : null;

  if (input.responseLatencyMs >= STOP_LATENCY_MS || (latencyRatio !== null && latencyRatio >= STOP_LATENCY_RATIO)) {
    signals.push({
      id: "RESPONSE_LATENCY",
      severity: "STOP",
      reason: latencyRatio === null
        ? `response latency ${input.responseLatencyMs}ms >= ${STOP_LATENCY_MS}ms`
        : `response latency ratio ${latencyRatio.toFixed(2)} >= ${STOP_LATENCY_RATIO}`,
    });
    return;
  }

  if (input.responseLatencyMs >= WATCH_LATENCY_MS || (latencyRatio !== null && latencyRatio >= WATCH_LATENCY_RATIO)) {
    signals.push({
      id: "RESPONSE_LATENCY",
      severity: "WATCH",
      reason: latencyRatio === null
        ? `response latency ${input.responseLatencyMs}ms >= ${WATCH_LATENCY_MS}ms`
        : `response latency ratio ${latencyRatio.toFixed(2)} >= ${WATCH_LATENCY_RATIO}`,
    });
  }
}

function pushContextSignals(input: ThreadVentInput, signals: ThreadVentSignal[]) {
  const contextMisses = countFromFlag(input.missedRoleMachineContext, input.missedRoleMachineContextCount);
  if (contextMisses >= 2) {
    signals.push({
      id: "ROLE_MACHINE_CONTEXT_MISS",
      severity: "STOP",
      reason: `role/machine context misses ${contextMisses} >= 2`,
    });
  } else if (contextMisses === 1) {
    signals.push({
      id: "ROLE_MACHINE_CONTEXT_MISS",
      severity: "WATCH",
      reason: "agent missed role or machine context",
    });
  }
}

function pushDoctrineSignals(input: ThreadVentInput, signals: ThreadVentSignal[]) {
  const repeats = countFromFlag(input.repeatedSettledDoctrine, input.repeatedSettledDoctrineCount);
  if (repeats >= 2) {
    signals.push({
      id: "SETTLED_DOCTRINE_REPEAT",
      severity: "STOP",
      reason: `settled doctrine repeats ${repeats} >= 2`,
    });
  } else if (repeats === 1) {
    signals.push({
      id: "SETTLED_DOCTRINE_REPEAT",
      severity: "WATCH",
      reason: "agent repeated already-settled doctrine",
    });
  }
}

function pushReceiptSignals(input: ThreadVentInput, signals: ThreadVentSignal[]) {
  const vagueReceipts = countFromFlag(input.vagueReceipts, input.vagueReceiptCount);
  if (vagueReceipts >= 2) {
    signals.push({
      id: "VAGUE_RECEIPTS",
      severity: "STOP",
      reason: `vague receipts ${vagueReceipts} >= 2`,
    });
  } else if (vagueReceipts === 1) {
    signals.push({
      id: "VAGUE_RECEIPTS",
      severity: "WATCH",
      reason: "latest receipt is vague",
    });
  }
}

function pushCorrectionSignals(input: ThreadVentInput, signals: ThreadVentSignal[]) {
  const corrections = input.userCorrectionCount || 0;
  if (corrections > 2) {
    signals.push({
      id: "USER_CORRECTION_COUNT",
      severity: "STOP",
      reason: `user correction count ${corrections} > 2`,
    });
  }
}

function buildCompactRebootPacket(input: ThreadVentInput, status: ThreadStatus, rebootRequired: boolean, signals: ThreadVentSignal[]) {
  const mission = input.mission || "THREAD_REBOOT";
  const role = input.role || "UNKNOWN_ROLE";
  const machine = input.machine || "UNKNOWN_MACHINE";
  const executionContext = input.executionContext || "UNKNOWN_CONTEXT";
  const latestKnownState = input.latestKnownState || "Use repo files and latest receipt as source of truth.";
  const nextAction = input.nextAction || (rebootRequired ? "Start fresh thread from this packet." : "Continue current thread and re-run vent after next receipt.");
  const reasons = signals.length ? signals.map((signal) => `${signal.id}:${signal.severity}`).join(", ") : "none";

  return [
    `MISSION: ${mission}`,
    `ROLE: ${role}`,
    `MACHINE: ${machine}`,
    `EXECUTION_CONTEXT: ${executionContext}`,
    `THREAD_STATUS: ${status}`,
    `REBOOT_REQUIRED: ${rebootRequired}`,
    `VENT_REASONS: ${reasons}`,
    `LATEST_KNOWN_STATE: ${latestKnownState}`,
    `NEXT_ACTION: ${nextAction}`,
    "CARRY_FORWARD: role, machine, mission, current files, exact receipts, hard gates",
    "DROP: long chat drift, repeated doctrine, vague proof, stale assumptions",
  ].join("\n");
}

export function classifyThreadVent(input: ThreadVentInput): ThreadVentOutput {
  const signals: ThreadVentSignal[] = [];

  pushLengthSignals(input, signals);
  pushLatencySignals(input, signals);
  pushContextSignals(input, signals);
  pushDoctrineSignals(input, signals);
  pushReceiptSignals(input, signals);
  pushCorrectionSignals(input, signals);

  const hasStop = signals.some((signal) => signal.severity === "STOP");
  const status: ThreadStatus = hasStop ? "STOP" : signals.length ? "WATCH" : "GREEN";
  const rebootRequired = status === "STOP" || signals.filter((signal) => signal.severity === "WATCH").length >= 3;

  return {
    THREAD_STATUS: status,
    REBOOT_REQUIRED: rebootRequired,
    COMPACT_REBOOT_PACKET: buildCompactRebootPacket(input, status, rebootRequired, signals),
    signals,
  };
}
