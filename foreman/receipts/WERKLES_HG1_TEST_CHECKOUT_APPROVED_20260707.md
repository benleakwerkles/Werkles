# HG-1 Approved — Test Checkout + Webhook — 2026-07-07

RECEIPT_ID: WERKLES_HG1_TEST_CHECKOUT_APPROVED_20260707
GATE_KEY: `stripe-test-checkout-webhook`
OPERATOR_PHRASE: `Approve paid checkout, go live`
CANONICAL_PHRASE: `APPROVE PAID CHECKOUT GO-LIVE (test mode)`
DECISION: **APPROVED**
TIMESTAMP: 2026-07-07T15:02:00-04:00
LANE: Werkles.com / G

## Scope

- **In scope:** Stripe **test mode** checkout path; webhook-backed membership on werkles.com.
- **Out of scope:** Live Stripe keys, live products, live checkout (HG-3–5).

## Mechanical proof (pre-approval)

Receipt: `foreman/receipts/WERKLES_STRIPE_CHECKOUT_SMOKE_20260707.json`

| Check | Result |
|-------|--------|
| Test mode | PASS |
| Webhook `checkout.session.completed` | PASS |
| Production webhook handler | PASS |
| Profile `member` + `active` after webhook | PASS |

## Next gate

**HG-2:** Crucible identity + Plaid sandbox — phrase `APPROVE CRUCIBLE PROVIDER TEST`  
Runbook: https://werkles.com/operator/gate-knockout/test-crucible-smoke
