# Plaid Persistent Liquidity — Technical Spec V0

Status: **DRAFT** — implementation blocked on schema gate + production keys  
Doctrine: `company/PLAID_PERSISTENT_LIQUIDITY_PROOF_V0.md`

---

## 1. System context

```
┌─────────────┐     Link      ┌──────────────┐     Assets/Balance    ┌───────┐
│   Member    │ ────────────► │ Werkles API  │ ────────────────────► │ Plaid │
│  (browser)  │ ◄──────────── │   (server)   │ ◄──────────────────── │       │
└─────────────┘   receipt UI  └──────┬───────┘                       └───────┘
                                     │
                              ┌──────▼───────┐
                              │   Supabase   │
                              │ plaid_items  │
                              │ receipts     │
                              │ sessions     │
                              └──────────────┘
```

---

## 2. Code map (existing → planned)

| Layer | Today | Planned |
|-------|-------|---------|
| Link token | `lib/crucible-providers.ts` → `createPlaidLinkToken` | Add `access_token` update / webhook recovery |
| Exchange | `app/api/verification/funds/exchange/route.ts` | Persist Item + initial receipt |
| Link token GET | `app/api/verification/funds/route.ts` | Unchanged |
| Token storage | **Discarded** | `lib/plaid/item-store.ts` (encrypt at rest) |
| Refresh | — | `lib/plaid/refresh-liquidity-proof.ts` |
| Receipt builder | — | `lib/plaid/build-receipt.ts` |
| Share session | — | `lib/plaid/proof-session.ts` |
| Webhooks | — | `app/api/webhooks/plaid/route.ts` |
| UI | `components/crucible/crucible-panel.tsx` | Receipt card + share session UI |
| Matching | `lib/matching/*` | Weight paths when `liquidity_proof_receipt` fresh |

---

## 3. API routes (planned)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/verification/funds/link-token` | member | Create Link token (rename from current funds route) |
| POST | `/api/verification/funds/exchange` | member | Exchange + **persist Item** + snapshot receipt |
| POST | `/api/verification/funds/refresh` | member | Paid refresh → new receipt |
| GET | `/api/verification/funds/receipts` | member | Own receipt history |
| POST | `/api/verification/funds/sessions` | member | Start share/mutual session |
| POST | `/api/verification/funds/sessions/:id/accept` | member | Counterparty accept |
| GET | `/api/verification/funds/sessions/:id` | session participant | View exchanged receipts |
| DELETE | `/api/verification/funds/item` | member | Revoke Plaid Item |
| POST | `/api/webhooks/plaid` | Plaid signature | Item health, login required |

Stripe: checkout session or PaymentIntent before `refresh` (reuse checkout patterns).

---

## 4. Plaid API sequence

### 4.1 Connect

```text
1. link/token/create { products: [assets], user: { client_user_id } }
2. Link UI → public_token
3. item/public_token/exchange → access_token, item_id
4. assets/get (or assets/report flow per Plaid guidance)
5. derive band → insert liquidity_proof_receipt
6. update profiles.funds_status
```

### 4.2 Refresh

```text
1. Verify Stripe payment (or membership credit)
2. Load plaid_items row for user
3. If ITEM_LOGIN_REQUIRED → return Link update mode token
4. assets/get with stored access_token
5. New receipt row; mark prior receipt superseded
```

### 4.3 Webhooks (minimum)

| Code | Action |
|------|--------|
| `ITEM_LOGIN_REQUIRED` | Set item status `login_required`; notify member |
| `PENDING_EXPIRATION` | Warn member to re-auth |
| `ERROR` | Set item `error`; block refresh until fixed |

---

## 5. Receipt derivation (server-side)

Input: Plaid Assets response + member `stated_threshold_cents` (from profile or session).

Output (`LiquidityProofReceipt`):

```typescript
{
  as_of: ISO8601,
  threshold_cents: number,
  threshold_met: boolean,
  liquidity_band: "under_25k" | "25k_50k" | "50k_100k" | "100k_250k" | "250k_plus",
  currency: "USD",
  evidence_strength: "provider_verified",
  expires_at: ISO8601,  // e.g. as_of + 30d
  provider: "plaid",
  provider_env: "sandbox" | "production",
  falsifiers: string[]
}
```

**Do not persist** full Plaid JSON in counterparty-visible tables.

---

## 6. Encryption

- `access_token` encrypted with server key (`PLAID_TOKEN_ENCRYPTION_KEY` or Supabase vault pattern)
- Never log tokens
- Service role only for Item read/write
- Rotation procedure TBD with ops

---

## 7. RLS summary

| Table | Owner read | Counterparty read | Admin |
|-------|------------|-------------------|-------|
| `plaid_items` | self | — | admin |
| `liquidity_proof_receipts` | self | via active session only | admin |
| `liquidity_proof_sessions` | participants | participants | admin |
| `liquidity_proof_disclosures` | auditor log | — | admin |

---

## 8. Matching engine hooks

```typescript
// lib/matching/crucible-weights.ts (planned)
function liquidityProofBoost(signals, receipts): number {
  if (!receipt?.threshold_met) return 0;
  if (receipt.expires_at < now) return 0; // stale → verify_proof only
  return 15; // boost capital paths, never auto-match people
}
```

---

## 9. Environment variables

| Var | Purpose |
|-----|---------|
| `PLAID_CLIENT_ID` | Plaid app |
| `PLAID_SECRET` | Plaid secret |
| `PLAID_ENV` | sandbox / production |
| `PLAID_TOKEN_ENCRYPTION_KEY` | Encrypt access tokens at rest |
| `PLAID_WEBHOOK_VERIFICATION_KEY` | Webhook JWT verification |

Tier-A custody: `foreman/gates/werkles-vercel-tier-a.env.oprefs`

---

## 10. Implementation slices (ordered)

1. **Schema gate** — apply `PLAID_SCHEMA_DRAFT_V0.sql`
2. **Persist exchange** — stop discarding token; encrypt store
3. **Receipt builder** — sandbox Assets pull
4. **Refresh + Stripe** — paid event
5. **Webhooks** — item health
6. **Share session v1** — one-way disclose
7. **Mutual session** — two-party
8. **Matching weights** — shadow then public
9. **Production keys** — operator gate

---

## 11. Test plan (sandbox)

| Test | Pass criteria |
|------|---------------|
| Link + exchange | `plaid_items` row; receipt row; funds_status updated |
| Refresh | New receipt; old marked superseded; Stripe test charge |
| Stale receipt | Matching does not boost capital paths |
| Share session | Counterparty sees receipt; not raw Plaid fields |
| Revoke | Item removed; tokens deleted |
| Webhook login required | Status flips; update Link offered |

Mule: extend `Test-WerklesCrucibleSmoke.ps1` or new `Test-WerklesPlaidPersistenceSmoke.ps1`
