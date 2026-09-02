export type ReceiverProofLevel =
  | "receiver_return_enforced"
  | "canonical_custody_only"
  | "organism_receipt_mirrored"
  | "transport_receipt_mirrored"
  | "transport_ack_only"
  | "legacy_object_loop";

export type ReceiverProofBoundary = {
  schema: "harvey_nerdkle_receiver_proof_boundary_v0";
  receiver_proof_level: ReceiverProofLevel;
  receiver_work_proof_claimed: boolean;
  truth_boundary: string;
  next_safe_action: string;
};

const BOUNDARIES: Record<ReceiverProofLevel, Omit<ReceiverProofBoundary, "schema" | "receiver_proof_level">> = {
  receiver_return_enforced: {
    receiver_work_proof_claimed: true,
    truth_boundary:
      "A non-template returned receipt was posted through the receiver-handoff contract and joined to a packet_receipted event.",
    next_safe_action: "Review the posted receipt proof and any remaining blocked or partial fields.",
  },
  canonical_custody_only: {
    receiver_work_proof_claimed: false,
    truth_boundary:
      "This proves canonical packet or receipt custody, not that the downstream receiver completed work.",
    next_safe_action: "Require a separate receiver returned receipt before closing the work loop.",
  },
  organism_receipt_mirrored: {
    receiver_work_proof_claimed: true,
    truth_boundary:
      "A legacy route receipt was mirrored into the canonical organism receipt/event contract with source artifact proof.",
    next_safe_action:
      "Keep the organism receipt as the proof record, and use receiver-handoff bundles when the work crosses to another Aeye.",
  },
  transport_receipt_mirrored: {
    receiver_work_proof_claimed: false,
    truth_boundary:
      "A transport ACK was mirrored into the canonical organism receipt/event contract, but receiver work completion was not claimed.",
    next_safe_action:
      "Require a receiver-handoff returned receipt before treating the transported packet as completed work.",
  },
  transport_ack_only: {
    receiver_work_proof_claimed: false,
    truth_boundary:
      "This proves a packet was sent or acknowledged by a transport route, not that receiver work was attempted or completed.",
    next_safe_action: "Route the packet through a receiver-handoff return before claiming receiver work proof.",
  },
  legacy_object_loop: {
    receiver_work_proof_claimed: false,
    truth_boundary:
      "This proves a Nerdkle object-loop receipt, not an organism packet/receipt/event receiver-return contract.",
    next_safe_action: "Mirror the object receipt into the organism receiver-handoff contract before claiming receiver work proof.",
  },
};

export function receiverProofBoundary(level: ReceiverProofLevel): ReceiverProofBoundary {
  return {
    schema: "harvey_nerdkle_receiver_proof_boundary_v0",
    receiver_proof_level: level,
    ...BOUNDARIES[level],
  };
}
