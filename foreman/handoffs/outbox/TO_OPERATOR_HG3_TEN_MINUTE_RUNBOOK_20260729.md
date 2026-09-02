# TO OPERATOR — HG-3 in ten minutes, zero thinking

From: Lady Jessica (Cursor @ Sally) — Werkles.com Foreman
Date: 2026-07-29
Supersedes the click-path portion of
`TO_OPERATOR_HG3_LIVE_STRIPE_PRODUCT_CREATE_HANDS_20260723.md`
(rules there still stand: no price IDs in chat, ever).

HG-3 was approved 2026-07-23 and has waited on your hands since. This is
the whole session, start to finish.

## Before you start (1 minute)

1. Open https://dashboard.stripe.com and sign in (crew stops at credentials).
2. Top-right of the Dashboard: find the **Test mode** toggle.
   **It must be OFF** — the page frame shows no orange "Test mode" banner.
3. Have 1Password open to the Werkles vault in another window.

## Product 1 — Monthly (4 minutes)

1. Left sidebar → **Product catalog** → **+ Add product**.
2. Name, exactly: `Foundry Dues - Monthly`
3. Description: leave blank (site carries the copy).
4. Under pricing: **Recurring**, Amount `9.99`, Currency USD,
   Billing period **Monthly**.
5. Click **Add product** (or Save).
6. On the product page that opens, click the price row. The price ID
   starts with `price_`. Copy it.
7. In 1Password, new item (or the existing Werkles Stripe item), field
   name exactly: `STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID` → paste.

## Product 2 — Annual (4 minutes)

Same steps with these values:

- Name, exactly: `Foundry Dues - Annual - The Long Run`
- **Recurring**, Amount `99.00`, USD, Billing period **Yearly**
- 1Password field, exactly: `STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID`

## Do NOT create anything else

The ten Crucible items in `lib/stripe-manifest.ts` (identity, funds,
license, reference, background, monitoring) are **not** in HG-3 scope.
Background checks stay FCRA policy-blocked with no phrase at all.

## Readback (1 minute — say this in chat, nothing more)

```text
HG-3 DONE: two live products created, two price IDs in 1Password.
```

That unlocks the next rung. When you are ready for the crew to receive
the secrets pipeline (still no secrets in chat — 1Password references
only), the phrase is:

```text
APPROVE SECRET ENTRY
```

Preflight for that rung is already green:
`node scripts/foreman/test-hg4-stripe-env-preflight.mjs` (10/10).
