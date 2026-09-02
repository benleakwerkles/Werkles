# WERKLES VPGM — PLAID + CRUCIBLE FUNCTION FOUNDATION

Date: 2026-08-13
Foreman: Heimerdinker@Betsy
Branch / baseline: `maker/site-g-20260703` / `93b79d1`
Status: LOCAL FOUNDATION PASS; ACTUAL CBCC SEALS PENDING; NO PUSH

## V

Fresh vision packet:
`foreman/handoffs/outbox/HEIMERDINKER_V_PLAID_CRUCIBLE_FUNCTION_FOUNDATION_20260813.md`

Two bounded ideas were selected while named-seat returns remain pending:

1. show the authenticated member's stored Identity/Funds state instead of
   static Crucible cards;
2. define the provider-neutral claim/evidence/receipt contract that later
   Stripe, Plaid, Twilio, Checkr, credential, and Werkles-native evidence must
   satisfy.

## P

Pulled the current Crucible routes, provider adapters, profile-state fields,
client panel, copy, provider-safety patch, prior receipt, cockpit state, and
the four expected external CBCC returns.

Still waiting on actual returns from:

- Lady Jessica — product/copy review;
- Ender/Doozer — implementation/hands review;
- Bean — hostile trust attack;
- Thufir/Locke — legal/policy boundary review.

Independent implementation and audit workers did not impersonate those seats.

## G — idea 1: honest owner state

Delegated implementation added:

- authenticated, owner-scoped `GET /api/verification/status`;
- a query constrained to the authenticated user's profile ID;
- `Cache-Control: private, no-store` on success and error responses;
- member Identity/Funds cards driven by returned owner state;
- narrow Identity wording that says only `Stored status`;
- quarantine of every historical non-empty funds flag as
  `Legacy funds flag - no proof receipt on file`.

The quarantine is required because old `funds_status` values could be created
by Link/public-token handshakes without Balance or Assets evidence. No legacy
funds flag is displayed as verified or pending.

Files:

- `app/api/verification/status/route.ts`
- `lib/crucible-owner-status.ts`
- `components/crucible/crucible-panel.tsx`
- `lib/crucible.ts`
- `scripts/foreman/test-crucible-owner-status.mjs`

## G — idea 2: claim/evidence contract

Delegated implementation added a provider-neutral contract for:

- narrow claim types and explicit purposes;
- affirmative consent or a documented not-required basis;
- opaque evidence provenance without raw provider payloads;
- observation and expiry times;
- pending, satisfied, not-satisfied, and inconclusive evaluations;
- revocation and dispute precedence;
- ordered, subject-bound and purpose-bound receipt events;
- executable chronology and binding invariants.

It deliberately contains no global `person_verified` or `safe` claim.

Files:

- `lib/verification/claim-evidence-contract.ts`
- `scripts/foreman/verification-claim-evidence-contract-smoke.mjs`

## Independent attack and repair

The attack worker found that the first safety cut could still exchange a Plaid
public token, discard custody, create an orphaned Item, accept a token without
an owner-bound attempt, and default a missing `PLAID_ENV` to sandbox. The
combined tree was repaired before this receipt:

- `PLAID_ENV` must now be explicitly `sandbox` for this path;
- production/development Plaid API branches were removed from the test client;
- public-token exchange is disabled before body read or provider/database
  action until encrypted owner-bound custody, revoke and idempotency exist;
- the client never transmits the public token to Werkles;
- Link-token creation no longer writes a pending funds status;
- Link success says only that no Werkles exchange or funds proof occurred.

This supersedes the prior receipt's intermediate statement that exchange stays
pending: exchange is now disabled entirely.

## Proof

- Crucible provider safety contract: PASS.
- Crucible owner verification status contract: PASS.
- Verification claim/evidence/receipt contract: PASS.
- TypeScript: PASS.
- Production build: PASS, 84/84 static pages generated.
- Unauthenticated owner-status request: `401` with `private, no-store`.
- No provider call, secret read, SQL, staging, commit, push, or deploy.

These are focused contracts and build proofs, not an end-to-end security seal.
Cross-owner runtime testing and the named CBCC reviews remain required.

## M close

The Crucible now has an honest local member-state readout and a durable domain
contract to build against. The next implementation tranche is owner-bound,
encrypted Plaid Item custody plus consent/attempt/receipt persistence, revoke,
expiry, and RLS. That tranche requires a schema/RLS review and Ben's explicit
gate before SQL or live-provider work.

COMPLETED — local VPGM foundation. BLOCKER — live Plaid remains behind schema,
custody, provider, CBCC, three-key push, and production gates.
