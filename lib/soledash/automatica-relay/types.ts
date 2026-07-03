export type RelayCardState =
  | "READY"
  | "FIRED"
  | "SENT"
  | "WORKING"
  | "BLOCKED"
  | "RECEIPT RETURNED"
  | "EXPLODED";

export type {
  RelayArtifact,
  RelayArtifactGate,
  RelayArtifactKind,
  RelayCardNotes,
  RelayReceiptStrip,
  RelayCardActionKind,
  RelayFailureContext,
  RelayResultTranslation
} from "./artifact-types";
import type {
  RelayArtifact,
  RelayArtifactGate,
  RelayCardNotes,
  RelayReceiptStrip,
  RelayFailureContext,
  RelayResultTranslation
} from "./artifact-types";

export type RelayRouteKind = "cousin_outbox" | "petra_composer" | "spanzee_remote" | "none";

export type RelayCardCousin = "MAKER" | "ENDER" | "PETRA" | "DINK" | "BEAN" | null;

export type RelayCardId =
  | "spanzee_remote_check"
  | "ui_cleanup_across_screens"
  | "kindsir_com_cleanup"
  | "kind_sir_sue_research"
  | "kind_sir_grading_research";

export type RelayCardDef = {
  id: RelayCardId;
  name: string;
  targetAgent: string;
  targetComputer: string;
  taskType: string;
  expectedReceipt: string;
  ARTIFACT_REQUIRED: boolean;
  routeKind: RelayRouteKind;
  cousin: RelayCardCousin;
  missionText: string;
  nextActionReady: string;
};

export type RelayPacket = {
  packet_id: string;
  timestamp: string;
  card_id: RelayCardId;
  card_name: string;
  target: string;
  task: string;
  expected_receipt: string;
  ARTIFACT_REQUIRED: boolean;
  status: RelayCardState;
  mission_text: string;
};

export type RelayReceipt = {
  packet_id: string;
  card_id: RelayCardId;
  card_name: string;
  timestamp: string;
  updated_at: string;
  status: RelayCardState;
  success: boolean;
  packet_path: string;
  receipt_path: string;
  outbound_path: string | null;
  blocker: string | null;
  route_connected: boolean;
  error: string | null;
  stdout?: string | null;
  stderr?: string | null;
  next_action: string;
  next_missing_integration: string;
  ARTIFACT_REQUIRED: boolean;
  artifact_gate: RelayArtifactGate;
  artifacts: RelayArtifact[];
  relay_rejection?: import("@/protocol/index").RelayRejectionPayload | null;
};

export type RelayCardView = RelayCardDef & {
  state: RelayCardState;
  lastUpdate: string | null;
  nextAction: string;
  blocker: string | null;
  routeConnected: boolean;
  packetId: string | null;
  packetPath: string | null;
  receiptPath: string | null;
  live: boolean;
  artifactGate: RelayArtifactGate;
  /** Display owner — cousin override or target agent */
  owner: string;
  confidence: string;
  /** Proof-first artifacts — inspect before notes */
  artifacts: RelayArtifact[];
  receipt: RelayReceiptStrip;
  notes: RelayCardNotes;
  /** Populated when the last run failed — gates retry until operator opens failure output */
  failureContext: RelayFailureContext | null;
  /** Plain-English read of the last run — raw paths collapsed underneath */
  resultTranslation: RelayResultTranslation;
  /** Populated when ACK/receipt failed relay trust checks */
  relayRejection?: import("@/lib/soledash/guillotine/relay-rejection").RelayRejectionDetails | null;
};

export type RelayFireResult = {
  ok: boolean;
  card: RelayCardView;
  packet: RelayPacket;
  receipt: RelayReceipt;
};
