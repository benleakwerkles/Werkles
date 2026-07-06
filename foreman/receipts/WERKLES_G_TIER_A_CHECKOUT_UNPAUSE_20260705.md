# G pass: tier-A checkout unpaused + gate status refresh

RECEIPT_ID: WERKLES_G_TIER_A_CHECKOUT_UNPAUSE_20260705
TIMESTAMP: 2026-07-05
MACHINE: BETSY
BRANCH: maker/site-g-20260703
LANE: Werkles.com only

## Change

- `lib/app-infra-preview.ts` — `TIER_A_PAYMENT_ENV_READY` + `isFoundryDuesCheckoutPaused()`
- `/membership`, `/dashboard/billing`, `/pricing` — test checkout unpaused when tier-A ready
- Member dashboard works-now card — honest test billing vs live/Crucible gates
- `lib/product-human-gates.ts` — production rollout marked completed; test checkout next
- Gate knockout rollout-readiness + scorecard copy refresh

## Why

Tier-A env custody verified 8/8 (packet ACK). G lane continues with honest member surfaces — test Stripe open, live keys still gated.

## Next gate

`APPROVE PAID CHECKOUT GO-LIVE (test mode)` after webhook-backed membership proof from `/membership`.
