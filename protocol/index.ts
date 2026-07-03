/**
 * SoleDash Protocol Constitution v0.1
 * Owner: Dink / Doss — Maker imports and renders only.
 *
 * Vendored from Codex mission-lock-aeye-role-matrix-into/protocol/index.ts
 * when local sync is available. Do not add gate/proposal/routing policy here.
 */

export const SOLEDASH_PROTOCOL_VERSION = "soledash-protocol-v0.1" as const;

export type ProtocolSchemaVersion = typeof SOLEDASH_PROTOCOL_VERSION;

export type Mission = {
  id: string;
  label: string;
  summary: string;
};

export type CurrentChurn = {
  summary: string;
  current_threat: string;
  next_decision: string;
};

export type ThreadHealthItem = {
  status: string;
  detail: string | null;
};

/** Queue Brain — render slots only; Dink owns queue logic */
export type QueueBrain = {
  active_owner: string | null;
  waiting_report: string | null;
  blocker: string | null;
  recommended_next_action: string | null;
};

export type EvidenceStatus =
  | "CONFIRMED"
  | "OBSERVED"
  | "SUSPECTED"
  | "ASSUMED"
  | "HYPOTHESIS";

/** Receipt Center — every operator action logged visibly */
export type ReceiptCenterStatus =
  | "drafted"
  | "queued"
  | "sent"
  | "received"
  | "working"
  | "resolved"
  | "failed";

export type ReceiptCenterEntry = {
  action_id: string;
  target: string;
  owner: string | null;
  created_at: string;
  status: ReceiptCenterStatus;
  last_update: string;
  receipt_link: string | null;
  mock: boolean;
  /** Dink file-backed test receipt — still live transport */
  simulated?: boolean;
  /** Mock test harness receipt */
  mock_test?: boolean;
  /** Structured relay rejection when ACK/receipt failed trust checks */
  relay_rejection?: RelayRejectionPayload | null;
  failure_reason?: string | null;
};

export type RelayRejectionPayload = {
  reason_code: string;
  sender: string;
  expected_recipient: string;
  packet_id: string;
};

/** Dink writes one file per receipt under foreman/soledash/receipts/ */
export type TransportReceiptFile = {
  action_id: string;
  target: string;
  owner: string | null;
  created_at: string;
  updated_at: string;
  status: ReceiptCenterStatus;
  receipt_link: string | null;
  simulated?: boolean;
  relay_rejection?: RelayRejectionPayload | null;
  failure_reason?: string | null;
};

/** Dink writes one file per action under foreman/soledash/actions/ */
export type TransportActionFile = {
  action_id: string;
  action: string;
  proposal_id: string;
  phase: ActionLifecyclePhase;
  updated_at: string;
  message: string | null;
  route_owner?: string | null;
  simulated?: boolean;
  failure_reason?: string | null;
};

/** Permanent blocker slot — Dink supplies live text */
export type CurrentBlocker = {
  headline: string;
  detail: string | null;
  mock: boolean;
};

export type QueueRankSource = "MACHINE" | "OPERATOR" | "MIXED";

export type QueueOverrideAction =
  | "make_frontier"
  | "move_up"
  | "move_down"
  | "return_to_machine_order";

export type FrontierRef = {
  action_code: string;
  proposal_id: string;
  title: string;
};

/** Queue Override Protocol slots — Dink owns rank logic */
export type FrontierOverride = {
  machine_recommends: FrontierRef;
  operator_selected: FrontierRef | null;
  current_source: QueueRankSource;
  /** Overall queue state badge */
  queue_badge: QueueRankSource;
  /** Dink explains why machine ranked #1 */
  machine_why_number_one?: string | null;
};

export type FrontierQueueItem = {
  rank: number;
  proposal_id: string;
  title: string;
  evidence_status: EvidenceStatus | string;
  /** Dink-owned rank weight 0–1 */
  weight: number | null;
  weight_label: string | null;
  /** Queue Override Protocol — action code (e.g. P0-A002) */
  action_code?: string;
  machine_rank?: number;
  operator_rank?: number | null;
  final_rank?: number;
  /** Per-item rank source badge */
  rank_source?: QueueRankSource;
  /** Dink rank score 0–1 */
  score?: number | null;
  /** Lane owner */
  owner?: string | null;
};

export type ActionLifecyclePhase =
  | "idle"
  | "clicked"
  | "queued"
  | "sent"
  | "received"
  | "working"
  | "resolved"
  | "failed";

export type ActionLifecycle = {
  phase: ActionLifecyclePhase;
  action: string | null;
  /** Unique id for this operator click — created at click time */
  action_id: string | null;
  proposal_id: string | null;
  updated_at: string;
  message: string | null;
  /** Target cousin owner for routed actions */
  route_owner?: string | null;
  /** True when SoleDash simulated transport (mock mode) */
  mock?: boolean;
  /** Dink file-backed test action — still live transport */
  simulated?: boolean;
  failure_reason?: string | null;
};

