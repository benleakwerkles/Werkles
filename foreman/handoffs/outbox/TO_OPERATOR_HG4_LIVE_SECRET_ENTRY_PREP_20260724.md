# TO_OPERATOR — HG-4 prep (names only) — live Stripe secrets

From: LadyJessica@Betsy  
Date: 2026-07-24  
Status: **PREP ONLY** — do not enter until HG-3 products exist + you say `APPROVE SECRET ENTRY`

Requires: live Foundry Monthly + Annual price IDs already in 1Password (HG-3 Ben hands).

## Phrase when ready

```text
APPROVE SECRET ENTRY
```

That is **HG-4 live Stripe/Crucible secrets**, not a replay of the 2026-07-04 Vercel env sync phrase.

## Names only (enter privately in 1Password / Vercel Production — never chat)

| Name | Notes |
|------|--------|
| `STRIPE_SECRET_KEY` | `sk_live_*` |
| `STRIPE_WEBHOOK_SECRET` | live endpoint `whsec_*` for `https://werkles.com/api/webhooks/stripe` |
| `STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID` | live `price_*` |
| `STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID` | live `price_*` |
| Legacy aliases if still wired | `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_YEARLY_PRICE_ID` |

Optional later: other `STRIPE_CRUCIBLE_*` from `lib/stripe-manifest.ts`. FCRA background SKUs stay policy-blocked for go-live claims.

Vault hint: **Werkles Automation** / item **Werkles Vercel Secrets**

Preflight proof (names only, run any time): `node scripts/foreman/test-hg4-stripe-env-preflight.mjs` — 10/10 PASS 2026-07-25. Confirms manifest/code/card env-name agreement and no live secret material in scanned source.

## Still blocked after HG-4

HG-5: `APPROVE PAID CHECKOUT GO-LIVE` (first real charge + webhook proof)

Crew after your HG-4 phrase: names-only mule/sync — no printing values.
