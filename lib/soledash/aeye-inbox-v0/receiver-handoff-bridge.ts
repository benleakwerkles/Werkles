import {
  createReceiverHandoffBundle,
  type ReceiverHandoffBundleResult,
} from "../../organism/contracts/receiver-handoff-bundle";
import type { AeyeMessagePacket } from "./protocol";
import { soledashAeyeOrganismPacketId } from "./organism-contract-mirror";

export type SoleDashAeyeReceiverHandoffBridgeResult = ReceiverHandoffBundleResult & {
  source_message_packet_id: string;
  organism_packet_id: string;
  receiver_work_proof_status: "pending_receiver_return";
  truth_boundary: string;
};

export async function createSoleDashAeyeReceiverHandoffBundle(input: {
  packet: AeyeMessagePacket;
  receiver?: string;
  base_url?: string;
  bundle_id?: string;
}): Promise<SoleDashAeyeReceiverHandoffBridgeResult> {
  const organismPacketId = soledashAeyeOrganismPacketId(input.packet.packet_id);
  const receiver = input.receiver?.trim() || `${input.packet.target_aeye}@${input.packet.target_machine}`;
  const bundle = await createReceiverHandoffBundle({
    packet_id: organismPacketId,
    receiver,
    base_url: input.base_url,
    bundle_id: input.bundle_id,
  });

  return {
    ...bundle,
    source_message_packet_id: input.packet.packet_id,
    organism_packet_id: organismPacketId,
    receiver_work_proof_status: "pending_receiver_return",
    truth_boundary:
      "This creates a blocked receiver-handoff return lane for SoleDash work. The included receipt template is not completion proof until the receiver fills and posts it.",
  };
}