export type Proposal = {
  id: string;
  title: string;
  summary: string;
  queue_behind: number;
  /** Dink-owned — how proven is this frontier ask */
  evidence_status: EvidenceStatus | string;
  action_code?: string;
};

export type RationaleFieldKey =
  | "why_this_exists"
  | "assumption"
  | "evidence"
  | "alternative_rejected"
  | "why_rejected"
  | "risk"
  | "why_now"
  | "test"
  | "owner"
  | "confidence";

export type Rationale = Record<RationaleFieldKey, string>;

/** Expand Why field order + labels — protocol-owned, not UI doctrine */
export const RATIONALE_FIELDS: { key: RationaleFieldKey; label: string }[] = [
  { key: "why_this_exists", label: "Why this exists" },
  { key: "assumption", label: "Assumption" },
  { key: "evidence", label: "Evidence" },
  { key: "alternative_rejected", label: "Alternative rejected" },
  { key: "why_rejected", label: "Why rejected" },
  { key: "risk", label: "Risk" },
  { key: "why_now", label: "Why now" },
  { key: "test", label: "Test" },
  { key: "owner", label: "Owner" },
  { key: "confidence", label: "Confidence" }
];

export type TransportGap = {
  headline: string;
  reason: string;
  manual_step: string | null;
  cousin_url: string | null;
};

export type HumanGate = {
  /** Opaque classification from Dink — not a UI enum */
  classification: string;
  operator_prompt: string;
  operator_line: string;
  detail: string | null;
  transport_gap: TransportGap | null;
};

export type DecisionButton = {
  id: string;
  label: string;
  enabled: boolean;
  reason_disabled: string | null;
  /** Cousin lane owner when this button routes (e.g. Thufir, Bean, Ender) */
  route_owner?: string | null;
};

export type Decision = {
  buttons: DecisionButton[];
  if_clicked: string | null;
};

export type DecisionReceipt = {
  receipt_id: string | null;
  kind: string | null;
  last_action: string | null;
  outcome: string | null;
  next_state: string | null;
  written_to: string | null;
  route_owner?: string | null;
};

export type OperatorIntent = {
  intent_id: string;
  created_at: string;
  raw_text: string;
  parsed_command: string | null;
  kind: string;
  target_proposal_id: string | null;
  summary: string;
  receipt_ref: string | null;
};

export type OperatorChatMessage = {
  role: "operator" | "system";
  text: string;
  at: string;
};

export type OperatorChatEntry =
  | { entry_type: "message"; message: OperatorChatMessage }
  | { entry_type: "operator_intent"; intent: OperatorIntent };

export type OperatorChat = {
  placeholder: string;
  entries: OperatorChatEntry[];
  pending_route: string | null;
};

export type ThroughputLogEntry = {
  label: string;
  detail: string;
};

export type DecisionSurfacePayload = {
  schema_version: ProtocolSchemaVersion;
  generated_at: string;
  generated_by: string;
  /** Dink live transport layer — Maker reads, never computes */
  live_transport?: boolean;
  mock?: boolean;
  updated_at?: string;
  active_owner?: string | null;
  frontier?: FrontierQueueItem | null;
  machine_frontier?: FrontierQueueItem | null;
  top_3_alternatives?: FrontierQueueItem[];
  queue_items?: FrontierQueueItem[];
  machine_why_number_one?: string | null;
  mission: Mission;
  current_churn: CurrentChurn;
  thread_health: ThreadHealthItem;
  queue_brain: QueueBrain;
  proposal: Proposal | null;
  rationale: Rationale | null;
  human_gate: HumanGate;
  decision: Decision;
  decision_receipt: DecisionReceipt;
  operator_chat: OperatorChat;
  /** Ranked frontier candidates — Dink owns weights */
  frontier_queue?: FrontierQueueItem[];
  /** Queue Override Protocol — machine vs operator frontier */
  frontier_override?: FrontierOverride | null;
  /** Permanent blocker — what prevents live reality */
  current_blocker?: CurrentBlocker | null;
  /** Seed entries — Dink appends live; Maker merges client actions in mock */
  receipt_center?: ReceiptCenterEntry[];
  /** Latest operator action transport state */
  action_lifecycle?: ActionLifecycle | null;
  throughput_log?: ThroughputLogEntry[];
};

