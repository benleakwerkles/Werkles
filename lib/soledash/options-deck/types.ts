import type { OperatorCousinTarget } from "@/lib/soledash/options-deck/cousins";

export type OptionVerb =
  | "dispatch"
  | "yea"
  | "nay"
  | "needs_research"
  | "kill_test"
  | "human_reality"
  | "make_frontier"
  | "hold";

/** Implementation truth — not theatrical */
export type OptionLifecycleState =
  | "proposed"
  | "fired"
  | "working"
  | "blocked"
  | "returned"
  | "exploded"
  | "escaped";

export type OptionRisk = "low" | "medium" | "high" | "unknown";

export type CompanyOption = {
  id: string;
  kind: "frontier" | "queue" | "route" | "play";
  code: string;
  title: string;
  summary: string | null;
  action: string;
  score: number | null;
  owner: string | null;
  target: OperatorCousinTarget;
  suggestedCousin: OperatorCousinTarget;
  rankSource: string | null;
  expectedResult: string;
  timeCostMin: number;
  risk: OptionRisk;
  confidence: string;
  verbs: OptionVerb[];
  isActiveFrontier: boolean;
  enabled: boolean;
  disabledReason: string | null;
  /** Competing option ids */
  conflictsWith: string[];
  /** Human-readable tension lines */
  conflictHints: string[];
  consumesAgent: boolean;
  consumesFrontier: boolean;
};

export type OptionBoardState = {
  lifecycle: OptionLifecycleState;
  expectedResult: string;
  actualResult: string | null;
  firedVerb: OptionVerb | null;
  firedAt: string | null;
  dimmedReason: string | null;
};

export type ConflictReport = {
  optionIds: [string, string];
  kind: "agent" | "frontier" | "exclusive";
  message: string;
};

export type SalvoSlot = {
  id: string;
  optionId: string;
  optionTitle: string;
  verb: OptionVerb;
  target: OperatorCousinTarget;
  phase: "queued" | "firing" | "ok" | "warn" | "failed";
  detail: string | null;
  startedAt: string;
  finishedAt: string | null;
  receiptHint: string | null;
};

export type ReactionEntry = {
  id: string;
  at: string;
  headline: string;
  detail: string;
  tone: "ok" | "warn" | "bad" | "info";
  source: "receipt" | "fleet" | "salvo" | "refresh";
};
