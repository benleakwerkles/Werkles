# FERAL / TINKERDEN WRAP HARDENING SPEC v1.1

STATUS: Corrected screen-level spec, not cleared for Design Desk.

SOURCE: Feral Tinkularity / TinkerDen design artifact, June 26, 2026.

OWNER: Maker@Betsy

NEXT OWNER: Thufir@Doss for Lexical Governor semantic validation.

## Primary Correction

Replace the unsafe label:

`OPERATOR PATH (LIVE)`

With:

`OPERATOR INTENT / STAGED PATH`

Risky or destructive actions must not execute live while Shadow is still being evaluated.

Live execution requires one of:
- Rejoin Shadow.
- Force Live with receipt.
- Non-destructive classification below risk threshold.

## Screen Purpose

The wrap hardening screen prevents the operator from confusing intent capture with live execution. It shows what the operator wants, how the Lexical Governor classified it, whether Shadow is attached, and which staged action is allowed next.

The screen is a decision membrane, not a launchpad.

## Screen-Level Layout

### 1. Intent Intake

Label: `Intent`

Shows:
- Operator-entered action or imported packet title.
- Source surface.
- Timestamp.
- Owner.
- Current destination.

Required state:
- `INTENT_CAPTURED`

Rules:
- No execution controls are visible in this section.
- Ambiguous intents remain staged until classified.

### 2. Lexical Governor Classification

Label: `Lexical Governor`

Shows:
- Classification: `NON_DESTRUCTIVE`, `RISKY`, `DESTRUCTIVE`, or `UNKNOWN`.
- Confidence.
- Poisoned-language flags.
- Scope-creep flags.
- Required reviewer.

Required state:
- `CLASSIFICATION_PENDING`
- `CLASSIFIED_BELOW_THRESHOLD`
- `CLASSIFIED_RISKY`
- `CLASSIFIED_DESTRUCTIVE`
- `CLASSIFICATION_BLOCKED`

Rules:
- `UNKNOWN`, `RISKY`, and `DESTRUCTIVE` never route directly to live execution.
- Classification must cite the exact words that triggered the risk tier.
- If the operator language says "just", "quick", "obvious", "safe", or implies bypassing review, surface a poisoned-language warning.

### 3. Shadow Status

Label: `Shadow`

Shows:
- Shadow attached: `YES` / `NO`
- Shadow state: `EVALUATING`, `REJOIN_REQUIRED`, `REJOINED`, `NOT_REQUIRED`
- Last Shadow receipt.
- Missing evidence.

Required state:
- `SHADOW_EVALUATING`
- `SHADOW_REJOIN_REQUIRED`
- `SHADOW_REJOINED`
- `SHADOW_NOT_REQUIRED`

Rules:
- If Shadow is evaluating, live execution controls stay hidden.
- Rejoin Shadow must produce a receipt.
- Shadow bypass requires Force Live with receipt.

### 4. Operator Intent / Staged Path

Label: `Operator Intent / Staged Path`

Shows:
- Requested action.
- Allowed staged action.
- Blocked live action, if any.
- Required gate.
- Receipt requirement.

Allowed staged actions:
- `STAGE_PACKET`
- `REQUEST_THUFIR_VALIDATION`
- `REQUEST_BEAN_ATTACK`
- `REQUEST_ENDER_LANGUAGE_PASS`
- `REQUEST_SWANSON_SURFACE_CONFIRMATION`
- `REJOIN_SHADOW`
- `FORCE_LIVE_WITH_RECEIPT`

Rules:
- This section can create packets, receipts, or blockers.
- This section must not execute destructive changes.
- If the action is risky or destructive, the primary button is a staged action, never live execution.

### 5. Live Execution Gate

Label: `Live Execution Gate`

Shows:
- Gate status: `LOCKED`, `UNLOCKED_BY_SHADOW`, `UNLOCKED_BY_FORCE_LIVE_RECEIPT`, `UNLOCKED_BELOW_THRESHOLD`
- Unlock reason.
- Required receipt.
- Human gate owner.

Unlock conditions:
- Rejoin Shadow completed with receipt.
- Force Live approved with receipt.
- Classification is non-destructive and below risk threshold.

