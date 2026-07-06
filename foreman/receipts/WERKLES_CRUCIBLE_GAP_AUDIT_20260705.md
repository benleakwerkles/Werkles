# WERKLES_CRUCIBLE_GAP_AUDIT_20260705

RECEIPT_ID: WERKLES_CRUCIBLE_GAP_AUDIT_20260705
TIMESTAMP: 2026-07-05
LANE: Werkles.com / Crucible
VOICE: Squibb honest gap map

## What exists (not missing)

| Layer | Status |
|-------|--------|
| Route `/dashboard/crucible` | Built |
| UI — 11 check cards from `lib/pricing.ts` | Built |
| Workflow state cards + trust copy | Built |
| Profile fields `id_status`, `funds_status` | Schema in `00002_v03_access_membership_monetization.sql` |
| `verification_badges` table | Schema in `00001_initial_schema.sql` |
| Sandbox APIs | `/api/verification/identity`, `/api/verification/funds` |
| Membership gate on APIs | `requireActiveMembership` — needs `member` + `active` |
| Operator gates docs | Gate 5 `APPROVE CRUCIBLE PROVIDER TEST`, background FCRA blocked |

## Master kill switch (why buttons do nothing)

```text
lib/app-infra-preview.ts → APP_INFRA_PREVIEW_CRUCIBLE = true
```

While true:
- CruciblePanel disables all check buttons
- InfraPreviewBanner shows on `/dashboard/crucible`
- POST `/api/verification/*` returns 403

## Check-by-check gap map

| Check | UI card | API route | Real provider | Vercel env (tier-B) |
|-------|---------|-----------|---------------|---------------------|
| Identity | yes | sandbox only | Stripe Identity — **not wired** | STRIPE_CRUCIBLE_* not in tier-A |
| Funds | yes | sandbox only | Plaid — **not wired** | not synced |
| Phone | yes | **none** | Twilio — **not wired** | not synced |
| Identity re-verify | yes | **none** | Stripe Identity | not synced |
| Funds re-verify | yes | **none** | Plaid | not synced |
| License | yes | **none** | state lookup TBD | not synced |
| Reference | yes | **none** | provider TBD | not synced |
| Employment | yes | **none** | provider TBD | not synced |
| Background Basic/Essential/Complete | yes | **none** | Checkr etc. | **policy blocked** (FCRA) |
| Continuous monitoring | yes | **none** | provider TBD | not synced |

Only **identity** and **funds** have routes in `lib/crucible.ts`. Both are **sandbox stubs** (write `sandbox_pending` to profile — no provider redirect, no payment, no webhook callback).

## Three Crucible tiers (what Ben can do next)

### Tier A — Sandbox runway (no provider accounts)

Requires:
1. `APP_INFRA_PREVIEW_CRUCIBLE = false` (code flip — separate from payment tier-A env)
2. Active Foundry membership on profile (test checkout + webhook proof)
3. Supabase migration `00002` applied on live project (id_status / funds_status columns)

Then: logged-in member can click Identity/Funds → profile shows `sandbox_pending`.

Does **not** require Stripe Identity, Plaid, or tier-B price IDs.

### Tier B — Provider test mode (Gate 5)

Requires:
- `APPROVE CRUCIBLE PROVIDER TEST`
- Stripe Identity application + test sessions
- Plaid sandbox (or chosen funds provider)
- Tier-B Stripe price IDs in Vercel (9 names in env audit tier-B list)
- Provider webhook/callback handlers (not built)
- Payment checkout per paid check ($9.99 funds, etc.) — not built

### Tier C — Background / FCRA (Gate 6)

Requires:
- Counsel-reviewed consent, adverse action, retention
- `background-fcra` gate — **policy blocked** today
- No consent collection until policy proof

## Still gated (do not cross without phrase)

| Action | Gate |
|--------|------|
| Flip Crucible out of preview | Operator decision / `APPROVE CRUCIBLE PROVIDER TEST` for live providers; sandbox-only flip is lower risk |
| Open Stripe Identity paid session | `APPROVE CRUCIBLE PROVIDER TEST` |
| Background checks | FCRA / counsel |
| Tier-B env sync to Vercel | Extends secret entry scope |
| Harvey lane | Not Betsy |

## Recommended next mechanical step

If test checkout webhook proof is done: enable **sandbox Crucible only** (flip `APP_INFRA_PREVIEW_CRUCIBLE`, keep provider integrations stubbed). That lets the runway UI prove membership → check → profile state without Plaid or Stripe Identity.
