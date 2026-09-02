# WERKLES VPGM — CRUCIBLE CLAIM TRUTH + MEMBER READOUT

Date: 2026-08-13
Foreman: Heimerdinker@Betsy
Branch / baseline: `maker/site-g-20260703` / `93b79d1`
Status: LOCAL FUNCTION SLICE PASS; ACTUAL CBCC RETURNS PENDING; NO PUSH

## V

Fresh packet:
`foreman/handoffs/outbox/HEIMERDINKER_V_CRUCIBLE_CLAIM_TRUTH_AND_MEMBER_READOUT_20260813.md`

Selected G ideas:

1. build a provider-neutral decision engine bound to subject, purpose, claim
   type, and scope;
2. show members the narrow boundary of every Crucible check without presenting
   capability copy as an actual result.

## P

Pulled the current cockpit, prior Plaid/Crucible receipts, verification
contract, provider routes, Crucible UI, pricing keys, trust/UX doctrine, Plaid
schema draft and types, and the expected named-seat inbox paths.

Actual Lady Jessica, Ender/Doozer, Bean, and Thufir/Locke replies are still
waiting. Unnamed local workers were used for bounded implementation and attack;
they did not impersonate CBCC seats.

## G — claim decision engine

Added a pure decision engine that:

- validates requirements at runtime;
- binds exact subject, purpose, claim type, and scope;
- deterministically chooses the newest matching observation;
- reports only satisfied, missing, expired, disputed, revoked, or inconclusive;
- fails closed on invalid matching claims;
- never emits a global verified, trustworthy, or safe state.

The independent attack found lifecycle-laundering defects in the underlying
contract. Repairs now require:

- runtime enum validation after TypeScript types disappear;
- immutable receipt binding to subject, purpose, type, and scope;
- exact receipt/claim lifecycle reconciliation;
- explicit dispute disposition;
- only `claim_restored` may restore the base evaluation;
- `claim_not_restored` remains inconclusive;
- no dispute event after revocation.

Files:

- `lib/verification/claim-decision-engine.ts`
- `lib/verification/claim-evidence-contract.ts`
- `scripts/foreman/verification-claim-decision-engine-smoke.mjs`
- `scripts/foreman/verification-claim-evidence-contract-smoke.mjs`

## G — member-readable proof boundaries

Every current Crucible check now includes concise, accessible definitions of:

- what a completed check can establish;
- what it cannot establish.

All twelve price/check keys are covered. Funds language requires a dated
provider receipt and does not imply net worth, creditworthiness, source of
funds, or future capacity. Identity, phone, license, reference, employment, and
background checks likewise avoid honesty, competence, safety, or legal-clearance
overclaims.

The attack also caught browser-cookie intake being labeled as authenticated
member ownership. The page now says `This browser's intake` and explicitly says
it is not account-bound yet. Capability headings are conditional, not past-tense
results.

Files:

- `lib/crucible-proof-boundaries.ts`
- `components/crucible/verification-card.tsx`
- `app/dashboard/crucible/page.tsx`
- `scripts/foreman/test-crucible-proof-boundaries.mjs`

## M — state-aware action truth

Crucible actions now distinguish first checks, provider work already in
progress, re-checks, expired/failed checks, legacy flags, unavailable checks,
manual review, preview-disabled actions, and runtime-unknown states. Unknown
states fail closed. Funds says `Open Plaid sandbox demo` because exchange and
proof creation remain disabled. All cards lock while any provider start is in
flight.

Files:

- `lib/crucible-card-action.ts`
- `components/crucible/crucible-panel.tsx`
- `components/crucible/verification-card.tsx`
- `scripts/foreman/test-crucible-card-action.mjs`

## M — schema preparation

Read-only gap packet:
`foreman/handoffs/outbox/CODEX_PLAID_SCHEMA_CLAIM_CONTRACT_GAP_REVIEW_20260813.md`

Verdict: do not apply the current Plaid SQL draft. It exposes encrypted token
custody fields to owner selects, lacks provider-neutral claim/lifecycle binding,
conflates disclosure logs with authorization, and permits receipt/session
attachment drift. The packet proposes a server-only custody split, generic
claim/event tables, explicit share grants, append-only access audit, and the
required RLS/adversarial proofs. The SQL and Plaid types were not edited.

## Proof

- Crucible provider safety contract: PASS.
- Crucible owner status contract: PASS.
- Crucible proof-boundary contract: PASS.
- Crucible card-action contract: PASS.
- Verification claim/evidence/receipt contract: PASS.
- Verification claim decision engine: PASS.
- TypeScript: PASS.
- Production build: PASS, 84/84 static pages generated.
- No provider call, secret access, payment, SQL/schema/RLS mutation, staging,
  commit, push, or deploy.

These are focused local contracts and build proof, not an actual named-CBCC or
end-to-end security seal.

COMPLETED — local VPGM function slice and momentum beat.
BLOCKER — persistence/live Plaid still requires redesigned schema/RLS, named
CBCC returns, provider scope, three-key push custody, and explicit human gates.

## Plaid Link client name follow-up

The Link-token request already sent `client_name: "Werkles"`. It is now sourced
from `lib/plaid/link-config.ts`, with an offline contract asserting the exact
recognized name and Plaid's 1–30 character limit. Provider safety contract and
TypeScript PASS. No Plaid request was made.
