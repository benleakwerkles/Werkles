# Decision Surface Contract

**Owner:** Dink / Doss  
**Consumer:** Maker (render shell only)

Types: `protocol/index.ts` (SoleDash Protocol Constitution v0.1)

Maker does **not** own Human Gate rules, Proposal Engine, Rationale logic, routing, auto-execution, or thread refresh.

## Payload

`foreman/soledash/DECISION_SURFACE.json` (live, gitignored)  
`foreman/soledash/DECISION_SURFACE.json.example` (shape reference)

Schema: `soledash-protocol-v0.1`

## Protocol objects (render slots)

| Object | Purpose |
|--------|---------|
| `mission` | Active mission frame |
| `current_churn` | Churn, threat, next decision label |
| `thread_health` | ThreadHealthItem |
| `queue_brain` | active_owner, waiting_report, blocker, recommended_next_action |
| `proposal` | Frontier decision + `evidence_status` |
| `rationale` | Expand Why (10 keys from protocol) |
| `human_gate` | Classification + transport_gap (opaque strings) |
| `decision` | buttons + if_clicked |
| `decision_receipt` | Proof of action |
| `operator_chat` | entries (message \| operator_intent) |

### Mock endpoints (until Dink live)

- `POST /api/soledash/v1/decision-surface/action`
- `POST /api/soledash/v1/decision-surface/chat` → structured `OperatorIntent`

## Visual rule

Not a dashboard. Every element answers:

1. What decision is needed?
2. Why is it needed?
3. What happens if Ben clicks?
4. What receipt proves it happened?
