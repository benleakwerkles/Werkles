# WERKLES_CRUCIBLE_PROVIDER_TEST_20260705

RECEIPT_ID: WERKLES_CRUCIBLE_PROVIDER_TEST_20260705
TIMESTAMP: 2026-07-05
LANE: Werkles.com / Crucible
APPROVAL: Unlock sandbox crucible and build provider test

## Before you click (Crucible checks)

1. **Active Foundry member** — test checkout + webhook must set `membership_tier: member` and `subscription_status: active`
2. **Log in** → `/dashboard/crucible`
3. **Identity** — redirects to Stripe Identity (test) when enabled on your Stripe account; else sandbox stub
4. **Funds** — opens Plaid Link when `PLAID_CLIENT_ID` + `PLAID_SECRET` are in Vercel; else sandbox stub
5. **Proof** — profile `id_status` / `funds_status` + Stripe identity webhooks — not button click alone

## Code changes

| Item | Detail |
|------|--------|
| `APP_INFRA_PREVIEW_CRUCIBLE` | `false` — sandbox unlocked |
| `CRUCIBLE_PROVIDER_TEST_ENABLED` | `true` |
| `lib/crucible-providers.ts` | Stripe Identity session + Plaid link token + exchange |
| `/api/verification/identity` | Redirect to Stripe Identity or sandbox fallback |
| `/api/verification/funds` | Plaid Link token or sandbox fallback |
| `/api/verification/funds/exchange` | Plaid public_token → `funds_status: sandbox_verified` |
| `/api/webhooks/stripe` | Handles `identity.verification_session.*` events |
| UI | Provider banner, Plaid Link launcher, member dashboard copy |

## Ben — Stripe dashboard (one-time)

On **test** webhook endpoint `https://werkles.com/api/webhooks/stripe`, subscribe to:

- `identity.verification_session.verified`
- `identity.verification_session.processing`
- `identity.verification_session.requires_input`
- `identity.verification_session.canceled`

Enable **Stripe Identity** on test account: https://dashboard.stripe.com/test/identity/application

## Ben — Plaid (optional for funds Link)

Add to Vercel (template: `foreman/gates/werkles-crucible-provider-test.env.template`):

- `PLAID_CLIENT_ID`
- `PLAID_SECRET`
- `PLAID_ENV=sandbox`

Without Plaid env, Funds check uses sandbox stub only.

## Still blocked

- Background checks (FCRA)
- Phone, license, reference, employment APIs
- Tier-B Crucible Stripe Checkout per paid check
- Live provider keys / live Identity

## Deploy note

Changes are local on `maker/site-g-20260703` until preview/production deploy gate.
