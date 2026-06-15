export type LiveFirePhase =
  | "packet_created"
  | "send_attempted"
  | "awaiting_response"
  | "receipt_returned"
  | "failed";

export type LiveFireFailureClass =
  | "no_target_link_configured"
  | "browser_cannot_reach_endpoint"
  | "file_written_but_not_transmitted"
  | "transmitted_but_no_receipt"
  | "receipt_exists_but_ui_did_not_refresh"
  | null;

export type LiveFirePacket = {
  packet_id: string;
  timestamp: string;
  source: "Starship Explode";
  target: "Petra";
  message: "LIVE FIRE TEST";
};

export type LiveFirePhaseEntry = {
  phase: LiveFirePhase;
  at: string;
  detail: string;
};

export type LiveFireReceipt = {
  action_id: string;
  packet_id: string;
  target: string;
  owner: string;
  created_at: string;
  updated_at: string;
  status: "resolved" | "failed";
  receipt_link: string;
  simulated: false;
  live_fire_petra: true;
  packet: LiveFirePacket;
  success: boolean;
  outbound_path: string;
  outbound_url: string | null;
  transport_engine: string | null;
  failure_class: LiveFireFailureClass;
  error: string | null;
  next_missing_integration: string;
  phases: LiveFirePhaseEntry[];
};

export type LiveFireApiResult = {
  ok: boolean;
  packet: LiveFirePacket;
  receipt: LiveFireReceipt;
  receipt_path: string;
  ui_should_refresh: boolean;
  failure_class: LiveFireFailureClass;
  error: string | null;
};
