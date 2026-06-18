export type ApprovalVerdict = "SAFE_MECHANICAL" | "TRUE_HUMAN_GATE" | "BLOCKED" | "AMBIGUOUS";
export type ApprovalPolicyClass = "GREEN" | "BLUE" | "RED";

export type CousinId =
  | "MAKER"
  | "DINK"
  | "PETRA"
  | "ENDER"
  | "SKYBRO"
  | "BEAN"
  | "COMPUTER";

export type MachineCapsule = {
  version: "v0";
  capsuleType: "machine_state";
  generatedAt: string;
  machine: {
    werklesName: string;
    hostname: string;
    repo: string;
    executionContext: string;
  };
  git: {
    branch: string;
    commit: string;
    commitSubject: string;
    workingTree: string;
    workingTreeDirty: boolean;
    unpushedCommits: number;
  };
  runtime: {
    nodeVersion: string;
    port: string;
    localhostOk: boolean;
    localhostUrl: string;
  };
  handoffBlock: string;
};

export type ReceiptValidation = {
  valid: boolean;
  score: number;
  cousin: string | null;
  receiptToken: string | null;
  hasReceivedLine: boolean;
  hasGdReceipt: boolean;
  hasJsonBlock: boolean;
  issues: string[];
  warnings: string[];
};

export type MissionClassification = {
  missionClass: string | null;
  label: string | null;
  confidence: "high" | "medium" | "low";
  matchedTerms: string[];
  suggestedCousins: { id: CousinId; machine: string; reason: string }[];
  constraints: string[];
};

export type MissionPacket = {
  version: "v0";
  packetType: "mission_router_draft";
  generatedAt: string;
  missionClass: string | null;
  missionLabel: string | null;
  rawMission: string;
  classification: MissionClassification;
  capsuleSnippet: string;
  packetMarkdown: string;
  stopsBeforeSend: true;
};

export type ApprovalClassification = {
  verdict: ApprovalVerdict;
  approvalClass: ApprovalPolicyClass | null;
  approvalPolicyId: string | null;
  receiptRequired: boolean;
  confidence: "high" | "medium" | "low";
  reasons: string[];
  matchedSignals: string[];
  operatorLine: string;
};

export type ReceiptSaveResult = {
  ok: boolean;
  path: string | null;
  filename: string | null;
  error: string | null;
};

export const STANDARD_CONSTRAINTS = [
  "SoleDash writes outbox — Ben does not copy/paste packets.",
  "No auto-commit. No git push/merge without Operator approval.",
  "No production deploy, SQL apply, or live billing without human gate.",
  "No secrets in chat, packets, or saved files.",
  "Ben is Operator — not copy/paste mule.",
  "Authority: HUMAN_GATES → LANES → BUDGET → NEXT_ACTION."
] as const;
