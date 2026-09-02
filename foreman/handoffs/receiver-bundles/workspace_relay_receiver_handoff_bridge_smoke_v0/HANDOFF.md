# Receiver Handoff Bundle: workspace_relay_handoff_book_architecture_workspace_relay_receiver_handoff_bridge_v0_mr8zc3os

Receiver: Maker@Betsy
Packet lane: TinkerDen workspace relay
Packet from/to: TinkerDenWorkspaceRelay@Betsy -> Maker@Betsy
Generated: 2026-07-06T08:50:13.811Z

## Files

- Packet copy: `foreman/handoffs/receiver-bundles/workspace_relay_receiver_handoff_bridge_smoke_v0/packet.json`
- Receipt template: `foreman/handoffs/receiver-bundles/workspace_relay_receiver_handoff_bridge_smoke_v0/receipt-template.json`
- Manifest: `foreman/handoffs/receiver-bundles/workspace_relay_receiver_handoff_bridge_smoke_v0/manifest.json`

## Packet Readback

- packet_id: `workspace_relay_handoff_book_architecture_workspace_relay_receiver_handoff_bridge_v0_mr8zc3os`
- requested_action: Hand the workspace relay packet to the receiver and require a non-template returned receipt before claiming work completion.
- operator_intent: Prove Workspace Relay can open a pending receiver-handoff return lane after custody proof.
- acceptance_criteria: Workspace relay custody packet is mirrored into the organism contract store.; Receiver handoff bundle is created.; Receipt template remains blocked until receiver proof is returned.
- stop_conditions: receiver_receipt_missing; source_missing; contract_schema_invalid
- packet_sha256: `d0b6c50e3d5b705c0917a0483a6311219cbec9d608eb9cfdb05af1f336cbad33`

## Return Command

Edit the receipt template with real receiver proof, then run:

```powershell
node scripts/foreman/organism-receiver-receipt-post.mjs --receipt foreman/handoffs/receiver-bundles/workspace_relay_receiver_handoff_bridge_smoke_v0/receipt-template.json --base-url http://127.0.0.1:3000 --detected-by Maker@Betsy
```

## Truth Boundary

The included receipt template is intentionally `blocked` with `TEMPLATE_NOT_FILLED`. Change it only when the receiver has real proof. A posted template is not completion proof.
