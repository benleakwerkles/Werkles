# CREATOR_OPERATOR_MODEL_V0

Generated: 2026-06-24

Destination: TinkerDen Intake, Speaker

## Chain

`Creator -> Intent -> Organism -> Action -> Receipt -> Inheritance`

Smallest distinction:

- Creator originates meaning.
- Operator chooses consequence.
- Organism carries approved motion and leaves evidence.

## CREATOR:

The Creator is the source of intent.

Creator answers:

- Why does this matter?
- What is being asked for?
- What must not happen?
- What would count as success?

Creator produces intent, constraints, and success criteria. Creator does not automatically execute. Creator can be Ben, Petra, an Aeye, a prior receipt, a doctrine artifact, or a manuscript artifact, but the creator role is the origin of meaning, not the actor with permission to change the world.

Minimum implementable fields:

- `creator_id`
- `creator_type`: `human`, `aeye`, `artifact`, `receipt`, `doctrine`
- `intent_id`
- `intent_text`
- `why`
- `success_condition`
- `constraints`
- `non_goals`
- `source_artifact`
- `created_at`

Creator boundary:

- Creator may propose.
- Creator may constrain.
- Creator may define why.
- Creator does not bypass Human Gates.

## OPERATOR:

The Operator is the consequence chooser.

Operator answers:

- Should this proceed now?
- Is this safe enough?
- Is the action inside approved scope?
- Does this require a Human Gate?

Operator turns intent into a decision: `PROCEED`, `DEFER`, or `KILL`. The Operator owns the moment where the next step would change shared state, repo history, production, money, accounts, secrets, doctrine, or canonical truth.

Minimum implementable fields:

- `operator_id`
- `operator_type`: `human`, `delegated_aeye`, `policy`
- `decision_id`
- `intent_id`
- `decision`: `PROCEED`, `DEFER`, `KILL`
- `approved_scope`
- `human_gate_status`: `NOT_REQUIRED`, `REQUIRED`, `APPROVED`, `BLOCKED`
- `risk_note`
- `decision_receipt_path`
- `decided_at`

Operator boundary:

- Operator may approve scoped action.
- Operator may defer or kill.
- Operator may delegate safe automation.
- Operator must not be skipped when consequence changes.

## ORGANISM:

The Organism is the coordinated machinery that turns approved intent into action and evidence.

Organism answers:

- What are the top possible moves?
- Which worker/runtime should handle the packet?
- What happened?
- Where is the receipt?
- Did the result become inheritable?

Organism includes queues, scanners, packet routing, workers, previews, receipt pickup, stale detection, delivery verification, action logs, and inheritance candidate detection. It may propose. It may route. It may execute only inside the Operator-approved scope.

Minimum implementable fields:

- `organism_event_id`
- `intent_id`
- `decision_id`
- `packet_id`
- `route_target`
- `worker`
- `work_status`
- `artifact_path`
- `artifact_hash`
- `receipt_path`
- `inheritance_candidate_id`
- `organism_status`: `QUEUED`, `ROUTED`, `RUNNING`, `BLOCKED`, `DONE`, `PARTIAL`
- `created_at`
- `updated_at`

Organism boundary:

- Organism may propose Top 3 Moves.
- Organism may run approved local/file-backed work.
- Organism may write packets, artifacts, receipts, and candidate inheritance events.
- Organism must not invent intent, approve Human Gates, or claim inheritance without evidence.

## FIRST BUILDABLE VERSION:

Build one file-backed loop, not a new platform.

V0 objects:

1. `intent_packet`
   - Created from Creator input.
   - Holds `creator_id`, `intent_text`, `why`, `constraints`, and `success_condition`.

2. `operator_decision`
   - Adds `PROCEED`, `DEFER`, or `KILL`.
   - Holds Human Gate status and approved scope.

3. `organism_action`
   - Routes the packet to one worker or script.
   - Records start/end, worker, artifact path, and status.

4. `motion_receipt`
   - Uses `NMCLR_MUSCLE_RECEIPT_STANDARD`.
   - Proves `packet -> work -> artifact`.

5. `inheritance_candidate`
   - Records only candidate inheritance.
   - Does not claim successful inheritance unless READ -> DERIVED ACTION -> WRITE is proven.

Smallest UI shape:

- Mission Control: shows Creator intent and WHY.
- Bridge: shows Operator choice: `PROCEED`, `DEFER`, `KILL`.
- Engine Room: shows Organism packet, worker, artifact, and receipt.
- Receipts: shows motion proof and inheritance candidate status.

Smallest storage shape:

- Append-only JSONL for intent packets.
- Append-only JSONL for operator decisions.
- Append-only JSONL for organism actions.
- File-backed receipts for motion proof.
- Candidate-only inheritance event log.

## DO NOT BUILD:

- Do not build a new Atlas.
- Do not build a new PM dashboard.
- Do not build autonomous doctrine assimilation.
- Do not let Organism approve its own Human Gates.
- Do not let Creator identity imply execution permission.
- Do not let Operator decision imply successful work.
- Do not let artifact existence imply inheritance.
- Do not make localStorage or static cockpit state count as execution proof.
- Do not build broad always-on automation before packet, motion, and receipt proof are reliable.
- Do not auto-merge, auto-delete, auto-deploy, auto-push, edit secrets, or promote canonical truth without a fresh Human Gate.

## GO / CONDITIONAL GO / NO-GO:

GO:

- Adopt Creator / Operator / Organism as the V0 role split.
- Use it to label packet, decision, action, receipt, and inheritance records.
- Build the first version as file-backed append-only records plus receipts.

CONDITIONAL GO:

- Organism may execute boring local/file-backed actions only when an Operator decision has approved the exact scope.
- A delegated Aeye may act as Operator only for safe automation that cannot change high-consequence state.
- Inheritance may be logged as a candidate until read-derived-write proof exists.

NO-GO:

- No autonomous consequence changes without Operator approval.
- No Human Gate approval by the same automation that wants to execute the action.
- No claim that action occurred without muscle proof.
- No claim that continuity/inheritance occurred without successful inheritance proof.
- No promotion of this model into a larger architecture until V0 proves packet -> work -> artifact -> receipt on one boring loop.

## Smallest Operating Rule

Creator says why.

Operator says whether.

Organism does the approved work and proves it.

Inheritance begins only after the proof can be reused by the next action.
