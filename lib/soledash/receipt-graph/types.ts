export type ReceiptGraphSource =
  | "action_receipt"
  | "approval_swatter"
  | "automatica_relay"
  | "focus_theft"
  | "intent_memory"
  | "intent_router"
  | "permission_fly"
  | "soledash_transport"
  | "wisdom_watch"
  | "unknown";

export type ReceiptGraphRelation =
  | "parent_child"
  | "follow_up"
  | "originating_card"
  | "originating_policy"
  | "originating_dispatch";

export type ReceiptGraphOrigin = {
  cardId: string | null;
  policyId: string | null;
  dispatchId: string | null;
  packetId: string | null;
  actionId: string | null;
  buildId: string | null;
};

export type ReceiptGraphNode = {
  id: string;
  source: ReceiptGraphSource;
  title: string;
  status: string | null;
  timestamp: string | null;
  paths: string[];
  aliases: string[];
  parentReceiptId: string | null;
  childReceiptIds: string[];
  followUpReceiptIds: string[];
  originating: ReceiptGraphOrigin;
  raw: Record<string, unknown>;
};

export type ReceiptOriginNode = {
  id: string;
  kind: "card" | "policy" | "dispatch";
  label: string;
};

export type ReceiptGraphEdge = {
  id: string;
  from: string;
  to: string;
  relation: ReceiptGraphRelation;
  label: string;
};

export type ReceiptGraph = {
  generatedAt: string;
  nodes: ReceiptGraphNode[];
  originNodes: ReceiptOriginNode[];
  edges: ReceiptGraphEdge[];
  aliases: Record<string, string>;
};

export type ReceiptGraphLookupResult = {
  ok: boolean;
  receiptId: string;
  resolvedId: string | null;
  node: ReceiptGraphNode | null;
  graph: ReceiptGraph | null;
  blocker: string | null;
};

export type ReceiptChainLookupResult = {
  ok: boolean;
  receiptId: string;
  resolvedId: string | null;
  chain: ReceiptGraphNode[];
  edges: ReceiptGraphEdge[];
  blocker: string | null;
};

export type ReceiptDependencyLookupResult = {
  ok: boolean;
  receiptId: string;
  resolvedId: string | null;
  node: ReceiptGraphNode | null;
  parentReceipt: ReceiptGraphNode | null;
  childReceipts: ReceiptGraphNode[];
  followUpReceipts: ReceiptGraphNode[];
  originatingCard: ReceiptOriginNode | null;
  originatingPolicy: ReceiptOriginNode | null;
  originatingDispatch: ReceiptOriginNode | null;
  blocker: string | null;
};