export type DecisionSurfaceView = {
  payload: DecisionSurfacePayload;
  data_source: "dink" | "mock" | "unavailable";
  machine_label: string;
  load_error?: string | null;
  /** Operator-facing honesty banner — LIVE | PARTIAL LIVE | MOCK */
  reality_mode?: "LIVE" | "PARTIAL LIVE" | "MOCK";
  /** Workbench-created packets from the local command surface. */
  workbench_packets?: WorkbenchPacket[];
};

export type WorkbenchPacketStatus =
  | "proposed"
  | "ready"
  | "dispatched"
  | "blocked"
  | "dropped"
  | "deferred"
  | "escalated";

export type WorkbenchPacketReceipt = {
  id: string;
  state: string;
  at: string;
  written_to: string | null;
  next_state: string;
};

export type WorkbenchPacket = {
  id: string;
  title: string;
  mission_text: string;
  cousin: string;
  machine: string;
  status: WorkbenchPacketStatus;
  outbox_path: string | null;
  outbox_filename: string | null;
  blocker: string | null;
  updated_at: string;
  receipt: WorkbenchPacketReceipt | null;
};

/** MegaWork Home Cockpit — fleet row + operator home slots */
export type FleetMachineId = "betsy" | "doss" | "sally" | "spanzee";

/** Dink-owned fleet feed — foreman/soledash/FLEET_STATE.json */
export type FleetStateMachineEntry = {
  id: FleetMachineId;
  display_name: string;
  hostname: string;
  status: string;
  evidence_status: string;
  active_cousins: string;
  current_task: string | null;
  latest_receipt_path: string | null;
  blocker: string | null;
  remote_path_status: string;
  workstation_uniformity_status: string;
  needs_operator_touch: string | boolean;
};

export type FleetStateFile = {
  schema_version?: string;
  generated_at?: string;
  generated_by?: string;
  machines: FleetStateMachineEntry[];
};

export type FleetMachineCard = {
  id: FleetMachineId;
  label: string;
  display_name: string;
  hostname: string;
  /** Main badge — show literally including UNKNOWN */
  status: string;
  /** Confidence badge — show literally including UNKNOWN */
  evidence_status: string;
  active_cousins: string;
  current_task: string | null;
  latest_receipt_path: string | null;
  blocker: string | null;
  remote_path_status: string;
  workstation_uniformity_status: string;
  needs_operator_touch: string;
  /** Legacy alias for active_cousins */
  active_cousin: string;
  /** Ambient silhouette dot mapping */
  reality_mode: "LIVE" | "PARTIAL LIVE" | "MOCK" | "UNKNOWN";
  latest_receipt: string | null;
  latest_receipt_at: string | null;
  is_local: boolean;
  fleet_source: "fleet_state" | "unknown" | "betsy_live";
};

export type MegaWorkHomeView = {
  current_mission: string;
  active_machine: FleetMachineId;
  fleet: FleetMachineCard[];
  decisionView: DecisionSurfaceView;
};

export type DecisionActionRequest = {
  proposal_id: string;
  action: string;
};

export type DecisionActionResponse = {
  ok: boolean;
  mock: true;
  message: string;
  decision_receipt: DecisionReceipt;
  action_lifecycle: ActionLifecycle;
};

export type OperatorChatRequest = {
  text: string;
  proposal_id?: string | null;
};

export type OperatorChatResponse = {
  ok: boolean;
  mock: true;
  message: string;
  entry: OperatorChatEntry;
  decision_receipt: DecisionReceipt;
  pending_route: string | null;
};

/** Mock test harness — Petra-visible simulated action routes */
export type MockTestFailureMode =
  | "success"
  | "failed_transport"
  | "blocked_red_gate"
  | "waiting_for_owner"
  | "missing_live_payload";

export type MockTestRoute =
  | "continue"
  | "switch_frontier"
  | "needs_research"
  | "kill_test"
  | "human_reality"
  | "hands_gate"
  | "send_to_petra"
  | "test_spanzee";

export type MockTestResult = {
  action: string;
  route: MockTestRoute;
  status: ReceiptCenterStatus;
  receipt_id: string;
  action_id: string;
  would_happen_live: string;
  why_simulated: string;
  failure_mode: MockTestFailureMode;
  written_to: string | null;
  client_only: boolean;
  at: string;
};

export type MockTestRunResponse = {
  ok: boolean;
  mock_test: true;
  message: string;
  result: MockTestResult;
  receipt_entry: ReceiptCenterEntry;
  action_lifecycle: ActionLifecycle;
  decision_receipt: DecisionReceipt;
  lifecycle_steps: ActionLifecyclePhase[];
};

/** Dink/mock-test writer — foreman/soledash/receipts/mock_test_*.json */
export type MockTestReceiptFile = TransportReceiptFile & {
  mock_test?: boolean;
  route?: MockTestRoute;
  failure_mode?: MockTestFailureMode;
  would_happen_live?: string;
  why_simulated?: string;
};
