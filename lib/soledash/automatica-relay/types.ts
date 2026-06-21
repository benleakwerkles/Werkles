export type RelayCardState =
  | "READY"
  | "FIRED"
  | "SENT"
  | "WORKING"
  | "BLOCKED"
  | "RECEIPT RETURNED"
  | "EXPLODED";

export type RelayRouteKind = "cousin_outbox" | "petra_composer" | "spanzee_remote" | "none";

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
  routeKind: RelayRouteKind;
  cousin: "MAKER" | "ENDER" | "PETRA" | "DINK" | null;
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
  next_action: string;
  next_missing_integration: string;
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
};

export type RelayFireResult = {
  ok: boolean;
  card: RelayCardView;
  packet: RelayPacket;
  receipt: RelayReceipt;
};
