# Plaid Partnership Checklist V0

Use before emailing Plaid API team or scheduling solutions call.

## Documents to attach

- [ ] `foreman/plaid/PLAID_API_TEAM_BRIEFING_V0.md` (primary)
- [ ] `company/PLAID_PERSISTENT_LIQUIDITY_PROOF_V0.md` (doctrine excerpt if they want compliance context)
- [ ] Optional: one-page diagram from `PLAID_TECHNICAL_SPEC_V0.md` §1

## Internal readiness

- [x] Sandbox Link + exchange wired (`lib/crucible-providers.ts`)
- [x] HG-2 Crucible provider test approved (sandbox)
- [ ] Persist `access_token` on exchange (code slice 2 — after schema gate)
- [ ] Schema draft reviewed (`PLAID_SCHEMA_DRAFT_V0.sql`)
- [ ] Pricing model for per-refresh vs per-Item (`company/PRICING.md` alignment)
- [ ] Counsel skim on counterparty disclosure (derived receipt only)

## Information to have on the call

| Field | Werkles value |
|-------|---------------|
| Legal entity | Werkles, Inc. |
| Site | https://werkles.com |
| Use case category | Identity/verification workflow (not lending) |
| End user | US founders, operators, backers |
| Plaid env today | Sandbox |
| Products in use | Link, Assets (token create) |
| Monthly volume (honest) | Pre-launch / low hundreds Items first 6 months |
| Data minimization | Bands + threshold, not raw balances to third parties |

## Questions to close on the call (top 5)

1. Confirm **persistent Item custody** pattern for verification SaaS
2. **Assets vs Balance** for threshold band proofs
3. **Production enablement** timeline and requirements
4. **Per-Item vs per-request** cost model for refresh-on-demand
5. **Third-party disclosure** policy for derived proof receipts

## Proposed human gates (internal)

| Phrase | Unlocks |
|--------|---------|
| `APPROVE PLAID PERSISTENCE SCHEMA` | Apply `PLAID_SCHEMA_DRAFT_V0.sql` |
| `APPROVE PLAID LIVE LIQUIDITY PROOF` | Production keys + `live_verified` badges |

## After the call

- [ ] Log answers in `foreman/plaid/PLAID_API_TEAM_CALL_NOTES_YYYYMMDD.md`
- [ ] Update `PLAID_TECHNICAL_SPEC_V0.md` with Plaid guidance
- [ ] Update `company/PRICING.md` if Item pricing changes model
- [ ] Receipt in `foreman/receipts/`

## Email draft (operator send)

```text
Subject: Werkles — persistent liquidity proof use case (verification workflow)

Hi [Plaid contact],

Werkles is a verification-gated formation platform (werkles.com). We spoke with your team about owning customer Plaid Items and refreshing liquidity proof on demand so members can share derived proof receipts with each other before partnership conversations — not lending or payments.

Attached is our API briefing (V0). We're sandbox-integrated today (Link + Assets) and planning persistent Item storage + fee-per-refresh receipts.

Could we schedule 30 minutes with solutions/API to confirm product fit (Assets vs Balance), production path, and disclosure constraints for member-to-member proof sharing?

Thanks,
Ben Leak
Werkles, Inc.
```
