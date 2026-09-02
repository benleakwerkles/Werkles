# TO_OPERATOR — Stripe soft live, Ben first test — gate ladder

From: Maker (Cursor) @ Sally  
Date: 2026-07-26  
Status: **STAGED** — every step below is one phrase away; nothing fires without you.

Soft live means: live Stripe wired, checkout reachable, **you** run the first
real charge as the test customer. No public announcement, intake stays closed,
no marketing push until you separately say so.

## The ladder (in order)

### Step 1 — HG-3 finish: live products (your Dashboard hands)

Status: **IN PROGRESS** — approved 2026-07-23, awaiting your hands.

- In Stripe Dashboard (live mode): create Foundry Dues **Monthly** + **Annual**
  products/prices; put the two live `price_*` IDs in 1Password
  (**Werkles Automation / Werkles Vercel Secrets**).
- No phrase needed — this was already approved. Tell the crew `HG-3 DONE`
  when the IDs are in the vault.

### Step 2 — HG-4: live secret entry

Phrase:

```text
APPROVE SECRET ENTRY
```

- You (or names-only crew mule) enter in Vercel Production, never chat:
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID`, `STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID`
  (+ legacy aliases if still wired).
- Preflight already green: `node scripts/foreman/test-hg4-stripe-env-preflight.mjs`
  — 10/10 PASS 2026-07-25. Card: `TO_OPERATOR_HG4_LIVE_SECRET_ENTRY_PREP_20260724.md`.
- Webhook endpoint for the live `whsec_*`: `https://werkles.com/api/webhooks/stripe`.

### Step 3 — HG-5: paid checkout go-live (soft)

Phrase:

```text
APPROVE PAID CHECKOUT GO-LIVE
```

Scoped for soft live:

- Checkout goes live; **you are test customer #1** with a real card.
- Proof bundle the crew captures: checkout session completes, webhook
  delivers + verifies signature, subscription row lands, receipt email (if
  wired) — then a receipt file with IDs (no secrets).
- Your call after proof: keep the subscription or refund the test charge in
  Dashboard (refund is your hands; say `REFUND FIRST TEST` if you want the
  crew to prep the exact click path).

### Step 4 — public announcement (separate, later)

Nothing in this ladder opens intake or announces anything. Opening Bellows
intake remains its own gate: `APPROVE OPEN BELLOWS INTAKE SUBMISSION ON WERKLES.COM`.

## Sequencing with the brand push

Recommended order: brand push first (`PUSH MAKER BRAND SLICE` →
`TO_HEIMERDINKER_BRAND_V0I_PUSH_20260726.md`), Production promote, then run
this ladder against the promoted site so your first test sees the real thing.

Note: `PUSH BRAND V0I PUBLIC` now belongs to the Betsy/Codex 235-path packet
(`C:\w8\...\TO_HEIMERDINKER_WERKLES_BRAND_V0I_PUBLIC_GIT_J_PUSH_PREP_20260726.md`,
branch `codex/werkles-vpg31-20260721`) — a branch-only git push, no deploy.
It is a different slice from the one above.

## Hard lines (unchanged)

- Nobody enters, prints, or relays secret values in chat. Names only.
- Cursor/agents never say the gate phrases for you.
- FCRA background SKUs stay policy-blocked for go-live claims.
