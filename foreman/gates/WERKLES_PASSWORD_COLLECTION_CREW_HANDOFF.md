# Werkles — Password Collection Crew Handoff

Status: **ACTIVE**  
Updated: 2026-07-07  
Lane: Werkles.com / G  
Operator: Ben  
Site: https://werkles.com

**UI runbook:** https://werkles.com/operator/gate-knockout/credential-handoff  
**Sign-in hunt:** https://werkles.com/operator/gate-knockout/sign-in-hunt

---

## Crew rules (non-negotiable)

1. **Never** paste passwords, API keys, webhook secrets, or 2FA codes into chat, Slack, email, repo files, or receipts.
2. Store secrets in **1Password** only — vault **`Werkles Automation`**, primary item **`Werkles Vercel Secrets`**.
3. Agents may **navigate and name** env vars; Ben or designated crew **enters values**.
4. Collecting a login does **not** authorize using it — each tier has a **gate phrase** Ben must say before action.
5. **HG-1** and **HG-2** are **APPROVED** (2026-07-07). Tier 1 live money and Tier 4 FCRA remain gated.

---

## Approval status snapshot

| Gate | Phrase | Status |
|------|--------|--------|
| HG-1 Test checkout + webhook | `APPROVE PAID CHECKOUT GO-LIVE (test mode)` | **APPROVED** |
| HG-2 Crucible provider test | `APPROVE CRUCIBLE PROVIDER TEST` | **APPROVED** |
| HG-3 Live Stripe products | `APPROVE LIVE STRIPE PRODUCT CREATE` | Queued |
| HG-4 Live secret entry | `APPROVE SECRET ENTRY` | Blocked (after HG-3) |
| HG-5 Live checkout | `APPROVE PAID CHECKOUT GO-LIVE` | Blocked (after HG-4) |
| Discovery response | `APPROVE DISCOVERY RESPONSE GO-LIVE` | Not approved yet |
| Background / FCRA | *(no phrase)* | Policy-blocked |

---

## Tier 0 — Infrastructure shell ✅ (mostly done)

| Provider | URL | Collect? | 1Password fields |
|----------|-----|----------|------------------|
| **1Password** | https://my.1password.com/ | Confirm unlock + CLI integration | Service account token on Betsy |
| **Supabase** | https://supabase.com/dashboard/projects | Confirm 2FA recovery | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Vercel** | https://vercel.com/login | Confirm team/project access | All tier-A names in Werkles Vercel Secrets |

**Status:** Tier-A env synced to Preview + Production. Plaid sandbox synced.

---

## Tier 1 — Money path (Stripe) 💰

**One Stripe login** covers all rows below.

| Console | URL | Gate phrase | Collect now? |
|---------|-----|-------------|--------------|
| Stripe master | https://dashboard.stripe.com/login | `APPROVE STRIPE PRODUCT PREP` | **YES** |
| Test webhooks | https://dashboard.stripe.com/test/webhooks | `APPROVE PAID CHECKOUT GO-LIVE (test mode)` | Done ✅ |
| Live products | https://dashboard.stripe.com/products | `APPROVE LIVE STRIPE PRODUCT CREATE` | **YES** (do not create yet) |
| Live webhooks + portal | https://dashboard.stripe.com/webhooks | `APPROVE PAID CHECKOUT GO-LIVE` | Plan ahead |

**Fields to store in 1Password (names only):**

```text
STRIPE_SECRET_KEY              # sk_test_* now; sk_live_* after HG-4
STRIPE_WEBHOOK_SECRET          # test whsec_* now; live after HG-4
STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID
STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID
STRIPE_CRUCIBLE_*              # see lib/stripe-manifest.ts when Crucible paid checks ship
```

**Forbidden until phrase:** No live product create (HG-3). No live key swap (HG-4). No live charge (HG-5).

---

## Tier 2 — Crucible core providers ✅ (approved)

| Provider | URL | Gate phrase | Collect? |
|----------|-----|-------------|----------|
| **Plaid** | https://dashboard.plaid.com/ | `APPROVE CRUCIBLE PROVIDER TEST` | **YES** (for prod key rotation later) |
| **Stripe Identity** | https://dashboard.stripe.com/identity/application | Same as HG-2 | Same Stripe login |

**Fields in 1Password today:**

```text
PLAID_CLIENT_ID
PLAID_SECRET
PLAID_ENV                         # sandbox
```

**Optional upgrade:** Enable Stripe Identity application for live redirect (currently sandbox stub fallback works).

---

## Tier 3 — Crucible extended (future) 📋

