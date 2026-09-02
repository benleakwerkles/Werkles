# Tier 1 Gate — Live Crucible path (HG-3 → HG-5)

**Status:** `HG-3 APPROVED 2026-07-23` — Ben Dashboard create in progress; HG-4/HG-5 still awaiting phrases  
**Prepared:** `2026-07-21`  
**Prepared by:** Lady Jessica (Maker@Betsy)  
**Confidence:** `MEDIUM`  
**Lane:** Werkles.com / G  
**HTML:** `foreman/reviews/GATE-live-crucible-hg3-hg5-20260721.html`

## Decision

Open the **live-money / live-provider** path that takes Crucible beyond sandbox provider-test (HG-2)?

This is **not** one phrase. It is three ordered Tier 1 gates. Clear them in order only.

## Already complete (do not re-clear)

| Gate | Phrase | Status |
|------|--------|--------|
| HG-1 Test checkout | `APPROVE PAID CHECKOUT GO-LIVE (test mode)` | **APPROVED** 2026-07-07 |
| HG-2 Crucible sandbox | `APPROVE CRUCIBLE PROVIDER TEST` | **APPROVED** 2026-07-07 |

Sandbox Crucible is already on werkles.com (`/dashboard/crucible`). Live mode is what this packet covers.

## Ordered phrases (HG-3 → HG-5)

### HG-3 — Live Stripe products

```text
APPROVE LIVE STRIPE PRODUCT CREATE
```

**Status:** **APPROVED** 2026-07-23 (Operator: `Approve live stripe product create.`)  
Receipt: `foreman/receipts/WERKLES_HG3_LIVE_STRIPE_PRODUCT_CREATE_APPROVED_20260723.md`  
Hands card: `foreman/handoffs/outbox/TO_OPERATOR_HG3_LIVE_STRIPE_PRODUCT_CREATE_HANDS_20260723.md`

**Ben hands:** Stripe Dashboard → **Test mode OFF** → create live Foundry Dues products/prices (monthly + annual). Do not paste price IDs into chat.

**Crew after phrase:** Map live price ID **names** into 1Password / Vercel prep only; Ben still owns create/save in Stripe.

### HG-4 — Live secret entry

```text
APPROVE SECRET ENTRY
```

**Requires:** HG-3 products exist.

**Ben hands:** Enter privately (1Password / Vercel) — never in chat:
- `STRIPE_SECRET_KEY` (`sk_live_*`)
- live `STRIPE_WEBHOOK_SECRET` (`whsec_*`)
- live Foundry price IDs
- live Plaid / Identity credentials if flipping providers out of sandbox

**Crew:** Names-only mule/sync; no printing values.

### HG-5 — Live checkout go-live

```text
APPROVE PAID CHECKOUT GO-LIVE
```

**Requires:** HG-3 + HG-4.

**Ben hands:** First real Foundry Dues payment + confirm live webhook on `https://werkles.com/api/webhooks/stripe` + billing shows member+active.

**Crew after phrase:** Live smoke receipt; keep FCRA blocked.

## Confidence justification (MEDIUM)

1. Sandbox path is proven; live Stripe/Plaid/Identity modes are not.
2. Real charges and live secrets are irreversible blast radius.
3. Stripe Identity previously needed stub fallback even in test (`rk_test_*` restriction) — live Identity may need extra dashboard enablement.
4. Export/deletion / owner-binding for personal artifacts still incomplete for some Matching surfaces (related trust posture).

## Blast radius

- Real member charges (Foundry Dues)
- Live webhook + billing portal
- Possible live Identity / Plaid production traffic
- Liability if live Crucible claims outrun sandbox proof
- No FCRA background checks in this packet

## Still blocked after HG-5

| Item | Status |
|------|--------|
| Background checks (FCRA) | **Policy-blocked** — no phrase in this packet |
| `MATCHING_LLM_TRANSLATE_ENABLED` | Separate gate |
| Push to `main` / unrelated merges | Separate gate |
| Opening public Bellows intake submit | Separate gate (`APPROVE OPEN BELLOWS INTAKE SUBMISSION ON WERKLES.COM`) |

## What remains blocked until phrases

- Creating live Stripe products
- Entering `sk_live_*` / live webhook secrets
- Charging real cards on werkles.com
- Claiming live Crucible provider verification beyond sandbox

## Approve / reject / patch

**Approve HG-3 only (start the chain):**

```text
APPROVE LIVE STRIPE PRODUCT CREATE
```

**Reject whole live path:**

```text
REJECT LIVE CRUCIBLE HG-3-HG-5 PATH
```

**Patch:**

```text
PATCH LIVE CRUCIBLE HG-3-HG-5: <instructions>
```

Do **not** say `APPROVE PAID CHECKOUT GO-LIVE` until HG-3 and HG-4 are done — that phrase is HG-5 only (and is different from the already-used test-mode phrase).

## Runbooks

- Member gate session: `foreman/receipts/WERKLES_MEMBER_GATE_CLEARING_SESSION_20260706.md`
- HG-2 receipt: `foreman/receipts/WERKLES_HG2_CRUCIBLE_PROVIDER_APPROVED_20260707.md`
- Operator gate knockout: https://werkles.com/operator/gate-knockout
