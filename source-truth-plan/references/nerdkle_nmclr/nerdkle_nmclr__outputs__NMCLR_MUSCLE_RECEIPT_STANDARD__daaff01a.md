# NMCLR_MUSCLE_RECEIPT_STANDARD

Generated: 2026-06-24

Destination: TinkerDen Intake, Speaker

## Proof Of Motion Definition

An NMCLR muscle receipt proves one complete action chain:

`packet -> work -> artifact`

We can honestly say motion occurred only when a specific packet is causally linked to specific work, and that work is linked to a specific artifact.

The receipt must not claim motion from intent, UI state, chat text, branch names, or file presence alone.

## MOTION_PROOF:

Motion is proven only when all three stages are present and linked.

Packet proof:

- `packet_id`: stable packet identifier.
- `packet_path`: exact packet path or URL.
- `packet_hash`: hash of the packet bytes at time of pickup.
- `packet_created_at`: packet timestamp.
- `packet_producer`: human, Aeye, script, or service that produced it.
- `requested_action`: the exact requested work.
- `human_gate_status`: `NOT_REQUIRED`, `APPROVED`, `REQUIRED`, or `BLOCKED`.

Work proof:

- `work_actor`: human, Aeye, script, command, or service that performed the work.
- `source_machine`: machine where work ran.
- `work_cwd`: working directory if applicable.
- `work_branch`: branch/worktree if applicable.
- `work_started_at`
- `work_completed_at`
- `work_action`: exact command, tool call, script, or manual operation.
- `work_input_packet_hash`: must match `packet_hash`.
- `work_status`: `PASS`, `PARTIAL`, `BLOCKED`, or `FAIL`.
- `work_log_path`: log, transcript, action receipt, or command output path.

Artifact proof:

- `artifact_path`: exact produced or changed artifact path.
- `artifact_hash`: hash after work completed.
- `artifact_bytes`: byte count after work completed.
- `artifact_timestamp`: write or verification timestamp.
- `artifact_change_evidence`: diff path, before/after hash, changed-file list, screenshot, readback receipt, or test result.
- `artifact_readback_method`: file readback, repo diff, test run, browser screenshot, receiver readback, or checksum verification.

Causality proof:

- The packet id must appear in the work receipt or action log.
- The work receipt must cite the packet hash.
- The artifact evidence must cite the work receipt or action id.
- If any one link is missing, the status is `PARTIAL_MOTION`, not `MOTION_PROVEN`.

## MINIMUM_RECEIPT:

Every muscle receipt must include:

- `schema_version`
- `receipt_id`
- `motion_id`
- `mission`
- `created_at`
- `created_by`
- `source_machine`
- `destination`
- `packet_id`
- `packet_path`
- `packet_hash`
- `packet_created_at`
- `packet_producer`
- `requested_action`
- `human_gate_status`
- `human_gate_receipt_path`
- `work_actor`
- `work_cwd`
- `work_branch`
- `work_started_at`
- `work_completed_at`
- `work_action`
- `work_input_packet_hash`
- `work_status`
- `work_log_path`
- `artifact_path`
- `artifact_hash`
- `artifact_bytes`
- `artifact_timestamp`
- `artifact_change_evidence`
- `artifact_readback_method`
- `causality_status`
- `overall_status`
- `missing_proof`
- `false_motion_checks`
- `blockers`

Recommended status values:

- `PACKET_PROVEN`
- `PACKET_UNVERIFIED`
- `WORK_PROVEN`
- `WORK_PARTIAL`
- `WORK_BLOCKED`
- `ARTIFACT_PROVEN`
- `ARTIFACT_PARTIAL`
- `MOTION_PROVEN`
- `PARTIAL_MOTION`
- `FALSE_MOTION`

## FALSE_MOTION_CASE:

False motion means the system appears to have acted, but no complete packet-work-artifact chain exists.

Examples:

1. A packet exists, but no work receipt or action log cites it.
2. Work ran, but no packet id or packet hash is linked to the run.
3. An artifact exists, but it predates the packet or has no before/after evidence.
4. A static cockpit button changes browser state but creates no file-backed artifact.
5. A branch, screenshot, or preview exists, but no action receipt proves how it was produced.
6. A command started but failed, and the receipt still claims `MOTION_PROVEN`.
7. A bridge copied a receipt, but no work occurred from that receipt.
8. A watcher saw a packet and logged it, but no worker consumed it.
9. A generated artifact has no hash, byte count, or readback.
10. Chat says "done" but no packet, work, and artifact evidence can be joined.

Rule:

If the packet, work, and artifact cannot be joined by id/hash/path evidence, the overall status must not be `MOTION_PROVEN`.

Use:

- `FALSE_MOTION` when the surface implies action but the chain is missing.
- `PARTIAL_MOTION` when the receipt honestly names the missing link.
- `MOTION_PROVEN` only when all three stages and the causal join are present.

## GO / CONDITIONAL GO / NO-GO:

GO:

- Adopt this standard for packet execution, cockpit action receipts, branch salvage action receipts, and TinkerDen packet engine proof.
- Use it whenever an action claims that a packet caused work and produced an artifact.

CONDITIONAL GO:

- Automation may generate candidate muscle receipts from packet logs, command logs, diffs, and artifact hashes.
- Candidate receipts must remain `PARTIAL_MOTION` until packet, work, artifact, and readback are joined.
- Work automation is allowed only inside the action scope already approved by the packet and any required Human Gate.

NO-GO:

- No `MOTION_PROVEN` claim from packet existence alone.
- No `MOTION_PROVEN` claim from artifact existence alone.
- No motion claim from UI state, localStorage, preview presence, or chat summary.
- No execution of human-gated actions without an approval receipt for the exact action, target, and payload.
- No destructive cleanup, merge, deploy, push, secret change, account change, or canonical promotion under muscle automation without a fresh Human Gate.

## Smallest Operating Rule

Packet is intent.

Work is movement.

Artifact is footprint.

Motion is proven only when the same receipt chain ties all three together.
