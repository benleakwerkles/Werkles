# Werkles.com Vercel env name audit — names only

RECEIPT_ID: RECEIPT_WERKLES_COM_VERCEL_ENV_NAME_AUDIT_20260704
TIMESTAMP: 2026-07-04
AGENT: Lady Jessica (Maker@Betsy)
EXECUTION_CONTEXT: LOCAL_SALLY_WINDOWS
MACHINE: Betsy
VERCEL_PROJECT: werkles/werkles1 (production domain: werkles.com)
GITHUB_PRODUCTION_SOURCE: benleakwerkles/Werkles @ main (Operator confirmed)

## Passed gates (Operator)

- Supabase access gate passed
- Vercel account access gate passed
- Vercel CLI authenticated as `benleak-2090`
- Project linked non-interactively: `werkles/werkles1`

## Method

- Repo required names from `.env.example`, `lib/stripe.ts`, `lib/stripe-manifest.ts`, `lib/supabase/*`, `app/api/cron/ttl/route.ts`, `foreman/gates/OAUTH_STRIPE_OPERATOR_CHECKLIST.md`
- Vercel names from `npx.cmd vercel env ls` (encrypted values only — **no values read or printed**)
- 1Password is source of truth for values; this receipt compares **names and scope only**

## Vercel scope snapshot

| Vercel environment | Env var count |
|--------------------|---------------|
| Preview            | 6             |
| Production         | **0**         |
| Development        | 0             |

Preview names present:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID
```

Production names present:

```text
(none)
```

## Repo-required names — tier A (runtime hard requirements for auth + Foundry Dues)

| Name | In Vercel Preview | In Vercel Production | Notes |
|------|-------------------|----------------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | YES | **NO** | `requireEnv` in supabase request/server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | YES | **NO** | client + request |
| `SUPABASE_SERVICE_ROLE_KEY` | YES | **NO** | server admin client |
| `STRIPE_SECRET_KEY` | YES | **NO** | `lib/stripe.ts` |
| `STRIPE_WEBHOOK_SECRET` | YES | **NO** | stripe webhook route |
| `STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID` | YES | **NO** | preferred monthly price |
| `STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID` | **NO** | **NO** | preferred annual price; annual checkout fails without this or legacy fallback |
| `STRIPE_MONTHLY_PRICE_ID` | **NO** | **NO** | legacy fallback only |
| `STRIPE_YEARLY_PRICE_ID` | **NO** | **NO** | legacy fallback only |
| `CRON_SECRET` | **NO** | **NO** | `/api/cron/ttl` returns 500 if unset |

## Repo-required names — tier B (manifest / Crucible — not blocking basic site auth, blocking Crucible checkout)

From `lib/stripe-manifest.ts` (not in Preview or Production today):

```text
STRIPE_DRAFTING_TABLE_STANDALONE_PRICE_ID
STRIPE_CRUCIBLE_IDENTITY_REVERIFY_PRICE_ID
STRIPE_CRUCIBLE_FUNDS_PRICE_ID
STRIPE_CRUCIBLE_FUNDS_REVERIFY_PRICE_ID
STRIPE_CRUCIBLE_LICENSE_PRICE_ID
STRIPE_CRUCIBLE_REFERENCE_PRICE_ID
STRIPE_CRUCIBLE_BACKGROUND_BASIC_PRICE_ID
STRIPE_CRUCIBLE_BACKGROUND_ESSENTIAL_PRICE_ID
STRIPE_CRUCIBLE_BACKGROUND_COMPLETE_PRICE_ID
STRIPE_CRUCIBLE_MONITORING_PRICE_ID
```

## Dev-only names (do not add to Production unless explicitly scoped)

```text
NEXT_PUBLIC_LOCAL_ROUTE_PREVIEW
HERO_COPY_PREVIEW
GD_COMMAND_CONSOLE
```

## Name alignment verdict

| Check | Result |
|-------|--------|
| Preview names match canonical naming | **PARTIAL PASS** — 6/10 tier-A names present; missing annual + cron + legacy fallbacks |
| Production names match canonical naming | **FAIL** — zero Production env vars configured |
| Stray / deprecated names on Vercel | **NONE OBSERVED** in Preview |
| Rename migration needed | **NO** — existing Preview names already use preferred `STRIPE_FOUNDRY_DUES_*` spelling |

## Value verification

This audit did **not** read Vercel values, `.env.local`, or 1Password entries.

Existing Preview names may still have stale/wrong values. That requires private Operator verification in 1Password ↔ Vercel — not chat.

## STOP — human gate

```text
STOP: HUMAN GATE — APPROVE SECRET ENTRY
```

Reason: Production has **no** env vars. Preview is missing tier-A names (`STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID`, `CRON_SECRET`) and all tier-B Crucible names.

Operator action (1Password → Vercel dashboard or CLI, privately):

1. Add **Production** tier-A names with values from 1Password
2. Add missing **Preview** tier-A names (`STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID`, `CRON_SECRET`) if preview checkout/cron should work
3. Defer tier-B Crucible names until Crucible gate opens
4. Do **not** production redeploy until values are set **and** `APPROVE PRODUCTION ROLLOUT` is recorded

Gate phrases:

```text
APPROVE SECRET ENTRY        — before entering/changing any Vercel env values
APPROVE PRODUCTION ROLLOUT   — before production redeploy after env sync
```

## References

- `foreman/gates/OAUTH_STRIPE_OPERATOR_CHECKLIST.md`
- `.env.example`
- `lib/stripe-manifest.ts`
- Vercel project: https://vercel.com/werkles/werkles1/settings/environment-variables
