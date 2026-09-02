# HG-2 Approved — Crucible Provider Test — 2026-07-07

RECEIPT_ID: WERKLES_HG2_CRUCIBLE_PROVIDER_APPROVED_20260707
GATE_KEY: `crucible-provider-test`
OPERATOR_PHRASE: `APPROVE CRUCIBLE PROVIDER TEST`
DECISION: **APPROVED**
TIMESTAMP: 2026-07-07T15:43:00-04:00
LANE: Werkles.com / G

## Scope

- **In scope:** Crucible sandbox + provider test wiring on werkles.com — Identity (stub or Stripe test), Funds (Plaid link_token), webhook identity events.
- **Out of scope:** Background checks (FCRA), live provider modes, live Stripe checkout.

## Mechanical proof (pre-approval)

Receipt: `foreman/receipts/WERKLES_CRUCIBLE_SMOKE_20260707.json`

| Check | Result |
|-------|--------|
| Plaid link_token | PASS |
| Production `/dashboard/crucible` | PASS |
| Identity API (member) | PASS (sandbox_stub fallback) |
| Funds API (member) | PASS (plaid_link_test) |
| Profile pending states | PASS |
| Identity verified webhook | PASS |
| Profile sandbox_verified after webhook | PASS |

**Partial (non-blocking):** Stripe Identity direct API blocked on restricted `rk_test_*` key; production route handles via stub.

## Still gated

| Gate | Phrase | Status |
|------|--------|--------|
| HG-3 Live Stripe products | `APPROVE LIVE STRIPE PRODUCT CREATE` | Blocked |
| HG-4 Live secret entry | `APPROVE SECRET ENTRY` | Blocked |
| HG-5 Live checkout | `APPROVE PAID CHECKOUT GO-LIVE` | Blocked |
| Background checks | — | Policy-blocked (FCRA) |

## Member runway status

Test-mode Foundry Dues + Crucible provider test path are **approved for werkles.com**.
