# CREATOR_OPERATOR_ORGANISM_RECEIPT

Generated: 2026-06-24

Destination: TinkerDen Intake, Speaker

## Locked Terms

CREATOR:

Creates purpose.

OPERATOR:

Chooses actions.

ORGANISM:

Executes purpose.

## DEFINITION:

Creator and Operator are distinguished by the kind of proof they leave.

Creator proof is purpose proof.

Operator proof is action-choice proof.

The same human, Aeye, or artifact may participate in both roles, but the roles are not proven by identity. They are proven by separate artifacts:

- Creator artifact: defines why, what, constraints, non-goals, and success condition.
- Operator artifact: chooses proceed/defer/kill, approved scope, risk, and gate status.

The Creator asks:

- Why does this matter?
- What should exist?
- What must not happen?
- What counts as success?

The Operator asks:

- Should action happen now?
- Which action is approved?
- What scope is allowed?
- Is a Human Gate required?

The Organism asks:

- What packet should move?
- Which worker should act?
- What artifact was produced?
- Where is the receipt?

## PROOF:

Creator is proven by an intent record.

Minimum Creator proof:

- `creator_id`
- `intent_id`
- `intent_text`
- `why`
- `success_condition`
- `constraints`
- `non_goals`
- `source_artifact`
- `created_at`

Operator is proven by a decision record.

Minimum Operator proof:

- `operator_id`
- `decision_id`
- `intent_id`
- `decision`: `PROCEED`, `DEFER`, or `KILL`
- `approved_action`
- `approved_scope`
- `human_gate_status`
- `risk_note`
- `decision_receipt_path`
- `decided_at`

Organism is proven by a motion receipt.

Minimum Organism proof:

- `packet_id`
- `decision_id`
- `route_target`
- `worker`
- `work_status`
- `artifact_path`
- `artifact_hash`
- `receipt_path`
- `motion_status`

Proof distinction:

- If it explains purpose, it is Creator evidence.
- If it chooses an action and scope, it is Operator evidence.
- If it performs scoped work and emits artifact/receipt proof, it is Organism evidence.

## FAILURE MODE:

1. Creator mistaken for Operator:
   - A strong purpose statement is treated as approval to act.
   - Example: "Build TinkerDen" becomes permission to merge, deploy, delete, or promote.
   - Correct status: `INTENT_ONLY`.

2. Operator mistaken for Creator:
   - A proceed/defer/kill decision is treated as doctrine, purpose, or thesis.
   - Example: approving one packet becomes a permanent rule.
   - Correct status: `ACTION_DECISION_ONLY`.

3. Organism mistaken for Operator:
   - Automation routes or executes work and claims it approved itself.
   - Example: a watcher sees a packet and runs a destructive command.
   - Correct status: `BLOCKED_HUMAN_GATE`.

4. Organism mistaken for Creator:
   - Generated output is treated as original intent.
   - Example: a receipt or artifact retroactively defines why the mission existed.
   - Correct status: `ARTIFACT_NOT_PURPOSE`.

5. Receipt mistaken for inheritance:
   - A completed action receipt is treated as successful inheritance without read-derived-write evidence.
   - Correct status: `MOTION_PROVEN_INHERITANCE_UNPROVEN`.

## GO / CONDITIONAL GO / NO-GO:

GO:

- Lock the terminology:
  - Creator creates purpose.
  - Operator chooses actions.
  - Organism executes purpose.
- Require separate proof for intent, decision, and motion.

CONDITIONAL GO:

- One person or Aeye may hold multiple roles only when each role leaves its own proof artifact.
- Safe automation may act as delegated Operator only for bounded, reversible, non-consequence actions already allowed by policy.
- Organism may execute only inside an Operator-approved scope.

NO-GO:

- No purpose-only artifact may count as action approval.
- No action decision may become doctrine or permanent purpose.
- No Organism process may approve its own Human Gate.
- No motion receipt may claim inheritance without successful inheritance proof.
- No merge, delete, deploy, push, secret/account change, or canonical promotion may happen from Creator intent alone.

## Smallest Rule

Purpose is not permission.

Permission is not execution.

Execution is not inheritance.
