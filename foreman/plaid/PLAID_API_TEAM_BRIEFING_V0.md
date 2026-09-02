# Werkles × Plaid — API Team Briefing V0

**Prepared for:** Plaid API / partnerships / solutions engineering  
**Date:** 2026-07-10  
**Company:** Werkles, Inc.  
**Site:** https://werkles.com  
**Contact lane:** Operator (Ben Leak) — technical implementation via internal crew

---

## Executive summary

Werkles is a **formation and verification-gated networking platform** for builders, operators, backers, and connectors. We are **not** a lender, broker-dealer, or payment facilitator between users.

We want to use Plaid so members can:

1. **Connect once** — Werkles custodies the Item (with member consent)
2. **Refresh liquidity proof on demand** — paid verification event
3. **Share a proof receipt with another member** — e.g. before a partnership or capital conversation
4. **Optionally exchange proofs mutually** — both sides prove threshold in the same session

We do **not** want to show live balances to other users or take a cut of deals. We sell the **inspection workflow** (Iron Firewall).

---

## Current integration status

| Item | Status |
|------|--------|
| Environment | **Sandbox** (`PLAID_ENV=sandbox`) |
| Link | Wired — `products: ["assets"]` |
| Token exchange | `/api/verification/funds/exchange` — **does not persist access_token yet** |
| Production keys | Not live — gated |
| Webhooks | Not wired |
| Identity via Plaid | Not primary — Stripe Identity for ID |

---

## Target use cases (priority order)

### UC-1 — Persistent connect (P0)

Member links bank via Plaid Link. Werkles stores `item_id` + encrypted `access_token`. Member sees “Funds proof connected” on profile. Initial snapshot receipt generated.

### UC-2 — On-demand refresh (P0)

Member pays fee → server calls Plaid → new receipt with `as_of` timestamp and liquidity band vs self-declared threshold. Receipt expires (e.g. 30 days).

### UC-3 — Share receipt with counterparty (P1)

Member A shares receipt with Member B inside Werkles (intro request / Blueprint context). B sees **receipt only** — threshold met/not met, band, as-of, expiry — not A’s full financials.

### UC-4 — Mutual proof session (P2)

A and B both refresh (each pays) in one session; both receipts must be fresh before Werkles surfaces “capital/partner path unlocked” in matching UI.

---

## What we will show end users

**To the member (owner):** connection status, last refresh date, fee to refresh, revoke link.

**To the counterparty:** derived receipt card:

- Threshold statement (member-configured band, e.g. “≥ $50k investable”)
- Result: met / not met / stale
- As-of timestamp
- Provider: Plaid (Assets)
- Expiry
- Falsifiers / limitations (educational copy)

**We will not show counterparties by default:** exact balance, account numbers, institution credentials, transaction history.

---

## Anticipated Plaid products

| Product | Why |
|---------|-----|
| **Link** | Initial connect + `update` mode for re-auth |
| **Assets** | Liquidity proof refresh |
| **Balance** | Evaluate if sufficient for lighter band checks |
| **Webhooks** | `ITEM_LOGIN_REQUIRED`, errors, consent expiration |

**Question for Plaid:** Minimum product bundle for recurring **threshold band** proofs without retaining full Asset Reports?

---

## Technical architecture (summary)

```
Member → Plaid Link → public_token
       → Werkles server exchanges → encrypted access_token + item_id stored
       → (optional) Assets pull → liquidity_proof_receipt row

Refresh → Stripe payment → Assets/Balance API → new receipt

Share → proof_session + disclosed_receipt_view (counterparty user_id)
```

Server-only token storage. RLS on all proof tables. No access_token to browser.

Full detail: `foreman/plaid/PLAID_TECHNICAL_SPEC_V0.md`

---

## Compliance posture

- **Not** offering credit, underwriting, or investment advice
- **Not** moving money between users
- **Not** using proof as pay-to-play social rank
- FCRA background checks are a **separate** provider (Checkr) — out of scope for this Plaid thread
- Members initiate verification on themselves; sharing is opt-in per session
- Privacy Policy / data deletion: Items revoked on account deletion request

**Question for Plaid:** Any additional compliance review or MSA terms for **member-to-member disclosed proof receipts** (B2B2C verification workflow)?

---

## Commercial model (draft)

- Member-paid per connect snapshot and per refresh (published pricing)
- Werkles margin = bounded handling fee, not transaction %
- Need Plaid guidance on **per-Item monthly cost** vs **per-Assets-request** pricing for our refresh cadence

**Question for Plaid:** Recommended pricing model for “connect once, refresh on demand” at low volume (early) scaling to thousands of Items?

---

## Sandbox → production path

What we need from Plaid to go live:

1. Production enablement checklist
2. Webhook endpoint registration guidance
3. OAuth / redirect URI confirmation for werkles.com
4. Review of use case description (this doc)
5. Any required end-user consent copy approvals
6. Identity vs Assets bundling rules if we add Balance later

---

## Open questions for API team

1. **Persistent Item custody** — confirm Werkles as application owner storing access tokens server-side is correct pattern for our use case.
2. **Assets vs Balance** — for “meets $X threshold” band, which product is appropriate and cost-optimal?
3. **Asset Report retention** — can we parse response server-side, store only derived band + timestamp, discard raw report?
4. **Update mode** — best practice for `ITEM_LOGIN_REQUIRED` UX in a verification product (not daily fintech app).
5. **Multi-account Items** — if member links multiple accounts, how should we aggregate for a single “investable liquidity” receipt?
6. **Webhook catalog** — minimum set for production reliability.
7. **Rate limits** — expected limits for refresh-on-demand (bursty, user-initiated).
8. **Disclosure to third party** — any Plaid policy constraints on showing derived proof to another user inside our platform?
9. **Mutual proof** — two Items, two refreshes, one session — anything we should avoid?
10. **Partnership / startup program** — sandbox is live; path to production keys and solutions contact.

---

## Appendix — current API calls (sandbox)

```http
POST /link/token/create
  products: ["assets"]
  country_codes: ["US"]
  user.client_user_id: <werkles_user_uuid>

POST /item/public_token/exchange
  → access_token, item_id

# Planned
POST /assets/get (or equivalent) with stored access_token
```

---

## Internal references

- Doctrine: `company/PLAID_PERSISTENT_LIQUIDITY_PROOF_V0.md`
- Pricing: `company/PRICING.md` §3.1 Funds
- Monetization law: `company/WERKLES_MONETIZATION.md`

**Werkles does not claim regulatory clearance in this document. Production launch requires internal counsel + operator gates.**
