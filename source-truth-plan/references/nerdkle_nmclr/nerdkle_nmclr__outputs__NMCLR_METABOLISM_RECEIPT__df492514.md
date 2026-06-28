# NMCLR_METABOLISM_RECEIPT

Generated: 2026-06-24

Destination: TinkerDen Intake, Speaker

## METABOLISM:

Metabolism becomes real when a receipt changes future behavior.

The required chain is:

`receipt -> learning -> future behavior`

A receipt has been metabolized only when:

1. A durable receipt is read.
2. A specific lesson is extracted from that receipt.
3. The lesson is written into a durable behavior-shaping artifact.
4. A later packet, decision, warning, checklist, gate, default, or action path changes because of it.

Metabolism is not a new organ. It is digestion inside the existing receipt, packet, decision, and action surfaces.

## MINIMUM PROOF:

Minimum metabolism proof requires four joined records.

Source receipt proof:

- `source_receipt_id`
- `source_receipt_path`
- `source_receipt_hash`
- `source_receipt_type`
- `source_receipt_status`

Read proof:

- `read_by`
- `read_timestamp`
- `read_method`
- `read_receipt_path`

Learning proof:

- `lesson_id`
- `lesson`
- `evidence_from_receipt`
- `uncertainty_status`: `PROVEN`, `PARTIAL`, `UNVERIFIED`, or `BLOCKED`

Future behavior proof:

- `behavior_delta`
- `target_surface`
- `derived_artifact_path`
- `derived_artifact_hash`
- `applied_at`
- `later_action_or_packet_id`
- `evidence_that_future_behavior_changed`

Minimum status rule:

- `METABOLISM_CANDIDATE`: receipt read and lesson extracted.
- `METABOLISM_PARTIAL`: behavior delta written, but no later behavior has used it yet.
- `METABOLISM_PROVEN`: later behavior changed and cites the source receipt/lesson.
- `METABOLISM_BLOCKED`: receipt, read, lesson, or behavior proof is missing.

## FALSE METABOLISM:

False metabolism is when the organism appears to learn but no future behavior changes.

False cases:

1. A receipt is stored but never read.
2. A receipt is summarized but no lesson is extracted.
3. A lesson is extracted but not written anywhere durable.
4. A checklist or doctrine note is written but no future action uses it.
5. A future action happens, but it does not cite the source receipt or lesson.
6. A dashboard displays receipt counts and calls that learning.
7. A vector/semantic match says two artifacts are related but no behavior changes.
8. A chat memory claim replaces file-backed proof.
9. A static cockpit/localStorage state claims learning without file-backed output.
10. A receipt with `PARTIAL`, `BLOCKED`, or `UNVERIFIED` status is metabolized as if it were proven.

Rule:

If the chain cannot join source receipt, read event, lesson, and future behavior delta, the status is not `METABOLISM_PROVEN`.

## GO / CONDITIONAL GO / NO-GO:

GO:

- Lock metabolism as receipt digestion into future behavior.
- Use `METABOLISM_CANDIDATE`, `METABOLISM_PARTIAL`, `METABOLISM_PROVEN`, and `METABOLISM_BLOCKED`.
- Store V0 metabolism rows in `data/organism/metabolism_candidates.jsonl` or an equivalent file-backed ledger.

CONDITIONAL GO:

- A supervised script may propose metabolism candidates from durable receipts.
- Safe, local, reversible behavior deltas may be applied to existing checklists, packet templates, warnings, or receipt standards.
- Any delta touching doctrine, canonical truth, branch state, production, secrets, accounts, deployments, or destructive actions requires a Human Gate.

NO-GO:

- Do not build a new organ.
- Do not build Atlas expansion, vector DB, semantic memory, dashboard, or hidden daemon for V0.
- Do not claim metabolism from receipt pickup alone.
- Do not claim metabolism from summaries alone.
- Do not auto-promote lessons into doctrine.
- Do not claim successful inheritance until a later `READ -> DERIVED ACTION -> WRITE` event is proven.

## Smallest Rule

Metabolism is real only when yesterday's receipt changes tomorrow's behavior.
