# Werkles.com Vercel Secret Entry Session

Status: **ACTIVE — Operator hands**
Gate: `APPROVE SECRET ENTRY` — **APPROVED** 2026-07-04 (Ben)
Agent: Lady Jessica (prep only — no values in chat/repo)
Project: [werkles/werkles1 → Environment Variables](https://vercel.com/werkles/werkles1/settings/environment-variables)
Source of truth for values: **1Password** (Ben vault)

Production rollout remains gated until `APPROVE PRODUCTION ROLLOUT`.

---

## What Ben does (private — not in chat)

Use 1Password → copy each value → paste into Vercel dashboard only.

### Step 1 — Preview: add missing names (2)

Preview already has 6 tier-A names. Add these two to **Preview** only:

| # | Name | 1Password hint (names only) |
|---|------|-------------------------------|
| 1 | `STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID` | Stripe test annual Foundry Dues price ID |
| 2 | `CRON_SECRET` | Werkles cron / TTL secret (random string) |

### Step 2 — Production: add full tier-A set (8)

Production currently has **zero** env vars. Add all eight to **Production**:

| # | Name | Already on Preview? |
|---|------|---------------------|
| 1 | `NEXT_PUBLIC_SUPABASE_URL` | yes — can use Vercel “copy to Production” if value is correct |
| 2 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes |
| 3 | `SUPABASE_SERVICE_ROLE_KEY` | yes |
| 4 | `STRIPE_SECRET_KEY` | yes |
| 5 | `STRIPE_WEBHOOK_SECRET` | yes |
| 6 | `STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID` | yes |
| 7 | `STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID` | add on Preview first (step 1) |
| 8 | `CRON_SECRET` | add on Preview first (step 1) |

**Stripe mode note:** Preview proof used **test** keys. Keep Production on **test** Stripe values until `APPROVE PAID CHECKOUT GO-LIVE` / live-mode gates. Do not switch to live keys without a separate gate.

**Webhook note:** Production webhook secret must match the endpoint registered for `https://werkles.com/api/webhooks/stripe` in Stripe **test** mode (or live later).

### Step 3 — Skip for now (tier B / Crucible)

Do not add Crucible price IDs until Crucible gate opens.

### Step 4 — Verify names only (Lady Jessica or Direwolf Dink can run)

After Ben saves in Vercel, run locally:

```powershell
cd C:\Users\Ben Leak\github\Werkles
npx.cmd vercel env ls production
npx.cmd vercel env ls preview
```

Expected Production count: **8** tier-A names.  
Expected Preview count: **8** tier-A names.

Report back: `PRODUCTION_ENV_NAMES_SYNCED` or list any still missing.

---

## Vercel dashboard path

1. Open [werkles1 → Settings → Environment Variables](https://vercel.com/werkles/werkles1/settings/environment-variables)
2. For each name: **Add New** → paste name → paste value from 1Password → check **Production** and/or **Preview** as table above
3. For the six names already on Preview: use **⋯ → Promote to Production** if 1Password confirms same values apply to production deploys

---

## Still gated

| Action | Gate phrase |
|--------|-------------|
| Change existing Preview values | Already covered by APPROVE SECRET ENTRY — verify in 1Password if unsure |
| Production redeploy | `APPROVE PRODUCTION ROLLOUT` |
| Live Stripe keys on Production | `APPROVE PAID CHECKOUT GO-LIVE` + live product gates |

---

## When done

Tell Lady Jessica:

```text
PRODUCTION_ENV_NAMES_SYNCED
```

or

```text
SECRET ENTRY BLOCKER: <exact missing name or dashboard issue>
```

No secret values in the message.
