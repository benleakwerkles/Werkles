# WERKLES VPGM — PLAID + CRUCIBLE FUNCTION TRUTH

Date: 2026-08-13
Foreman: Heimerdinker@Betsy
Branch / baseline: `maker/site-g-20260703` / `93b79d1`
Status: LOCAL SAFETY SLICE PASS; CBCC PRODUCT SEALS PENDING; NO PUSH

## V

Vision packet:
`foreman/handoffs/outbox/HEIMERDINKER_V_PLAID_CRUCIBLE_FUNCTION_STACK_20260813.md`

Goal: move from a provider-logo list to a functional Crucible claim/evidence
system and determine the real distance to live Plaid Balance + Assets.

## P

Pulled current Plaid routes, provider adapters, Crucible UI, copy, provider
smokes, partnership spec, schema draft, human gates, Vercel environment names,
production/local CSP, and the latest cockpit state.

Production environment names currently include `PLAID_CLIENT_ID`,
`PLAID_SECRET`, and `PLAID_ENV`. Values were not read. That is credential
presence, not proof of a safe live product. Local `.env*.local` files do not
currently expose those names to this session.

## Crew work

Three independent workers were assigned rather than having Foreman perform all
analysis/code:

1. Plaid code-path audit and bounded implementation worker.
2. Crucible end-to-end code/product auditor.
3. Independent provider/legal/security red-team researcher using primary
   provider and government guidance.

Focused external CBCC packets were also issued to Lady Jessica, Ender/Doozer,
Bean, and Thufir/Locke. Their actual inbox responses remain pending; these
workers were not impersonated.

## Joint audit verdict

Lady Jessica's list is a useful provider shortlist, not a complete verification
stack. The product center should be:

`claim -> consent/purpose -> evidence -> provider event -> time-bounded receipt -> selective disclosure -> expiry/revoke/dispute`

Provider meanings must remain narrow:

| Capability | Current provider idea | Honest meaning | Current code truth |
|---|---|---|---|
| Person identity | Stripe Identity | A specific identity/document/selfie check at a time | Test session + webhook/profile status; no durable provider receipt ledger |
| Contact channel | Twilio Verify | Control of a phone/contact channel at a time | No adapter, route, callback, or consent state |
| Bank ownership | Plaid Identity / Identity Match | Connected account details match claimed person/business | Not implemented |
| Current funds | Plaid Balance | Point-in-time account balance evidence for a defined decision | Not implemented |
| Financial history | Plaid Assets | Consented report for an underwriting/capacity use case | Not implemented |
| Background | Checkr | Purpose/location-specific consumer report | No adapter; separate FCRA lane remains blocked |
| Licenses/credentials | State boards/vendors | Credential status and expiry in stated jurisdiction | No executable workflow |
| Business authority/KYB | TBD | Entity existence, beneficial owner, authority | Missing lane |
| Insurance/bond | TBD | Policy/bond status and expiry | Missing lane |
| References/attestations | Werkles + provider TBD | Provenance-rich human evidence, not a trust guarantee | Mostly copy/tasks; no attestation ledger/dispute flow |
| Platform reputation | Werkles | Network/work receipts with anti-collusion controls | Not yet a verification primitive |

## Critical defects found

1. Plaid Link CDN and API were blocked by production and local CSP.
2. Test-mode code did not reject production Plaid or live Stripe credentials.
3. Plaid public-token exchange immediately set `funds_status` to
   `sandbox_verified` without calling Balance or Assets.
4. The access token was discarded; no Item custody or receipt existed.
5. Failed providers silently produced fabricated sandbox tokens/sessions.
6. UI said a receipt/result was kept when only profile booleans were updated.

## G — implemented bounded safety/truth slice

Implementation was delegated to the Plaid code worker and integrated by
Heimerdinker:

- allow Plaid Link CDN/frame and sandbox API in CSP, but no production Plaid
  origin;
- reject non-test Stripe keys in the test Identity path;
- reject Plaid development/production in test Link and exchange paths;
- apply the provider-test guard to token exchange too;
- remove fabricated fallback asset tokens and identity sessions;
- keep successful token exchange at `sandbox_pending` / bank connected;
- stop returning `item_id` to the browser and stop claiming funds proof;
- make member copy say no Balance/Assets evidence or receipt exists yet;
- add an offline provider-boundary contract.

Changed slice:

- `next.config.ts`
- `vercel.json`
- `lib/crucible-provider-safety.ts`
- `lib/crucible-providers.ts`
- `app/api/verification/identity/route.ts`
- `app/api/verification/funds/route.ts`
- `app/api/verification/funds/exchange/route.ts`
- `components/crucible/crucible-panel.tsx`
- Crucible-only hunks in `lib/copy.ts`
- `scripts/foreman/test-crucible-provider-safety.mjs`

## Proof

- Provider safety contract: PASS.
- TypeScript: PASS.
- Production build: PASS, 83/83 static pages generated.
- Scoped diff check: PASS; only Windows line-ending warnings.
- No provider call was made by this VPGM.
- No secret value was read or printed.

## Distance to live Plaid

The browser handshake scaffold exists, but a live evidence product does not.
Still required:

1. choose exact claim(s) with Sophia: bank ownership, Balance threshold, Assets
   report, or a combination; keep each a separate receipt type;
2. schema and RLS for encrypted Item custody, consent, receipts, expiry,
   disclosures, revocation, and disputes;
3. encrypted access-token custody and rotation procedure;
4. Balance call and/or Assets async create/webhook/get/remove flow;
5. webhook JWT verification and idempotency;
6. update mode, reconnect, revoke/delete, refresh, and stale-state handling;
7. cross-owner, replay, raw-data minimization, and browser E2E tests;
8. Lady Jessica + Ender/Doozer product/hands seal, Bean attack, and
   Thufir/Locke boundary seal;
9. separate Ben approval for schema, provider/live credentials, push, and
   production activation under current three-key custody.

## M

1. Created the provider-neutral capability/gate map above.
2. Completed the bounded local truth/safety implementation and integration
   proof, then issued the patch for actual CBCC seal/hands review.

No staging, commit, push, deploy, SQL, production mutation, provider activation,
Checkr order, Twilio send, or live identity/bank session occurred.

