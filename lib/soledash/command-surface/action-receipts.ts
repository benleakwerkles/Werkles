import fs from "node:fs";
import path from "node:path";

import { classifyApprovalAction } from "./approval-classifier";
import type { ApprovalVerdict, CousinId } from "./types";
import type {
  ActionReceipt,
  BuildDecision,
  ButtonActionState,
  ProposedBuild
} from "./v1-types";

const ROOT = process.cwd();
const RECEIPTS_DIR = path.join(ROOT, "foreman", "soledash");
const RECEIPTS_FILE = path.join(RECEIPTS_DIR, "ACTION_RECEIPTS.jsonl");

export const ACTION_RECEIPTS_PATH = "foreman/soledash/ACTION_RECEIPTS.jsonl";

export type ExecutionHint = {
  autoExecutable: boolean;
  verdict: ApprovalVerdict;
  reason: string | null;
};

export function executionHintFor(missionText: string): ExecutionHint {
  const gate = classifyApprovalAction(missionText);
  return {
    autoExecutable: gate.verdict === "SAFE_MECHANICAL",
    verdict: gate.verdict,
    reason:
      gate.verdict === "TRUE_HUMAN_GATE" || gate.verdict === "BLOCKED"
        ? `${gate.operatorLine} ${gate.reasons.join(" ")}`.trim()
        : gate.verdict === "AMBIGUOUS"
          ? gate.operatorLine
          : null
  };
}

