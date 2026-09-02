import {
  createReceiverHandoffBundle,
  type ReceiverHandoffBundleResult,
} from "../organism/contracts/receiver-handoff-bundle";

export type WorkspaceRelayReceiverHandoffBridgeResult = ReceiverHandoffBundleResult & {
  relay_id: string;
  receiver_work_proof_status: "pending_receiver_return";
  truth_boundary: string;
};

export async function createWorkspaceRelayReceiverHandoffBundle(input: {
  packet_id: string;
  relay_id: string;
  receiver: string;
  base_url?: string;
  bundle_id?: string;
}): Promise<WorkspaceRelayReceiverHandoffBridgeResult> {
  const bundle = await createReceiverHandoffBundle({
    packet_id: input.packet_id,
    receiver: input.receiver,
    base_url: input.base_url,
    bundle_id: input.bundle_id,
  });

  return {
    ...bundle,
    relay_id: input.relay_id,
    receiver_work_proof_status: "pending_receiver_return",
    truth_boundary:
      "This creates a blocked receiver-handoff return lane for Workspace Relay work. The runner receipt remains custody proof only until the receiver fills and posts a non-template returned receipt.",
  };
}
