# NMCLR_METABOLISM_V0

Generated: 2026-06-24

Destination: TinkerDen Intake, Speaker

## METABOLISM:

Metabolism is receipt digestion into future behavior.

It is not a new organ.

It is the disciplined use of existing receipts to change what the organism does next:

`receipt -> learning -> future behavior`

In NMCLR terms:

- Nerves notice.
- Breathing proves intake/process/exhale.
- Muscle proves packet/work/artifact.
- Metabolism converts proven receipts into future constraints, defaults, warnings, packets, or behavior changes.

Metabolism is proven only when a receipt is read, a lesson is extracted, and a later action or durable rule changes because of that lesson.

A receipt sitting in a folder is not metabolism.

A summary of a receipt is not metabolism.

A doctrine sentence is not metabolism unless it affects a future action path.

## INPUT:

Metabolism can digest only durable artifacts.

Primary inputs:

- Respiratory receipts proving `intake -> process -> exhale`.
- Muscle receipts proving `packet -> work -> artifact`.
- Successful inheritance events proving `READ -> DERIVED ACTION -> WRITE`.
- False delivery / false motion / false breathing receipts.
- Human Gate decision receipts.
- Branch Truth / Shared Reality receipts.
- TinkerDen packet engine preservation receipts.
- Receipt pickup rows that point to real readable receipts.

Minimum input fields:

- `source_receipt_id`
- `source_receipt_path`
- `source_receipt_hash`
- `source_receipt_type`
- `source_status`
- `read_by`
- `read_timestamp`
- `lesson_candidate`
- `evidence_quote_or_field`

Input rules:

- If the receipt cannot be read, it cannot be metabolized.
- If the receipt has no hash/path/id, it is weak input.
- If the receipt is sender-side only, metabolism status stays `UNVERIFIED`.
- If the receipt already says `PARTIAL`, `BLOCKED`, or `UNVERIFIED`, metabolism must preserve that uncertainty.

## OUTPUT:

Metabolism outputs behavior-shaping artifacts, not another control system.

Valid outputs:

- A new constraint added to an existing packet template.
- A new Human Gate rule or warning added to an existing decision surface.
- A default behavior changed for future packets.
- A repeated failure converted into a checklist item.
- A stale/broken pattern marked as `DO_NOT_REPEAT`.
- A receipt trust rule added to an existing standard.
- A future action packet that cites the source receipt.
- A successful inheritance candidate that cites the source receipt and derived artifact.

Minimum output fields:

- `metabolism_id`
- `source_receipt_id`
- `source_receipt_path`
- `source_receipt_hash`
- `lesson`
- `behavior_delta`
- `target_surface`
- `derived_artifact_path`
- `derived_artifact_hash`
- `human_gate_required`
- `status`: `CANDIDATE`, `APPLIED`, `BLOCKED`, `REJECTED`
- `evidence`
- `created_at`

Output rules:

- Output must cite the receipt it learned from.
- Output must name the future behavior it changes.
- Output must be durable: file, packet, receipt, checklist, rule, or action record.
- Output must not claim inheritance until a later read-derived-write event is proven.

## FIRST BUILDABLE VERSION:

Build one boring digestion ledger.

File-backed V0:

- `data/organism/metabolism_candidates.jsonl`

Each row records:

```json
{
  "metabolism_id": "string",
  "source_receipt_id": "string",
  "source_receipt_path": "string",
  "source_receipt_hash": "string",
  "source_receipt_type": "string",
  "lesson": "string",
  "behavior_delta": "string",
  "target_surface": "string",
  "derived_artifact_path": "string",
  "human_gate_required": true,
  "status": "CANDIDATE",
  "evidence": "string",
  "created_at": "ISO-8601 string"
}
```

Smallest workflow:

1. Receipt pickup finds a durable receipt.
2. Human or supervised script reads the receipt.
3. A metabolism candidate is written with one lesson and one proposed behavior delta.
4. If the delta is safe and local, it may update an existing checklist/template/standard.
5. If the delta changes consequence, canonical truth, doctrine, code, branch state, production, accounts, or secrets, it waits for a Human Gate.
6. A later action that uses the lesson can become a successful inheritance candidate.

First useful examples:

- Source: false delivery receipt.
  - Lesson: sender-side storage does not prove delivery.
  - Behavior delta: future receipts must include receiver readback before `DELIVERED`.

- Source: static cockpit demotion receipt.
  - Lesson: static review surfaces must not claim active execution.
  - Behavior delta: future cockpit pages must label static/audit surfaces visibly.

- Source: muscle receipt standard.
  - Lesson: packet existence does not prove motion.
  - Behavior delta: future EXECUTE buttons must write packet, work, artifact, and receipt proof before showing PASS.

## DO NOT BUILD:

- Do not build a new organ.
- Do not build Atlas expansion.
- Do not build a vector database.
- Do not build semantic memory search as V0.
- Do not build a dashboard.
- Do not build an autonomous doctrine assimilator.
- Do not build always-on hidden digestion daemons.
- Do not let receipt summaries become behavior changes without source receipt links.
- Do not auto-promote `CANDIDATE` lessons into doctrine.
- Do not overwrite packet templates, branch state, production, secrets, or canonical truth without a Human Gate.
- Do not treat localStorage, chat memory, or static cockpit state as metabolism proof.
- Do not claim successful inheritance until `READ -> DERIVED ACTION -> WRITE` is proven.

## Smallest Rule

Metabolism is not remembering that a receipt exists.

Metabolism is changing the next action because a receipt was understood.
