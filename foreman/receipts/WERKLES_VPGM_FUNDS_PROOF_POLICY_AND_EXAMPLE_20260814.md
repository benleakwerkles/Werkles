# Werkles VPGM receipt — funds-proof policy and fictional example

Date: 2026-08-14

Machine: Betsy

Execution context: `CODEX_LOCAL`

Repository: `C:\Users\Ben Leak\github\Werkles`

Branch / starting commit: `maker/site-g-20260703` / `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`

## V — fresh packet

Created:

- `foreman/handoffs/outbox/HEIMERDINKER_V_FUNDS_PROOF_POLICY_AND_EXAMPLE_20260814.md`

The packet kept the cycle inside the Plaid/Crucible verification lane and assigned two bounded ideas: a fail-closed funds-proof policy and a clearly fictional example receipt.

## P — pulled state

Pulled the current canonical Flock and packet state before execution and again after Momentum. The requested named-seat returns remain absent:

- Lady Jessica Plaid/Crucible product review — waiting
- Ender/Doozer Plaid/Crucible hands review — waiting
- Bean hostile-trust review — waiting
- Thufir/Locke legal-policy review — waiting

Unnamed local workers did not impersonate those seats.

## G — two strongest ideas executed

### 1. Funds-proof policy

Added a pure provider-neutral policy evaluator requiring both:

- an exact `bank_account_ownership_matched` claim; and
- an exact `funds_threshold_observed` claim.

Both must bind to the same subject and purpose and to separately reviewed scopes. The aggregate is satisfied only when both component decisions are satisfied; every missing, stale, pending, not-satisfied, disputed, revoked, inconclusive, invalid, cross-subject, cross-purpose, or cross-scope case fails closed.

Attack review repaired three decision-engine laundering paths:

1. observations after the evaluation instant now fail closed;
2. equal-time newest claims are ambiguous instead of being selected by caller-influenced claim ID;
3. a future dispute resolution cannot restore a claim before its `resolvedAt` instant.

Files include:

- `lib/verification/funds-proof-policy.ts`
- `lib/verification/claim-decision-engine.ts`
- `lib/verification/claim-evidence-contract.ts`
- their focused smoke contracts under `scripts/foreman/`

### 2. Fictional funds-proof receipt

The active Funds card now includes a semantic fictional example with an always-visible warning that it is not the member, not live, made no provider call, and is not currently produced by Werkles. Its six example fields are inside a native collapsed disclosure to avoid overloading the card.

Files include:

- `lib/crucible-example-funds-receipt.ts`
- `components/crucible/verification-card.tsx`
- `scripts/foreman/test-crucible-example-funds-receipt.mjs`

## M — Momentum

Prepared a design-only decision packet for the remaining architecture gap:

- `foreman/handoffs/outbox/CODEX_FUNDS_EVIDENCE_BUNDLE_ARCHITECTURE_DECISION_20260814.md`

Recommendation: preserve the two narrow claims and bind them into one immutable, provider-neutral review bundle. The bundle is only an assembly/audit boundary (`open`, `sealed`, or `revoked`), never a generic favorable badge. The packet covers alternatives, evaluator invariants, observation skew, lifecycle separation, proposed persistence/RLS boundaries, exact-bundle share grants, and twenty adversarial cases. No schema was applied.

Independent attack accepted the direction but identified nine pre-schema blockers, now recorded in the packet: newest-bundle fallback, equal-time ordering, mutable-claim replay, seal/event serialization, one canonical lifecycle, immutable approved-policy binding, sandbox/production trust-domain separation, command idempotency, and exact share-grant lifecycle/roles.

## Proofs

PASS:

- Crucible provider safety contract
- Plaid Link-token request contract
- Plaid Link single-flight contract
- Crucible account-selection truth contract
- Crucible card-action contract
- Crucible proof-boundary contract
- Crucible fictional funds-receipt contract
- Verification claim/evidence/receipt contract
- Verification claim decision-engine contract
- Verification funds-proof policy contract
- `npm.cmd run typecheck`
- `npm.cmd run build` — Next.js production build, 84/84 static pages generated

## Custody and hard-stop proof

No provider calls, credentials, environment changes, SQL, schema/RLS application, staging, commit, push, deploy, or production change occurred. The pre-existing dirty shared tree was preserved. Lady Jessica retains sole push/deploy custody under the three-key rule.

## Result

**COMPLETED locally.**

Specific blocker before a receipt-backed live funds proof: the shared immutable evidence-bundle contract must close the nine recorded attack findings, then receive actual named-seat review and a separately authorized persistence/RLS decision. Plaid public-token exchange remains disabled; Link completion remains a sandbox demonstration, not proof.
