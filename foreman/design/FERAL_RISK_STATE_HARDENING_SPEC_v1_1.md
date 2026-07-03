# FERAL RISK-STATE HARDENING SPEC v1.1

STATUS: Corrected Risk-state screen spec. Not cleared for Design Desk.

OWNER: Maker@Betsy

SOURCE: Feral/TinkerDen design handoff plus Ender red-team pass.

## Primary Fix

Risky or destructive actions must not execute live while Shadow is still evaluating.

Risk-state label:

`OPERATOR INTENT / STAGED PATH`

Live execution for a risky or destructive action is locked until one of:
- Rejoin Shadow.
- Force Live with receipt.
- Non-destructive classification below threshold.

## Screen Purpose

The Risk-state screen separates operator intent from live execution. It shows the requested action, current risk classification, Shadow status, staged path, provenance, and the exact receipt required before live execution can unlock.

The screen is a control surface for staging and proof, not self-applying changes, unsupervised execution, or destructive execution.

## Required Screen Elements

### Fixed Shell

Shows:
- Screen title: `Risk State`.
- Current packet or intent title.
- Current owner.
- Design Desk status: `HELD`.
- Global gate state: `LOCKED`, `STAGED`, or `LIVE_UNLOCKED_WITH_RECEIPT`.

Rules:
- The shell never shows live destructive execution as the default path.
- V1: Feral wraps risky/destructive workflows only.
- V2: Feral may become default cockpit after receipt parity.
- V3: Native UI deprecation only after adoption and rollback parity.

### Lexical Governor Toggle

Shows:
- Toggle label: `Lexical Governor`.
- State: `ON`, `REVIEW_REQUIRED`, or `BLOCKED`.
- Classification: `NON_DESTRUCTIVE`, `RISKY`, `DESTRUCTIVE`, or `UNKNOWN`.
- Trigger words or phrases.
- Provenance badge for the classifier event.

Rules:
- `UNKNOWN`, `RISKY`, and `DESTRUCTIVE` cannot route directly to live execution.
- Classification must cite exact source language.
- Poisoned language such as "just", "quick", "obvious", "safe", or bypass framing raises review state.

### Operator Intent / Staged Path Pane

Shows:
- Operator intent.
- Staged action.
- Blocked live action, if any.
- Required gate.
- Required receipt.
- Provenance badge for the intent source.

Allowed staged actions:
- `STAGE_PACKET`
- `REQUEST_VALIDATION`
- `REQUEST_ATTACK`
- `REQUEST_LANGUAGE_CLEANUP`
- `REJOIN_SHADOW`
- `FORCE_LIVE_WITH_RECEIPT`

Rules:
- The pane may create a packet, blocker, or receipt.
- The pane must not execute risky or destructive changes.
- Risky/destructive actions render staged controls first, not live execution.

### Shadow Path Pane

Shows:
- Shadow state: `EVALUATING`, `REJOIN_REQUIRED`, `REJOINED`, `NOT_REQUIRED`.
- Safer route being simulated.
- Last Shadow receipt.
- Missing evidence.
- Provenance badge for the Shadow event.

Rules:
- While Shadow is `EVALUATING`, live execution controls stay hidden.
- Shadow rejoin must create a receipt.
- A stale Shadow result cannot unlock live execution.

### Rejoin Shadow Control In Header

Shows:
- Header control: `Rejoin Shadow`.
- Enabled only when Shadow state is `REJOIN_REQUIRED` or the operator explicitly chooses to revalidate a risky path.
- Receipt target.

Rules:
- Rejoin Shadow creates a receipt or blocker.
- Rejoin Shadow does not execute the live action.

### Force Live Receipt Drawer

Shows:
- Specific risk being accepted.
- Human gate owner.
- Required receipt fields.
- Link to packet or staged intent.
- Provenance badge for the Force Live decision.