export function appendActionReceipt(
  entry: Omit<ActionReceipt, "id" | "at"> & { id?: string; at?: string }
): ActionReceipt {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
  const line: ActionReceipt = {
    id: entry.id ?? `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    at: entry.at ?? new Date().toISOString(),
    buildId: entry.buildId,
    buildTitle: entry.buildTitle,
    clicked: entry.clicked,
    state: entry.state,
    generated: entry.generated,
    writtenTo: entry.writtenTo,
    ownerCousin: entry.ownerCousin,
    machine: entry.machine,
    nextState: entry.nextState,
    autoExecutable: entry.autoExecutable,
    needsHumanHands: entry.needsHumanHands,
    humanHandsReason: entry.humanHandsReason,
    gateBlocked: entry.gateBlocked,
    gateReason: entry.gateReason,
    note: entry.note ?? null
  };
  fs.appendFileSync(RECEIPTS_FILE, `${JSON.stringify(line)}\n`, "utf8");
  return line;
}

export function readActionReceipts(limit = 30): ActionReceipt[] {
  try {
    const raw = fs.readFileSync(RECEIPTS_FILE, "utf8").trim();
    if (!raw) return [];
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as ActionReceipt)
      .slice(-limit)
      .reverse();
  } catch {
    return [];
  }
}

export function getLatestReceiptForBuild(buildId: string): ActionReceipt | null {
  try {
    const raw = fs.readFileSync(RECEIPTS_FILE, "utf8").trim();
    if (!raw) return null;
    const lines = raw.split("\n").filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      const entry = JSON.parse(lines[i]!) as ActionReceipt;
      if (entry.buildId === buildId) return entry;
    }
    return null;
  } catch {
    return null;
  }
}

export function resolveButtonState(
  build: ProposedBuild,
  lastReceipt: ActionReceipt | null
): ButtonActionState {
  if (lastReceipt?.state === "CLICKED" || lastReceipt?.state === "QUEUED") {
    return lastReceipt.state;
  }

  switch (build.status) {
    case "proposed":
      return lastReceipt && lastReceipt.clicked === "more_info" ? "DONE" : "READY";
    case "ready":
      return "DONE";
    case "dispatched":
      return lastReceipt?.needsHumanHands ? "NEEDS_HUMAN_HANDS" : "DISPATCHED";
    case "dropped":
      return "DONE";
    case "deferred":
      return "DONE";
    case "blocked":
      return "FAILED";
    case "escalated":
      return "NEEDS_HUMAN_HANDS";
    default:
      return "READY";
  }
}

function decisionLabel(decision: BuildDecision): string {
  const labels: Record<BuildDecision, string> = {
    yea: "YEA",
    nay: "NAY",
    defer: "DEFER",
    more_info: "MORE INFO",
    modify: "MODIFY",
    escalate: "ESCALATE"
  };
  return labels[decision];
}

export function buildReceiptForDecision(input: {
  build: ProposedBuild;
  decision: BuildDecision;
  state: ButtonActionState;
  generated?: string | null;
  writtenTo?: string | null;
  nextState: string;
  needsHumanHands?: boolean;
  humanHandsReason?: string | null;
  gateBlocked?: boolean;
  gateReason?: string | null;
  note?: string | null;
  missionText?: string;
}): ActionReceipt {
  const hint = executionHintFor(input.missionText ?? input.build.missionText);
  const generated =
    input.generated ??
    (input.writtenTo ? path.basename(input.writtenTo) : null) ??
    `Decision log entry`;

  return appendActionReceipt({
    buildId: input.build.id,
    buildTitle: input.build.title,
    clicked: input.decision,
    state: input.state,
    generated,
    writtenTo: input.writtenTo ?? null,
    ownerCousin: input.build.cousin,
    machine: input.build.machine,
    nextState: input.nextState,
    autoExecutable: hint.autoExecutable,
    needsHumanHands: input.needsHumanHands ?? false,
    humanHandsReason: input.humanHandsReason ?? null,
    gateBlocked: input.gateBlocked ?? false,
    gateReason: input.gateReason ?? null,
    note: input.note ?? null
  });
}

export function buildFailedReceipt(input: {
  build: ProposedBuild;
  decision: BuildDecision;
  blocker: string | null;
  message: string;
  gateBlocked?: boolean;
}): ActionReceipt {
  const hint = executionHintFor(input.build.missionText);
  const gateBlocked = input.gateBlocked ?? hint.verdict === "TRUE_HUMAN_GATE";
  const state: ButtonActionState = gateBlocked
    ? "BLOCKED_BY_TRUE_HUMAN_GATE"
    : hint.verdict === "BLOCKED"
      ? "FAILED"
      : "NEEDS_HUMAN_HANDS";

  return buildReceiptForDecision({
    build: input.build,
    decision: input.decision,
    state,
    generated: null,
    writtenTo: null,
    nextState: gateBlocked
      ? "Blocked — true human gate. Defer or escalate instead of dispatch."
      : input.message,
    needsHumanHands: !gateBlocked,
    humanHandsReason: input.blocker ?? input.message,
    gateBlocked,
    gateReason: gateBlocked ? (input.blocker ?? input.message) : null
  });
}

export function buildDispatchReceipt(input: {
  build: ProposedBuild;
  outboxPath: string;
  outboxFilename: string;
  cousin: CousinId;
  machine: string;
  degradedManualSend: boolean;
  note?: string | null;
}): ActionReceipt {
  const isLocal = input.cousin === "MAKER" || input.cousin === "DINK";

  return buildReceiptForDecision({
    build: { ...input.build, cousin: input.cousin, machine: input.machine },
    decision: "yea",
    state: input.degradedManualSend ? "NEEDS_HUMAN_HANDS" : isLocal ? "DONE" : "DISPATCHED",
    generated: input.outboxFilename,
    writtenTo: input.outboxPath,
    nextState: input.degradedManualSend
      ? "Approved — you open the cousin once (auto-send not wired yet)."
      : isLocal
        ? "Approved — local cousin executes. Nothing for you to paste."
        : "Approved — cousin is working. You may need one manual open.",
    needsHumanHands: input.degradedManualSend,
    humanHandsReason: input.degradedManualSend
      ? "Auto-send to external chat is not available yet. SoleDash wrote the packet; one manual open remains."
      : null,
    note: input.note ?? null
  });
}

export function buildSimpleReceipt(input: {
  build: ProposedBuild;
  decision: BuildDecision;
  state: ButtonActionState;
  writtenTo: string;
  nextState: string;
  generated?: string;
}): ActionReceipt {
  return buildReceiptForDecision({
    build: input.build,
    decision: input.decision,
    state: input.state,
    writtenTo: input.writtenTo,
    generated: input.generated ?? decisionLabel(input.decision),
    nextState: input.nextState
  });
}

export function synthesizeReceiptFromBuild(build: ProposedBuild): ActionReceipt | null {
  if (build.status === "proposed") return null;

  const hint = executionHintFor(build.missionText);
  const isLocal = build.cousin === "MAKER" || build.cousin === "DINK";
  const degraded = build.status === "dispatched" && !isLocal;

  let state: ButtonActionState = "DONE";
  let clicked: BuildDecision = "yea";
  let nextState = "Recorded before receipt v1 — inferred from COMMAND_STATE.";

  switch (build.status) {
    case "ready":
      state = "DONE";
      nextState = "Ready — local cousin picks up from outbox.";
      break;
    case "dispatched":
      state = degraded ? "NEEDS_HUMAN_HANDS" : "DISPATCHED";
      nextState = degraded ? "Packet written — manual open required." : "Dispatched — awaiting cousin.";
      break;
    case "dropped":
      clicked = "nay";
      state = "DONE";
      nextState = "NAY — proposal dropped.";
      break;
    case "deferred":
      clicked = "defer";
      state = "DONE";
      nextState = "DEFER — snoozed.";
      break;
    case "blocked":
    case "escalated":
      state = "NEEDS_HUMAN_HANDS";
      nextState = build.blocker ?? "Blocked — needs human hands.";
      break;
  }

  return {
    id: `synth_${build.id}`,
    buildId: build.id,
    buildTitle: build.title,
    clicked,
    state,
    at: build.updatedAt,
    generated: build.outboxFilename,
    writtenTo: build.outboxPath,
    ownerCousin: build.cousin,
    machine: build.machine,
    nextState,
    autoExecutable: hint.autoExecutable,
    needsHumanHands: degraded || build.status === "blocked" || build.status === "escalated",
    humanHandsReason: build.blocker,
    gateBlocked: false,
    gateReason: null,
    note: "Synthesized from COMMAND_STATE"
  };
}
