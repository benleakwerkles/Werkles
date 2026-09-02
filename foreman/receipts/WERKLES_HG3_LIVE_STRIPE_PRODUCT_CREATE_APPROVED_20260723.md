# HG-3 APPROVED — Live Stripe product create

Date: 2026-07-23  
Seat: LadyJessica@Betsy  
Operator phrase: `Approve live stripe product create.`  
Gate packet: `foreman/reviews/GATE-live-crucible-hg3-hg5-20260721.md`  
Status: **APPROVED** — Ben hands now for Dashboard create

## Cleared

HG-3 authorizes creating **live** Stripe products/prices (Test mode **OFF**).

Does **not** authorize:
- `sk_live_*` / live webhook secret entry (HG-4)
- real-card checkout go-live (HG-5)
- FCRA background products as a go-live claim (policy-blocked)
- pasting price IDs into chat

## Ben hands (STOP here for crew)

1. Open Stripe → **sign in** (browser is at login; crew cannot enter credentials).
2. Toggle **Test mode OFF** (live).
3. Create at minimum:

| Product name (Stripe) | Mode | Display price | Store price ID as (1Password / Vercel later) |
|------------------------|------|---------------|-----------------------------------------------|
| Foundry Dues - Monthly | subscription | $9.99/month | `STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID` (+ legacy `STRIPE_MONTHLY_PRICE_ID` if still used) |
| Foundry Dues - Annual - The Long Run | subscription | $99/year | `STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID` (+ legacy `STRIPE_YEARLY_PRICE_ID` if still used) |

Optional later (not required to clear HG-3→HG-4 for Foundry path): other rows in `lib/stripe-manifest.ts`. Do **not** treat FCRA background SKUs as approved for live use.

4. Save price IDs privately (1Password item **Werkles Vercel Secrets** / vault **Werkles Automation**). **Do not paste into chat.**

Dashboard URL: https://dashboard.stripe.com/products

## Crew after Ben creates products

Names-only mapping prep is ready in:
`foreman/handoffs/outbox/TO_OPERATOR_HG3_LIVE_STRIPE_PRODUCT_CREATE_HANDS_20260723.md`

Next Operator phrase when products exist:

```text
APPROVE SECRET ENTRY
```

## Proof this cycle

- Approval logged in `foreman/gates/APPROVAL_LOG.md`
- Stripe products URL opened → **login wall** (expected Ben gate)
- No live products created by crew
- No secrets entered or printed

`COMPLETED` (crew side) — awaiting Ben Dashboard create
