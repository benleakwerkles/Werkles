import type { AeyeAvailability, AeyeId, AeyeResourceView } from "@/lib/soledash/dispatch-matrix/types";

export type IntentRouteCategory =
  | "infrastructure / automation"
  | "UI / UX surface"
  | "research"
  | "audit / kill test"
  | "business/site cleanup"
  | "human gate"
  | "mobile field command"
  | "workstation uniformity";

export type IntentRouteAction =
  | "approve"
  | "edit_route"
  | "reject"
  | "needs_research"
  | "kill_test";

export type IntentRouteState =
  | "PROPOSED"
  | "APPROVED"
  | "AWAITING_RECEIPT"
  | "RECEIPT_RETURNED"
  | "BLOCKED"
  | "REJECTED"
  | "NEEDS_RESEARCH"
  | "KILL_TEST";

export type IntentAeyeSelection = {
  primary: AeyeId;
  support: AeyeId[];
  label: string;
};

export type IntentMachineCandidate = {
  id: string;
  label: string;
  hostname: string | null;
  status: string;
  evidenceStatus: string;
  activeCousins: string;
  currentTask: string | null;
  blocker: string | null;
  routeLive: boolean;
};

export type IntentAvailabilitySnapshot = {
  aeyes: AeyeResourceView[];
  primaryAeyeAvailability: AeyeAvailability;
  activeAssignments: string[];
  knownBlockers: string[];
  selectedMachine: IntentMachineCandidate;
  alternatives: IntentMachineCandidate[];
  localhost: {
    ok: boolean;
    port: string | null;
    url: string | null;
    checkedAt: string | null;
  };
  routeMode: "live" | "outbox_only" | "simulated" | "blocked";
};

export type IntentRouterReceipt = {
  action: IntentRouteAction;
  status: IntentRouteState;
  summary: string;
  packetPath: string | null;
  outboxPath: string | null;
  receiptPath: string | null;
  blocker: string | null;
  nextAction: string;
  createdAt: string;
};

export type IntentRouterProposal = {
  id: string;
  createdAt: string;
  updatedAt: string;
  rawIntent: string;
  interpretedIntent: string;
  category: IntentRouteCategory;
  requiredCapability: string;
  selectedAeyes: IntentAeyeSelection;
  selectedMachine: string;
  selectedMachineId: string;
  whySelected: string[];
  alternativesRejected: string[];
  expectedReceipt: string;
  confidence: "high" | "medium" | "low";
  availability: IntentAvailabilitySnapshot;
  state: IntentRouteState;
  packetPath: string | null;
  receipt: IntentRouterReceipt | null;
  nextDecision: string | null;
};

export type IntentRouterView = {
  ok: boolean;
  latestProposal: IntentRouterProposal | null;
  recent: IntentRouterProposal[];
  proposalDir: string;
  receiptDir: string;
};
