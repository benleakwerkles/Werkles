export const TINKERDEN_AEYES = ["Bean", "Ender", "Maker", "Dink", "Skybro", "Thufir"] as const;

export type TinkerDenAeye = (typeof TINKERDEN_AEYES)[number];

export type TinkerDenPacketStatus =
  | "DRAFT"
  | "RELAY_READY"
  | "PACKET_RELAY_READY"
  | "AUTOPASTE_READY"
  | "DISPATCHED"
  | "AWAITING_RECEIPT"
  | "SENT"
  | "WORKING"
  | "RECEIPT_RETURNED"
  | "VALIDATED"
  | "ASSIMILATED"
  | "BLOCKED"
  | "MISSING_RECEIPT"
  | "KILLED";

export type TinkerDenReceiptType = "artifact" | "decision" | "proof" | "blocker" | "change_capsule";

export type TinkerDenPacket = {
  packet_id: string;
  created_at: string;
  origin: string;
  assigned_to: TinkerDenAeye;
  machine: string;
  mission: string;
  why: string;
  owner: string;
  reviewer: string;
  return_destination: string;
  receipt_required: boolean;
  receipt_type: TinkerDenReceiptType;
  due_status: string;
  assimilation_destination: string;
  status: TinkerDenPacketStatus;
};

export type TinkerDenReceipt = {
  receipt_id: string;
  packet_id: string;
  returned_by: string;
  artifact_link: string;
  summary: string;
  proof: string;
  blockers: string;
  next_recommended_action: string;
  timestamp: string;
};

export type TinkerDenAssimilation = {
  assimilation_id: string;
  receipt_id: string;
  speaker_update_required: boolean;
  doctrine_update_required: boolean;
  registry_update_required: boolean;
  change_capsule_required: boolean;
  affected_organs: string[];
  final_status: "PENDING" | "ASSIMILATED" | "BLOCKED" | "KILLED";
};

export type TinkerDenEvent = {
  event_id: string;
  packet_id: string;
  event: string;
  timestamp: string;
  details?: string;
};

export type TinkerDenState = {
  schema: "tinkerden_return_system_v0";
  updated_at: string;
  packets: TinkerDenPacket[];
  receipts: TinkerDenReceipt[];
  assimilations: TinkerDenAssimilation[];
  events: TinkerDenEvent[];
};

export type TinkerDenAction =
  | "send_packet"
  | "mark_working"
  | "attach_receipt"
  | "validate_receipt"
  | "assimilate"
  | "escalate_missing"
  | "kill_packet";

export type TinkerDenActionResult = {
  ok: boolean;
  action: TinkerDenAction;
  error?: string;
  state: TinkerDenState;
};
