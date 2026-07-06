# G pass: test checkout smoke runbook + build proof

RECEIPT_ID: WERKLES_G_TEST_CHECKOUT_SMOKE_BUILD_20260705
TIMESTAMP: 2026-07-05
MACHINE: BETSY
BRANCH: maker/site-g-20260703
LANE: Werkles.com only

## Idea 1 — Test checkout smoke runbook (Gate 1)

- Route: `/operator/gate-knockout/test-checkout-smoke`
- Data: `productGateTestCheckoutSmokeSteps` in `lib/product-human-gates.ts`
- Linked from Gate Knockout hub + operator surfaces + dry-run step 7

Purpose: Ben-facing checklist for test Stripe checkout + webhook-backed membership proof.

Gate phrase at end: `APPROVE PAID CHECKOUT GO-LIVE (test mode)`

## Idea 2 — Production build proof

- `npm run typecheck`: PASS
- `npm run build`: PASS

## G lane status

| Milestone | Status |
|-----------|--------|
| Tier-A env 8/8 | Done |
| Production env redeploy | Done (2026-07-05) |
| Test checkout UI unpaused | Done |
| Gate 1 webhook proof | **Next — Ben hands** |
| Live Stripe / merge to main | Gated |

## Next Ben action

Run test checkout smoke on https://werkles.com or localhost → confirm webhook updates `/dashboard/billing` → give test-mode gate phrase.
