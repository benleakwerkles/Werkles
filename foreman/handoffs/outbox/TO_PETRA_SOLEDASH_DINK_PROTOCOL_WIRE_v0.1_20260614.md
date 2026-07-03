# To Petra / Comptroller: SoleDash Decision Surface — Dink Protocol Wire v0.1

## SoleDash dispatch · receipt

| Field | Value |
|-------|-------|
| Dispatched | 2026-06-14 |
| Cousin | MAKER @ Betsy |
| Mission class | UNCLASSIFIED |
| Execution context | LOCAL_SALLY_WINDOWS |

## Mission

Wire SoleDash Decision Surface to Dink Protocol Constitution v0.1 — import types from `protocol/index.ts`, remove Maker-invented governance schemas, render protocol objects.

## Done

1. **`protocol/index.ts`** — vendored SoleDash Protocol v0.1 types (Mission, CurrentChurn, Proposal, Rationale, HumanGate, Decision, DecisionReceipt, OperatorIntent, ThreadHealthItem, QueueBrain)
2. **Removed** `lib/soledash/decision-surface/contract-types.ts` — no local gate enums, proposal/receipt/rationale schemas
3. **UI** renders from `DecisionSurfacePayload` — no hardcoded Human Gate doctrine labels; uses `human_gate.operator_prompt` + opaque `classification`
4. **Queue Brain** — four protocol slots in sticky header (active owner, waiting report, blocker, recommended next)
5. **Operator Chat** — Send creates structured `OperatorIntent` entry; typing **"next"** sets `parsed_command: advance_frontier`, `kind: advance_frontier`
6. **Mock endpoints** updated to return `decision_receipt` + `OperatorChatEntry`

## Codex sync note

External path `C:/Users/BenLeak/Documents/Codex/2026-06-14/mission-lock-aeye-role-matrix-into/protocol/index.ts` was **not present on Betsy** at build time. Maker vendored v0.1 from Petra type list. **Dink should copy/replace `protocol/index.ts` when Codex sync lands** — UI imports from repo root only.

## Preview

http://localhost:3000/soledash

## Still mocked

- Full payload (`maker-mock-placeholder`) until Dink writes `foreman/soledash/DECISION_SURFACE.json`
- Decision button execution (`POST .../action`)
- OperatorIntent routing beyond structured capture (`POST .../chat`)
- Queue Brain values (slots render; Dink owns queue logic)
- Thread refresh / frontier selection

## Requires persistence / backend (Dink/Doss)

- Live `DECISION_SURFACE.json` generation + refresh policy
- Human Gate classification rules
- Proposal Engine / frontier rank
- Rationale synthesis
- Real `DecisionReceipt` writes + dispatch
- OperatorIntent parser + routing (`advance_frontier`, pivot, etc.)
- Queue Brain population from live cousin/work state

## Files changed

- `protocol/index.ts` (new)
- `lib/soledash/decision-surface/load-contract.ts`
- `lib/soledash/decision-surface/mock-payload.ts`
- `lib/soledash/decision-surface/mock-actions.ts`
- `lib/soledash/decision-surface/contract-types.ts` (deleted)
- `components/soledash/decision-surface.tsx`
- `app/api/soledash/v1/decision-surface/action/route.ts`
- `app/soledash/soledash.css`
- `foreman/soledash/DECISION_SURFACE.json.example`
- `foreman/soledash/DECISION_SURFACE_CONTRACT.md`

## Commit

Not committed — awaiting Ben explicit approval.

RECEIVED — SoleDash renders from Dink protocol types; Maker doctrine removed.
