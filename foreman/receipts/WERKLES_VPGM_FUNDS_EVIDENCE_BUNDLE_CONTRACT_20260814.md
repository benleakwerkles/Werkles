# Werkles VPGM receipt — funds evidence-bundle contract

Date: 2026-08-14

Machine: Betsy

Execution context: `CODEX_LOCAL`

Repository: `C:\Users\Ben Leak\github\Werkles`

Branch / starting commit: `maker/site-g-20260703` / `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`

## V — fresh packet

Created `foreman/handoffs/outbox/HEIMERDINKER_V_FUNDS_EVIDENCE_BUNDLE_CONTRACT_20260814.md` to turn the prior bundle architecture findings into pure executable contracts without applying persistence.

## P — pulled state

Pulled current cockpit/Flock state before execution, after G, and after Momentum. The requested Lady Jessica, Ender/Doozer, Bean, and Thufir/Locke Plaid/Crucible returns remain absent. Unnamed local workers did not impersonate those seats.

## G — two strongest ideas executed

### 1. Immutable evidence-bundle lifecycle

Added one provider-neutral append-only event contract that binds:

- subject and purpose;
- immutable approved-policy digest and reviewed scopes;
- evidence trust domain;
- exactly one ownership and one threshold claim membership;
- immutable claim-content digests;
- monotonic server assembly ordering;
- command idempotency and expected versions.

It reconstructs bundle state at a supplied instant, makes sealed membership immutable, makes revocation terminal, rejects ambiguous newest ordering, and never emits a verified/safe bundle state.

### 2. Bundle-aware decision and narrow readout

Added a pure decision layer that selects the newest exact-lineage assembly across all states and evaluates that assembly instead of searching for the newest favorable result. It fails closed for open/revoked/ambiguous/invalid bundles, wrong policy or trust domain, membership/digest mismatches, post-seal component observations, excessive observation skew, component expiry/dispute/revocation, and invalid disclosure grants.

The member readout preserves component outcomes and reviewed limitations while removing bundle, claim, provider, evidence, account, and balance identifiers. Test evidence is explicitly test-only and cannot be disclosed to a counterparty.

## Independent attack and repairs

The G attack repaired:

1. test-domain counterparty disclosure;
2. arbitrary limitation text leaking provider/account/PII details;
3. claims observed after bundle sealing;
4. incomplete grant identity, time, state, expiry, and revocation validation.

## M — Momentum

### 1. Canonical digests

Added deterministic domain-separated SHA-256 digests for commands and immutable claims. Canonicalization rejects unknown/undefined fields, unsafe numbers, sparse or decorated arrays, accessors, non-NFC or ill-formed Unicode, invalid dates, and ambiguous object shapes. Membership verification recomputes claim content rather than trusting a caller assertion.

### 2. Trusted decision-context boundary

Added a WeakSet-identity-bound server composition contract. The public decision request contains only policy, grant, and bundle references. Authenticated grantee identity, canonical current server time, approved policy, exact grant, event stream, and immutable claim evidence must come from trusted resolvers. Caller-supplied policy lists, grants, identities, times, evidence, inherited/symbol/non-enumerable fields, counterfeit contexts, and resolver failures all deny.

The Momentum attack repaired canonicalization ambiguity, nondeterministic getters, unsafe integers, copyable trust branding, caller-provided evidence, malformed request shapes, invalid server dates, and resolver exception leakage.

## Files

- `lib/verification/funds-evidence-bundle.ts`
- `lib/verification/funds-evidence-bundle-decision.ts`
- `lib/verification/funds-evidence-bundle-readout.ts`
- `lib/verification/verification-digests.ts`
- `lib/verification/trusted-funds-decision-context.ts`
- five corresponding focused smoke contracts under `scripts/foreman/`

## Proofs

PASS:

- fourteen focused Plaid/Crucible/verification contracts;
- `npm.cmd run typecheck`;
- `npm.cmd run build` — Next.js production build, 84/84 static pages generated;
- scoped whitespace checks reported clean by each implementation/attack slice.

## Custody and hard stops

No provider calls, secrets, environment changes, SQL, migrations, schema/RLS/policy application, production data, paid calls, staging, commit, push, deploy, or public launch occurred. The pre-existing dirty shared tree was preserved. Lady Jessica retains sole push/deploy custody under the three-key rule.

## Result

**COMPLETED locally.**

Specific blocker before persistence or live funds disclosure: a real server-only composition root must authenticate the user, resolve authoritative policy/grant/evidence records, recompute digests at ingestion, force trusted current time, and serialize bundle commands with claim dispute/revocation writers in one transaction/version discipline. That requires named review and a separately approved schema/RLS decision. Plaid exchange remains disabled.
