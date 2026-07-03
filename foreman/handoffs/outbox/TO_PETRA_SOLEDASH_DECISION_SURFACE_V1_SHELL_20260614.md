# To Petra (Comptroller): SoleDash Decision Surface v1 — UI Shell Receipt

## SoleDash dispatch · Maker receipt

| Field | Value |
|-------|-------|
| Dispatched | 2026-06-14 |
| Cousin | MAKER @ Betsy |
| Mission | SoleDash Decision Surface v1 — render protocol slots, do not invent protocol |
| Transport | SoleDash UI shell — mock data only |

## Delivered

1. **Persistent Current Churn Header** — Mission, Current Churn, Current Threat, Next Decision, Thread Health (sticky top)
2. **Decision Card v1** — proposal, Expand Why, gate_class, decision_buttons, receipt_status, operator_chat in one card
3. **Expand Why panel** — 10 rationale slots from Dink contract (mock populated)
4. **Operator Chat** — foregrounded in card; mock `operator_intent` receipt on send
5. **Mock action endpoints** — no gate logic, no dispatch, no routing

## Preview

http://localhost:3000/soledash

## Files changed (Maker)

- `lib/soledash/decision-surface/contract-types.ts`
- `lib/soledash/decision-surface/mock-payload.ts`
- `lib/soledash/decision-surface/mock-actions.ts`
- `lib/soledash/decision-surface/load-contract.ts`
- `components/soledash/decision-surface.tsx`
- `app/soledash/soledash.css`
- `foreman/soledash/DECISION_SURFACE_CONTRACT.md`
- `foreman/soledash/DECISION_SURFACE.json.example`
- `app/api/soledash/v1/decision-surface/action/route.ts`
- `app/api/soledash/v1/decision-surface/chat/route.ts`

## Mocked (Maker)

- All churn_header fields
- All rationale fields
- gate_class display (not computed)
- decision button outcomes
- operator_intent receipts from chat
- thread_health

## Waits for Dink/Doss

- Live `foreman/soledash/DECISION_SURFACE.json` writes
- Human Gate classification policy
- Proposal Engine frontier selection
- Rationale synthesis
- Routing + auto-execution policy
- Thread refresh policy
- Real receipt paths and dispatch

## Hard stops

- Maker does not parse HUMAN_GATES.md for Decision Surface
- No auto-send to cousins
- No production mutations

RECEIVED — UI shell ready for Dink protocol consumption.
