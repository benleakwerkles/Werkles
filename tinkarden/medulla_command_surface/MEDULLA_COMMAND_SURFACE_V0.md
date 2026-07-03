# Medulla Command Surface V0

Packet ID: `DINK_BETSY_TINKERDEN_MEDULLA_COMMAND_SURFACE_V0_2026_06_27`

## Purpose

The Medulla Command Surface V0 is the smallest durable interface between operator intent and file-backed command custody. Its purpose is to let Ben issue a command, bind it to a target surface, hold it behind the correct gate, and require a returned `ACK`, `BLOCKER`, or `ARTIFACT` receipt before the command can be treated as complete.

This surface exists to feed Dink@Betsy with concrete command artifacts without pretending that routing, packet presence, or a `SENT` state is build proof.

## Scope

V0 defines the command object, receipt event object, lifecycle states, proof boundary, and forbidden crossings for TinkerDen / Medulla command intake.

V0 is limited to:

- File-backed command records.
- File-backed receipt events.
- Human-readable lifecycle rules.
- Operator gate state definitions.
- Proof rules for cockpit / membrane command work.

## Non-Goals

V0 does not:

- Build Feral UI.
- Build a full TinkerDen cockpit UI.
- Build Nerdkle or NMCLR proof body.
- Create autonomous execution.
- Create Force Live behavior.
- Route work to Swanson.
- Treat `SENT`, chat text, intent, or a packet write as a receipt.
- Prove cross-machine execution unless a receiver-side receipt says so.

## Command Lifecycle

1. `DRAFT`: Operator intent has been captured but is not yet a command.
2. `PREVIEWED`: A command object can be inspected before write.
3. `GATE_PENDING`: The command requires operator approval before writing or dispatch.
4. `APPROVED`: The required operator gate is satisfied.
5. `WRITTEN`: The command object is written to the command inbox.
6. `RECEIPT_PENDING`: A receipt is required and has not returned yet.
7. `ACK`: Receiver confirms command custody or receipt of command.
8. `BLOCKER`: Receiver reports the exact missing path, access, decision, or input.
9. `ARTIFACT`: Receiver returns a concrete artifact path or proof reference.
10. `STALE`: Receipt has not returned inside the expected window.
11. `CLOSED`: Receipt has been read, linked, and archived.

## Operator Gate States

- `NO_GATE_REQUIRED`: Safe local reversible command, still receipt-required.
- `HUMAN_GATE_REQUIRED`: Command can affect workflow, data, external systems, payments, secrets, or production.
- `APPROVED`: Ben or the authorized operator explicitly approved the action.
- `DEFERRED`: Command is held without execution.
- `KILLED`: Command is rejected and must not be revived without a new command.
- `BLOCKED`: Required gate input, path, authority, or recipient is missing.

## Receipt Lifecycle

1. `RECEIPT_REQUIRED`: Every command that leaves draft state must have a receipt expectation.
2. `RECEIPT_EMPTY`: No matching receipt exists yet.
3. `RECEIPT_STALE`: No matching receipt has returned before the stale window.
4. `ACK`: Receiver claims custody, read, or acceptance.
5. `BLOCKER`: Receiver names the single blocker preventing completion.
6. `ARTIFACT`: Receiver returns an artifact path, hash, screenshot, or other required proof.
7. `LINKED`: Receipt is linked to command_id and packet_id.
8. `CLOSED`: Receipt has been displayed and recorded.

## Minimum Viable Command Fields

- `command_id`
- `operator_intent`
- `target_surface`
- `command_type`
- `risk_level`
- `gate_required`
- `current_state`
- `created_at`
- `updated_at`
- `receipt_required`
- `parent_command_id`
- `source_packet_id`

## Failure States

- `SCHEMA_INVALID`: Command or receipt does not match the schema.
- `TARGET_MISSING`: Target surface is unknown or unavailable.
- `GATE_MISSING`: Required operator gate has not been satisfied.
- `RECEIPT_MISSING`: No receipt exists for the command.
- `RECEIPT_STALE`: Receipt did not return inside the expected window.
- `RECEIPT_UNLINKED`: Receipt cannot be linked to command_id or packet_id.
- `BLOCKER_RETURNED`: Receiver returned a blocker instead of proof.
- `ARTIFACT_MISSING`: Receiver claimed artifact but did not provide artifact_path.
- `FORBIDDEN_CROSSING`: Command attempts to enter a prohibited lane.

## What Counts As Proof

Proof is a receiver-side `ACK`, `BLOCKER`, or `ARTIFACT` receipt linked to the command.

Proof may include:

- A receipt event with matching `command_id`.
- A receipt event with matching `packet_id`.
- A concrete `artifact_path`.
- A blocker with exact missing path, repo, input, access, or human gate.
- A timestamped receipt event in the receipt log.

The following do not count as proof:

- `SENT`.
- Chat text saying work happened.
- A command object existing without a receipt.
- A packet object existing without receiver-side read or receipt.
- A UI badge that is not backed by a receipt event.
- A claimed artifact with no path.

## Forbidden Crossings

This surface must not cross into:

- Feral shell build.
- Nerdkle / NMCLR proof body.
- Book or manuscript work.
- Petra@Sally receipt ops.
- Swanson routing.
- Autonomous execution.
- Force Live behavior.
- Payment, secrets, external account, or production actions without a human gate.
- Any claim that `SENT` equals a receipt.
