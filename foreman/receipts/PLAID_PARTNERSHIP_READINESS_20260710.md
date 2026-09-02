# Plaid Partnership Readiness — 2026-07-10

RECEIPT_ID: PLAID_PARTNERSHIP_READINESS_20260710
LANE: Werkles.com / G

## Operator direction

Plaid call: Werkles owns customer Items; refresh liquidity proof on demand for a fee; members share derived receipts with each other (optional mutual proof). Not a snapshot-only model.

## Delivered (this session)

| Artifact | Path |
|----------|------|
| Doctrine V0 | `company/PLAID_PERSISTENT_LIQUIDITY_PROOF_V0.md` |
| Plaid API briefing (send externally) | `foreman/plaid/PLAID_API_TEAM_BRIEFING_V0.md` |
| Technical spec | `foreman/plaid/PLAID_TECHNICAL_SPEC_V0.md` |
| Schema draft (NOT applied) | `foreman/plaid/PLAID_SCHEMA_DRAFT_V0.sql` |
| Partnership checklist + email draft | `foreman/plaid/PLAID_PARTNERSHIP_CHECKLIST_V0.md` |
| Shared types | `lib/plaid/types.ts` |
| Index | `foreman/plaid/README.md` |

## Current code gap

- `app/api/verification/funds/exchange/route.ts` discards `access_token` after exchange
- No `plaid_items`, receipts, sessions, or webhooks tables live
- Matching engine has no Crucible liquidity weights yet

## Proposed gates

1. `APPROVE PLAID PERSISTENCE SCHEMA` — apply SQL draft
2. `APPROVE PLAID LIVE LIQUIDITY PROOF` — production keys + live badges

## Next build slices (after Plaid call)

1. Apply schema (gated)
2. Persist encrypted Item on exchange
3. Assets refresh → receipt builder
4. Stripe-paid refresh endpoint
5. Plaid webhooks
6. Share session v1
7. Matching weight hook

## Send to Plaid

Attach `foreman/plaid/PLAID_API_TEAM_BRIEFING_V0.md` — use checklist email template in `PLAID_PARTNERSHIP_CHECKLIST_V0.md`.
