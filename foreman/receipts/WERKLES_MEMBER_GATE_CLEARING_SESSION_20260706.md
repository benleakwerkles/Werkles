# Member Gate Clearing Session — 2026-07-06

Status: **HG-1 + HG-2 APPROVED — HG-3–5 when you want live money**
Lane: Werkles.com / G
Site: https://werkles.com

---

## Before you click — Human Gates to clear (in order)

| # | Gate | Exact phrase when proof is done |
|---|------|----------------------------------|
| **HG-1** | Test checkout + webhook | `APPROVE PAID CHECKOUT GO-LIVE (test mode)` |
| **HG-2** | Crucible identity + funds (sandbox) | `APPROVE CRUCIBLE PROVIDER TEST` |
| HG-3 | Live Stripe products | `APPROVE LIVE STRIPE PRODUCT CREATE` *(blocked until HG-1)* |
| HG-4 | Live secret entry | `APPROVE SECRET ENTRY` *(blocked until HG-3)* |
| HG-5 | Live checkout | `APPROVE PAID CHECKOUT GO-LIVE` *(blocked until HG-4)* |

**Clear HG-1 and HG-2 now.** HG-3–5 are real-money; do not run until you explicitly want live Foundry Dues.

---

## Mechanical prep — DONE (agent)

| Proof | Status |
|-------|--------|
| Production deploy (Crucible + checkout + Plaid) | PASS — werkles.com |
| Tier-A env 8/8 (Preview + Production) | PASS |
| Plaid env 3/3 (Preview + Production) | PASS |
| Stripe webhook 7 events (checkout + subscription + identity) | PASS |
| Plaid link_token API smoke | PASS |
| Stripe Identity API smoke | PARTIAL — `rk_test_*` restricted; sandbox stub OK |
| Production routes 200 | `/membership`, `/billing`, `/crucible`, gate runbooks |
| Mule receipt | `foreman/receipts/WERKLES_CRUCIBLE_PROVIDER_MULE_20260705.json` |

---

## HG-1 — Test checkout + webhook

**Runbook:** https://werkles.com/operator/gate-knockout/test-checkout-smoke

### Your hands (~10 min)

1. Log in → https://werkles.com/login
2. Open https://werkles.com/membership
3. Stripe Dashboard → **Test mode ON**
4. Start Foundry Dues checkout → card **4242 4242 4242 4242**
5. After pay, open https://dashboard.stripe.com/test/webhooks → confirm `checkout.session.completed` on `https://werkles.com/api/webhooks/stripe`
6. Open https://werkles.com/dashboard/billing → confirm **member + active** (webhook-backed, not success page alone)

### Say when done

```text
APPROVE PAID CHECKOUT GO-LIVE (test mode)
```

---

## HG-2 — Crucible provider test (sandbox)

**Prerequisite:** HG-1 (active membership)

**Runbook:** https://werkles.com/operator/gate-knockout/test-crucible-smoke

### Your hands (~10 min)

1. Open https://werkles.com/dashboard/crucible
2. **Identity** — run check; complete Stripe Identity test doc upload *or* accept sandbox stub if redirect fails
3. **Funds** — run check; complete Plaid Link sandbox flow
4. Open https://werkles.com/dashboard/profile → confirm `id_status` / `funds_status` updated

### Optional (better Identity redirect)

Enable Identity: https://dashboard.stripe.com/test/identity/application

### Say when done

```text
APPROVE CRUCIBLE PROVIDER TEST
```

---

## HG-3–5 — Live paid membership (later)

Do not clear until HG-1 is accepted and you want real charges.

| Gate | Phrase | Your hands |
|------|--------|------------|
| Live products | `APPROVE LIVE STRIPE PRODUCT CREATE` | Create live Foundry Dues products in Stripe |
| Live secrets | `APPROVE SECRET ENTRY` | Enter `sk_live_*`, live webhook secret, live price IDs (1Password mule can sync) |
| Live checkout | `APPROVE PAID CHECKOUT GO-LIVE` | First real payment + live webhook proof |

---

## Policy-blocked (not in this session)

- **Background checks (FCRA)** — no phrase; stays blocked
- **Push to main / lane merge** — separate gate

---

## Decision packet template

After each HG, record in https://werkles.com/operator/gate-knockout/decision-packet:

- Gate key
- Outcome: APPROVED | BLOCKED | DEFERRED | SCOPED_OUT
- Proof summary (no secrets)
- Timestamp
