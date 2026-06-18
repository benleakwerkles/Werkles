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

/** Actionable deck card types — not decision outcomes */
export type DeckCardType =
  | "intent_proposal"
  | "relay_task"
  | "human_gate"
  | "receipt"
  | "blocker"
  | "contradiction_warning"
  | "resource_conflict"
  | "focus_theft_incident";

/** Card state — NAY/REJECT is a state, never a card */
export type OptionLifecycleState =
  | "proposed"
  | "approved"
  | "rejected"
  | "needs_research"
  | "kill_test"
  | "fired"
  | "working"
  | "blocked"
  | "receipt_returned"
  | "exploded"
  | "parked";

export type OptionRisk = "low" | "medium" | "high" | "unknown";

export type CompanyOption = {
  id: string;
  cardType: DeckCardType;
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
  frontierSlotId: string | null;
  conflictsWith: string[];
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