| Provider | URL | Gate phrase | Collect? |
|----------|-----|-------------|----------|
| **Twilio Verify** | https://console.twilio.com/ | `APPROVE CRUCIBLE PHONE PROVIDER SETUP` | Planning |
| **Checkr** (reference/employment) | https://dashboard.checkr.com/ | `APPROVE CRUCIBLE REFERENCE PROVIDER SETUP` | Planning |
| **License vendors** | TBD by state | `APPROVE CRUCIBLE LICENSE PROVIDER SETUP` | Vendor not picked |

**Future fields:**

```text
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_VERIFY_SERVICE_SID
CHECKR_API_KEY
CHECKR_WEBHOOK_SECRET
(per-vendor license API keys)
```

**Forbidden:** No SMS send, no Checkr candidate/report, no paid license check without phrase.

---

## Tier 4 — Background / FCRA ⛔ (policy-blocked)

| Provider | URL | Gate phrase | Collect? |
|----------|-----|-------------|----------|
| **Checkr** (background tiers) | https://dashboard.checkr.com/ | **None — counsel first** | Planning only |

**Do NOT:** collect consent, order reports, store background artifacts.

**Requires before any phrase:** Counsel-reviewed consent, adverse action, retention, permitted use, disputes.

---

## Tier 5 — Repo / merge 🔀

| Provider | URL | Gate phrase | Collect? |
|----------|-----|-------------|----------|
| **GitHub web** | https://github.com/login | Per merge (Ben explicit) | **YES** |
| **GitHub CLI** | `gh auth login` on Betsy | Same | **YES** |

Repo: `benleakwerkles/Werkles`

**Verify:** `gh auth status` on Betsy.

**Forbidden:** Force push to main. Push without resolving canonical guard unless Ben waives.

---

## Tier 6 — Discovery (no new vendor login) 🚪

| Surface | URL | Gate phrase | Collect? |
|---------|-----|-------------|----------|
| Discovery intake | https://werkles.com/discovery | `APPROVE DISCOVERY RESPONSE GO-LIVE` | No password — operator SLA gate |

Uses existing Supabase + operator human read. Formalizes public front door without dues.

---

## Tier 7 — Optional ⏸️

| Provider | URL | When |
|----------|-----|------|
| **Google Cloud OAuth** | https://console.cloud.google.com/apis/credentials | Only if enabling Google sign-in in Supabase |
| **Render (Ghost Forge)** | https://dashboard.render.com/ | Gate 05 PAUSE — no render spend |
| **Credit bureau** | N/A | Not in product stack — skip |

---

## Collection priority (do this order)

### Collect now
1. **Stripe** (master — unlocks test + live + Identity)
2. **GitHub** web + **gh** CLI on Betsy
3. **Plaid** dashboard (future production keys)
4. Confirm **Supabase**, **Vercel**, **1Password** sessions still valid

### Collect for planning (do not activate)
5. **Twilio**
6. **Checkr**
7. **Google Cloud** (only if OAuth planned)

### Skip until counsel / product decision
8. Checkr **background** tier
9. Credit bureau vendors
10. Render (Ghost Forge paused)

---

## After collection checklist

- [ ] Each login stored in 1Password **Login** item (URL, username, password, 2FA recovery notes)
- [ ] API keys stored as **Secure Note** or custom fields on **Werkles Vercel Secrets** — never in repo
- [ ] Crew confirms `op account list` and `op run` work on Betsy (Lady Jessica / Dink sync path)
- [ ] No values pasted into `foreman/receipts/` or git commits
- [ ] Ben records any gate approval in `foreman/gates/APPROVAL_LOG.md`

---

## Human gate phrase quick reference (future)

| Phrase | Unlocks |
|--------|---------|
| `APPROVE LIVE STRIPE PRODUCT CREATE` | Live Foundry Dues products in Stripe |
| `APPROVE SECRET ENTRY` | Live keys + price IDs into Vercel via 1Password |
| `APPROVE PAID CHECKOUT GO-LIVE` | Real money checkout on werkles.com |
| `APPROVE DISCOVERY RESPONSE GO-LIVE` | Public discovery SLA commitment |
| `APPROVE CRUCIBLE PHONE PROVIDER SETUP` | Twilio Verify wiring |
| `APPROVE CRUCIBLE REFERENCE PROVIDER SETUP` | Checkr reference/employment prep |
| `APPROVE CRUCIBLE LICENSE PROVIDER SETUP` | State license vendor API |
| `APPROVE SUPABASE GOOGLE OAUTH` | Google social sign-in |
| `APPROVE PRODUCTION ROLLOUT` | New production deploy (tier-A done; reuse for major rollouts) |

---

## Source of truth in repo

- `lib/product-human-gates.ts` → `productGateCredentialHandoff`
- `foreman/gates/APPROVAL_LOG.md`
- `foreman/gates/werkles-vercel-tier-a.env.oprefs`
- `foreman/gates/werkles-crucible-provider.env.oprefs`
- `lib/stripe-manifest.ts`