Rules:
- No live button renders while gate is `LOCKED`.
- Force Live requires a receipt before the live action becomes available.
- Force Live copy must state the specific risk being accepted.

### 6. Receipt / Blocker / Next Packet

Label: `Outcome`

Shows one of:
- Receipt attached.
- Blocker created.
- Next packet created.

Required fields:
- `packet_id`
- `owner`
- `next_action`
- `evidence_required`
- `destination`
- `failure_condition`

Rules:
- The screen never ends with vague status.
- "Done", "sent", "handled", and "looks good" are invalid outcomes.
- If proof is missing, status is `UNPROVEN`.

## Risk Handling Matrix

| Classification | Shadow State | Allowed Operator Action | Live Execution |
| --- | --- | --- | --- |
| `NON_DESTRUCTIVE` below threshold | `NOT_REQUIRED` | Stage or execute after receipt requirement check | Allowed |
| `NON_DESTRUCTIVE` below threshold | `REJOINED` | Execute with Shadow receipt reference | Allowed |
| `RISKY` | `EVALUATING` | Rejoin Shadow or create validation packet | Blocked |
| `RISKY` | `REJOIN_REQUIRED` | Rejoin Shadow | Blocked |
| `RISKY` | `REJOINED` | Force Live with receipt or staged packet | Conditionally allowed |
| `DESTRUCTIVE` | any non-rejoined state | Create blocker or validation packet | Blocked |
| `DESTRUCTIVE` | `REJOINED` | Force Live with explicit receipt | Conditionally allowed |
| `UNKNOWN` | any state | Request classification | Blocked |

## Required Copy Changes

Remove:
- `OPERATOR PATH (LIVE)`
- "Run now" as default language.
- Any copy implying Shadow can be bypassed silently.
- Any copy implying risky actions are safe because they are staged.

Use:
- `OPERATOR INTENT / STAGED PATH`
- `Rejoin Shadow`
- `Force Live with receipt`
- `Classified below live-risk threshold`
- `Receipt required before live execution`
- `Blocked: Shadow still evaluating`

## Human Gates

True human gates:
- Force Live.
- Any destructive live execution.
- Any account, payment, credential, deployment, deletion, or irreversible action.
- Any final approval to send to Design Desk.

Non-gate technical proofs:
- Rendering staged UI.
- Writing a local spec artifact.
- Creating validation packets.
- Producing receipts for review-only work.

## Design Desk Hold

Do not send to Design Desk until:
- Thufir validates Lexical Governor semantics.
- Bean attacks Force Live / Rejoin Shadow.
- Ender removes poisoned language and v1 scope creep.
- Maker produces this corrected v1.1 design spec.
- Swanson confirms smallest prototype surface.

Current Design Desk status: `HELD`.

## Prototype Surface Recommendation

Smallest prototype surface:
- One screen.
- One intent card.
- One Lexical Governor panel.
- One Shadow status panel.
- One staged-action panel.
- One receipt/blocker/next-packet panel.

No multi-agent routing UI in v1.1 prototype. Route outputs can be shown as text artifacts only.

## Acceptance Criteria

PASS if:
- No risky/destructive action is labeled live while Shadow is evaluating.
- Risky/destructive actions require Rejoin Shadow or Force Live with receipt.
- Non-destructive below-threshold actions are visibly distinct from risky/destructive staged actions.
- Every incomplete mission produces a receipt, blocker, or next packet.
- The screen can be understood without Ben re-explaining the rules.

FAIL if:
- `OPERATOR PATH (LIVE)` remains.
- Force Live appears without receipt requirement.
- Shadow can be bypassed silently.
- The screen ends in vague status.
- Design Desk receives the packet before required validations.

## Unresolved Blockers

- Thufir has not validated Lexical Governor semantics.
- Bean has not attacked Force Live / Rejoin Shadow.
- Ender has not completed poisoned-language and v1 scope-creep pass.
- Swanson has not confirmed smallest prototype surface.
- Source artifact was not found in the repo by the searched terms; this v1.1 is built from the dispatch packet text.

