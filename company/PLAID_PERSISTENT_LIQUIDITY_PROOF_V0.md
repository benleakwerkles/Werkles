# Plaid Persistent Liquidity Proof V0

Status: **DRAFT — partnership + schema gate pending**  
Issued: 2026-07-10  
Operator input: Plaid conversation — Werkles owns customer Items; on-demand proof for a fee; mutual proof between members.  
Authority: `company/WERKLES_MONETIZATION.md` (Iron Firewall), `company/WERKLES_TRUST_AND_COMPLIANCE.md`, `company/PRICING.md`, `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md`

---

## 1. What Werkles is building (one sentence)

**Persistent bank connection custody + on-demand, fee-per-event liquidity proof receipts** that members may share with a counterparty before partnership or capital conversations — not live balance dashboards and not Werkles vouching for deals.

---

## 2. What Plaid described (operator map)

| Plaid concept | Werkles product meaning |
|---------------|-------------------------|
| Werkles owns the **Item** | Store Plaid `item_id` + encrypted `access_token` per member; refresh server-side |
| Connection stays with the customer | Link once; member can revoke; Werkles does not re-prompt every proof |
| Prove funds **any time** (for a fee) | **Proof refresh event** — Plaid API pull at request time → receipt |
| Member A proves to Member B | **Disclosed proof packet** — band/threshold + timestamp, not raw balances |
| Mutual proof | **Proof session** — both sides may refresh and exchange receipts in one intro window |
| Otherwise snapshot | Initial connect = baseline snapshot receipt; stale without paid refresh |

---

## 3. Iron Firewall (non-negotiable)

Werkles **may**:

- sell the verification workflow (connect, refresh, share receipt, admin handling)
- charge pass-through + bounded handling fee per proof event
- show counterparty a **derived receipt** (threshold met, liquidity band, as-of time)

Werkles **may not**:

- hold, move, or escrow money between users
- imply Werkles guarantees investment capacity or creditworthiness
- sell stronger trust because a user paid more (pay-to-play badges)
- expose full account numbers, exact balances, or transaction detail to counterparties by default
- broker equity, loans, or introductions as a regulated intermediary

> Membership unlocks access to verification providers. It does not unlock verification itself.

---

## 4. Proof receipt doctrine (what counterparties see)

Speaker-delivered facts only. Example shape:

```text
Proof type: Liquidity threshold (not credit, not net worth)
As of: 2026-07-10T18:32:00Z
Threshold: Member stated ≥ $50,000 investable liquidity
Result: Threshold met (verified band: $50k–$100k)
Evidence strength: provider_verified
Expires: 2026-08-10T18:32:00Z
Falsifiers: Large outbound transfer after as-of; linked accounts not included; stale refresh
```

**Never default:** exact balance, account mask, institution login credentials, full asset report PDF to counterparty.

---

## 5. Product flows

### 5.1 Connect (once)

1. Foundry member opens Crucible → **Connect funds proof**
2. Plaid Link (`products: assets`, later `balance` if required)
3. Server exchanges `public_token` → stores Item (encrypted)
4. Optional: run initial snapshot → receipt v0 (included in first connect fee or bundled)

### 5.2 Refresh proof (paid)

1. Member requests fresh proof (or counterparty requests via session)
2. Stripe charge (published price; see `company/PRICING.md` funds re-verification)
3. Server calls Plaid Assets/Balance with stored access token
4. Derive band + threshold result server-side
5. Write `liquidity_proof_receipt` + update `funds_status` summary on profile

### 5.3 Share with counterparty

1. Initiator creates **proof session** (intro staging, Blueprint seat, or explicit “prove to partner”)
2. Counterparty accepts session
3. Initiator pays refresh (or both pay — product TBD)
4. Counterparty sees **receipt view** only — not Crucible admin raw data

### 5.4 Mutual proof

1. Both members connected Items (or connect during session)
2. Session state: `requested` → `both_connected` → `receipts_exchanged` → `closed`
3. Matching engine may weight capital/partner paths only when **both** receipts exist and are fresh

---

## 6. Plaid products (anticipated)

| Product | Role |
|---------|------|
| **Link** | Initial connect + re-auth (`update` mode) |
| **Assets** | Primary liquidity snapshot / refresh |
| **Balance** | Optional lighter refresh if Assets cost/latency too high for band checks |
| **Webhooks** | `ITEM_LOGIN_REQUIRED`, `PENDING_EXPIRATION`, error recovery |
| **Identity** (future) | Separate lane — Stripe Identity primary today |

Confirm with Plaid API team: minimum product set for **threshold band** proofs without storing full asset reports long-term.

---

## 7. Data retention

| Data | Store? | Notes |
|------|--------|-------|
| `access_token` | Yes, encrypted | Server-only; never client |
| `item_id` | Yes | Join key |
| Full Plaid asset JSON | **No** (default) | Parse → receipt → discard; optional short TTL blob for dispute |
| Proof receipt summary | Yes | Shareable artifact |
| Counterparty view log | Yes | Who saw what receipt when |

Align retention with Privacy Policy + Plaid data handling agreement.

---

## 8. Pricing posture (draft)

Aligns with `company/PRICING.md`:

- **Initial funds connect + snapshot:** $9.99 (published)
- **Refresh / share event:** $2.99+ (pass-through + ≤$5 handling)
- **Mutual session:** each side pays own refresh OR initiator pays both (TBD with counsel)

Plaid per-Item monthly cost must be modeled before final public price lock.

---

## 9. Matching / Layer 0 integration

- Without fresh liquidity receipt: matching engine stays on `verify_proof` / not-match paths
- With receipt: may unlock `raise_capital`, `find_banker`, `stage_intro_candidate` **as paths**, not as people matches
- Receipt age > TTL → downgrade to snapshot/stale; require refresh

---

## 10. Human gates before production

| Gate | Trigger |
|------|---------|
| Schema migration apply | `APPROVE PLAID PERSISTENCE SCHEMA` (proposed) |
| Production Plaid keys | Credential handoff + env promote |
| Live `funds_status: live_verified` | `APPROVE PLAID LIVE LIQUIDITY PROOF` |
| Counterparty receipt UI public | Counsel + Petra review |
| Mutual proof sessions | After single-party refresh proven |

---

## 11. Related artifacts

- `foreman/plaid/PLAID_API_TEAM_BRIEFING_V0.md` — send to Plaid
- `foreman/plaid/PLAID_TECHNICAL_SPEC_V0.md` — engineering map
- `foreman/plaid/PLAID_SCHEMA_DRAFT_V0.sql` — not applied until gate
- `lib/plaid/types.ts` — shared types
- Current code: `lib/crucible-providers.ts`, `/api/verification/funds/*`
