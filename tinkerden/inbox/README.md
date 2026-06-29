# TinkerDen Inbox Command Packet Contract V0

Packet ID: `FOOD_2_TINKERDEN_INBOX_CONTRACT_BUILD_2026-06-27`

This directory is the file-backed command inbox for TinkerDen Bridge / ThinkIt command issuance. It defines the minimum command packet shape required before a receiver can return `ACK`, `BLOCKER`, or `ARTIFACT`.

This contract is only for `/tinkerden/inbox` command packets. It is not Nerdkle / NMCLR proof, not MQTT work, not vector DB work, and not a new topology.

## Required File-Backed Surfaces

- `/tinkerden/inbox`
- `/tinkerden/receipts`
- `/tinkerden/recommendations/recommendation_cards.json`
- `/tinkerden/feedback/decision-ledger.jsonl`
- `/tinkerden/medulla/medulla.js`

## Required Command Packet Schema

Every command packet in this inbox must include these exact fields:

- `packet_id`
- `created_at`
- `from`
- `target`
- `stream`
- `mission`
- `context`
- `do`
- `do_not`
- `output_required`
- `receipt_required`

## Field Meanings

- `packet_id`: Stable unique string.
- `created_at`: ISO timestamp.
- `from`: `Ben` or issuing surface name.
- `target`: Verified `Aeye@Machine` destination.
- `stream`: Command stream, such as `FERAL / TINKERDEN`.
- `mission`: One-sentence command.
- `context`: Concrete background needed to execute.
- `do`: Ordered list of concrete actions.
- `do_not`: Ordered list of constraints.
- `output_required`: Concrete artifact or result expected.
- `receipt_required`: One of `ACK`, `BLOCKER`, or `ARTIFACT`.

## Validation Rules

- Missing `packet_id` = `BLOCKER`.
- Missing `target` = `BLOCKER`.
- `target` not formatted as `Aeye@Machine` = `BLOCKER`.
- Fake / unknown destination = `BLOCKER`.
- Missing `stream` = `BLOCKER`.
- Stream mismatch = `BLOCKER`.
- Missing `output_required` = `BLOCKER`.
- Vague `output_required` = `BLOCKER`.
- `receipt_required` not `ACK`, `BLOCKER`, or `ARTIFACT` = `BLOCKER`.
- A sample packet file is contract documentation, not runtime behavior proof.
- A command packet is not complete until a matching receipt appears in `/tinkerden/receipts`.

## Receipt Boundary

ACK is receipt only, not proof of completion.

Receipts must answer a packet with exactly one of:

- `ACK`: Receiver has accepted custody or read the packet.
- `BLOCKER`: Receiver cannot proceed and names the exact blocker.
- `ARTIFACT`: Receiver returns the requested concrete artifact or result.

A status of `sent`, `posted`, `queued`, or `written` is not a receipt.

## Receipt Example Schema

Receipt examples in `/tinkerden/receipts` use these exact fields:

- `receipt_id`
- `source_packet_id`
- `status`
- `created_at`
- `from`
- `evidence`
- `notes`

## Current Sample

See `command.sample.json` for a `Maker@Betsy` Medulla V0 implementation packet that includes the required V0 paths.
