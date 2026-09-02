# Receiver Handoff Bundle: soledash_aeye_transport_soledash_aeye_handoff_book_architecture_soledash_aeye_receiver_handoff_bridge_v0_mr8z7eyi

Receiver: Dink@Betsy
Packet lane: SoleDash Aeye transport
Packet from/to: SoleDash Receiver Handoff Bridge Smoke -> Dink@Betsy
Generated: 2026-07-06T08:46:35.144Z

## Files

- Packet copy: `foreman/handoffs/receiver-bundles/soledash_aeye_receiver_handoff_bridge_smoke_v0/packet.json`
- Receipt template: `foreman/handoffs/receiver-bundles/soledash_aeye_receiver_handoff_bridge_smoke_v0/receipt-template.json`
- Manifest: `foreman/handoffs/receiver-bundles/soledash_aeye_receiver_handoff_bridge_smoke_v0/manifest.json`

## Packet Readback

- packet_id: `soledash_aeye_transport_soledash_aeye_handoff_book_architecture_soledash_aeye_receiver_handoff_bridge_v0_mr8z7eyi`
- requested_action: Record transport custody for a SoleDash Aeye packet.
- operator_intent: Transport a SoleDash Aeye message and preserve canonical custody proof.
- acceptance_criteria: SoleDash message packet is written to outbox.; Canonical organism packet mirror is written.; Receiver work proof remains separate from transport ACK proof.
- stop_conditions: Stop if the destination is not verified.; Stop if the transport packet cannot be written or read back.
- packet_sha256: `f8e89e523be90b16fe887dcbf50b9ad18b48ecee42bcc2951a6511e92a731a3e`

## Return Command

Edit the receipt template with real receiver proof, then run:

```powershell
node scripts/foreman/organism-receiver-receipt-post.mjs --receipt foreman/handoffs/receiver-bundles/soledash_aeye_receiver_handoff_bridge_smoke_v0/receipt-template.json --base-url http://127.0.0.1:3000 --detected-by Dink@Betsy
```

## Truth Boundary

The included receipt template is intentionally `blocked` with `TEMPLATE_NOT_FILLED`. Change it only when the receiver has real proof. A posted template is not completion proof.
