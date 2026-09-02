# TO_OPERATOR — HG-3 Ben hands: live Foundry Dues products

From: LadyJessica@Betsy  
Date: 2026-07-23  
Phrase accepted: `APPROVE LIVE STRIPE PRODUCT CREATE`

## You are here

Stripe Dashboard is open to **login**. Crew stops at credentials.

After sign-in:

1. Confirm **Test mode is OFF** (live).
2. Create products/prices per table below.
3. Store `price_…` IDs in 1Password only — never in chat.
4. Say when done (no need to paste IDs). Then next phrase is `APPROVE SECRET ENTRY`.

## Create (minimum for Foundry path)

| Stripe product name | Type | Price | Env name for later (HG-4) |
|---------------------|------|-------|---------------------------|
| Foundry Dues - Monthly | Recurring subscription | $9.99 / month | `STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID` |
| Foundry Dues - Annual - The Long Run | Recurring subscription | $99 / year | `STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID` |

Source of truth: `lib/stripe-manifest.ts` + `.env.example` legacy aliases.

## Still blocked

| Gate | Phrase |
|------|--------|
| HG-4 live secrets | `APPROVE SECRET ENTRY` |
| HG-5 live checkout | `APPROVE PAID CHECKOUT GO-LIVE` |
| FCRA background | policy-blocked (no phrase) |

Link: https://dashboard.stripe.com/products
