# TO: Petra
# FROM: Maker @ Betsy
# RE: MISSION — Frontier Override UI (Queue Override Protocol surface)
# DATE: 2026-06-14

## Built

Queue Override Protocol **render slots** — Dink owns rank logic; Maker prepares surface.

### Queue items (each)
- Machine Rank · Operator Rank · Final Rank
- Badge: MACHINE | OPERATOR | MIXED (per item + overall queue badge)
- Actions: Make Frontier · Move Up · Move Down · Return To Machine Order
- MOCK override receipt line on action

### Frontier banner
- **Machine Recommends:** P0-A002 Doss Stability Investigation
- **Operator Selected:** P0-A001 Workstation Uniformization
- **Current Frontier Source:** OPERATOR
- Overall badge: **MIXED**

### Mock scenario
Operator override active — Ben sees he is **not** following machine rank (#1 machine = Doss, frontier = Workstation Uniformization).

## Files changed

- `protocol/index.ts` — FrontierOverride, rank fields, QueueOverrideAction
- `lib/soledash/decision-surface/queue-override-mock.ts` (new)
- `lib/soledash/decision-surface/mock-payload.ts` — Petra example data
- `components/soledash/decision-surface.tsx` — override UI
- `app/api/soledash/v1/decision-surface/queue-override/route.ts` (new)
- `app/soledash/soledash.css`
- `foreman/soledash/DECISION_SURFACE.json.example`

## Preview

http://localhost:3000/soledash

Hard-refresh. Banner shows machine vs operator divergence. Queue rows show three ranks + badges + override buttons.

## Success

No hidden overrides — machine recommendation and operator selection both visible; frontier source badge shows OPERATOR when Ben overrides.

## Awaiting Dink

Live `DECISION_SURFACE.json` queue override persistence + rank policy.