Required receipt fields:
- `packet_id`
- `risk_accepted`
- `human_gate_owner`
- `reason_code`
- `affected_objects`
- `operator_confirmation`
- `rollback_status`
- `receipt_emitted_to_drift_log`
- `graveyard_receipt_required`
- `timestamp`

Rules:
- Force Live is a true human gate.
- Force Live cannot unlock live execution until the receipt exists.
- Force Live copy must not imply that the action is safe.
- The Force Live control label is `[Force Live — Requires Receipt]`.
- If deletion or archive is involved, the drawer must require a Graveyard receipt.

### Drift Log

Shows:
- Classification changes.
- Shadow state changes.
- Staged path changes.
- Force Live drawer open/close events.
- Provenance badges on every event.

Rules:
- Drift Log is append-only for v1.1.
- No silent rewrite of prior risk state.

### Graveyard Receipt Stub

Shows:
- Killed risky path title.
- Why it was killed.
- Replacement path, if any.
- Receipt placeholder.
- Provenance badge for the kill decision.

Rules:
- Permanent-removal copy is not allowed.
- Killed paths remain visible as receipts or stubs.

### Provenance Badges

Every action and event shows:
- Source surface.
- Owner.
- Timestamp.
- Packet or receipt ID when available.
- State transition.

Rules:
- No event can unlock a gate without provenance.
- Spoofed or missing provenance keeps live execution locked.

## Copy Removals And Corrections

Remove or quarantine:
- Any label that frames the operator path as live during Risk state.
- "Organism-defined constraint" only when it is used as bypass language rather than a real organism constraint.
- Any copy implying live execution is available during Risk state.
- Any copy implying native TinkerDen replacement in v1 scope.
- Self-applying changes.
- Unsupervised execution.
- Permanent-removal language.
- Any copy implying Shadow can be bypassed silently.
- Any copy implying a risky action is safe because it is staged.

Use:
- `OPERATOR INTENT / STAGED PATH`
- `Rejoin Shadow`
- `[Force Live — Requires Receipt]`
- `Receipt required before live execution`
- `Blocked: Shadow still evaluating`
- `Classified below live-risk threshold`
- `Graveyard receipt stub`

## Live Execution Gate

Gate states:
- `LOCKED`
- `UNLOCKED_BY_SHADOW_REJOIN_RECEIPT`
- `UNLOCKED_BY_FORCE_LIVE_RECEIPT`
- `UNLOCKED_BELOW_THRESHOLD`

Unlock conditions:
- Rejoin Shadow completed with receipt.
- Force Live completed with receipt.
- Classification is non-destructive and below threshold.

Rules:
- No live button renders while gate is `LOCKED`.
- Risky/destructive live execution requires an explicit receipt.
- Non-destructive below-threshold action must be visibly distinct from risky/destructive staged action.

## Acceptance Criteria

PASS if:
- The risky-state label is `OPERATOR INTENT / STAGED PATH`.
- Risky/destructive actions stay staged while Shadow is evaluating.
- Force Live requires a receipt before live unlock.
- Rejoin Shadow produces a receipt or blocker.
- Drift Log preserves state changes.
- Graveyard uses receipt stubs, not hard deletes.
- Every action/event has provenance.
- Design Desk remains held.

FAIL if:
- Risky/destructive action executes live by default.
- Shadow can be bypassed silently.
- Force Live lacks receipt requirement.
- Self-applying changes or unsupervised execution remain in scope.
- Permanent-removal language remains.
- The spec expands into the whole platform.

## Unresolved Risks

- Thufir validation is still needed for Lexical Governor semantics.
- Bean attack is still needed for Force Live bypass, stale simulation, bad replay, and spoofed provenance.
- Ender cleanup is still needed to confirm poisoned language is fully removed.
- Swanson confirmation is still needed for smallest prototype surface.
- Design Desk is not authorized to receive the spec yet.

## Next Owner

Thufir@Doss for Lexical Governor semantic validation.

