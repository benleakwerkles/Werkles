import type { ApprovalVerdict, CousinId, MissionClassification } from "./types";

export type BuildDecision = "yea" | "nay" | "modify" | "defer" | "escalate" | "more_info";

export type ButtonActionState =
  | "READY"
  | "CLICKED"
  | "QUEUED"
  | "DISPATCHED"
  | "RUNNING"
  | "DONE"
  | "FAILED"
  | "NEEDS_HUMAN_HANDS"
  | "BLOCKED_BY_TRUE_HUMAN_GATE";

export type ProposalSource =
  | "open_mission"
  | "mule_elimination"
  | "human_gate"
  | "blocked_work"
  | "roadmap";

export type ProposalRisk = "low" | "medium" | "high";

export type BuildStatus =
  | "proposed"
  | "dispatched"
  | "ready"
  | "blocked"
  | "dropped"
  | "deferred"
  | "escalated";

export type ProposedBuild = {
  id: string;
  title: string;
  question: string;
  summary: string;
  whyNow: string;
  expectedImpact: string;
  timeToComplete: string;
  owner: string;
  risk: ProposalRisk;
  sourceType: ProposalSource;
  moreInfo: string;
  missionText: string;
  cousin: CousinId;
  machine: string;
  missionClass: string | null;
  missionLabel: string | null;
  source: "cockpit" | "freeform" | "operator";
  status: BuildStatus;
  outboxPath: string | null;
  outboxFilename: string | null;
  blocker: string | null;
  updatedAt: string;
};

export type DecisionLogEntry = {
  id: string;
  buildId: string;
  decision: BuildDecision;
  at: string;
  note: string | null;
  outboxPath: string | null;
};

export type ActionReceipt = {
  id: string;
  buildId: string;
  buildTitle: string;
  clicked: BuildDecision;
  state: ButtonActionState;
  at: string;
  generated: string | null;
  writtenTo: string | null;
  ownerCousin: CousinId | null;
  machine: string | null;
  nextState: string;
  autoExecutable: boolean;
  needsHumanHands: boolean;
  humanHandsReason: string | null;
  gateBlocked: boolean;
  gateReason: string | null;
  note: string | null;
};

export type ExecutionHintView = {
  autoExecutable: boolean;
  verdict: ApprovalVerdict;
  approvalClass?: "GREEN" | "BLUE" | "RED" | null;
  receiptRequired?: boolean;
  reason: string | null;
};

export type ProposalCard = {
  build: ProposedBuild;
  buttonState: ButtonActionState;
  lastReceipt: ActionReceipt | null;
  executionHint: ExecutionHintView;
};

export type FreeformPending = {
  text: string;
  classification: MissionClassification;
  cousin: CousinId;
  machine: string;
  summary: string;
  proposedAt: string;
};

export type CommandState = {
  version: "v1";
  builds: ProposedBuild[];
  freeformPending: FreeformPending | null;
};

export type HumanGateItem = {
  id: string;
  title: string;
  detail: string;
  severity: "blocker" | "warning" | "info";
};

export type NeedsYouItem = {
  kind: "human_gate" | "decision" | "blocker";
  title: string;
  detail: string;
  buildId: string | null;
};

export type DispatchResult = {
  ok: boolean;
  build: ProposedBuild | null;
  message: string;
  blocker: string | null;
  degradedSend: {
    required: true;
    label: string;
    detail: string;
    outboxPath: string;
    cousinPlatform: string | null;
  } | null;
};

export type FreeformProposeResult = {
  ok: boolean;
  pending: FreeformPending | null;
  approvalGate: ApprovalVerdict | null;
  blocker: string | null;
  message: string;
};

export type CommandSurfaceView = {
  version: "v1";
  machineLabel: string;
  needsYouNow: NeedsYouItem[];
  proposalCards: ProposalCard[];
  /** @deprecated use proposalCards — kept for compat */
  proposedBuilds: ProposedBuild[];
  deferredBuilds: ProposedBuild[];
  recentReceipts: ActionReceipt[];
  humanGates: HumanGateItem[];
  freeformPending: FreeformPending | null;
  finishedReady: ProposedBuild[];
  blocked: ProposedBuild[];
  technical: {
    branch: string;
    commit: string;
    workingTree: string;
    localhostOk: boolean;
  };
};

export type DecideActionResult = {
  ok: boolean;
  action?: "dispatched" | "dropped" | "deferred" | "more_info_logged" | "blocked";
  message: string;
  receipt?: ActionReceipt | null;
  build?: ProposedBuild | null;
  decisionLogPath?: string;
  outboxPath?: string | null;
  blocker?: string | null;
  degradedSend?: DispatchResult["degradedSend"];
  error?: string;
};

export const COUSIN_OUTBOX_PREFIX: Record<CousinId, string> = {
  MAKER: "TO_CURSOR",
  DINK: "TO_DINK",
  PETRA: "TO_PETRA",
  ENDER: "TO_ENDER",
  SKYBRO: "TO_SKYBRO",
  BEAN: "TO_BEAN",
  COMPUTER: "TO_COMPUTER"
};

export const COUSIN_PLATFORM: Record<CousinId, string | null> = {
  MAKER: "Cursor (local)",
  DINK: "Local hands",
  PETRA: "https://chatgpt.com",
  ENDER: "https://claude.ai",
  SKYBRO: "https://gemini.google.com",
  BEAN: "https://chat.deepseek.com",
  COMPUTER: "https://www.perplexity.ai"
};
