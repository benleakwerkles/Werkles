# Heimerdinker V — funds evidence-bundle contract

Date: 2026-08-14

Owner: Heimerdinker / Dink, Werkles.com Foreman

Execution context: `CODEX_LOCAL` on Betsy

Lane: Werkles.com / Crucible verification foundation

Status: local implementation and review packet; no production authority

## Vision

Turn the previous funds-bundle architecture attack into executable, provider-neutral truth contracts before anyone designs persistence. Werkles should be able to prove that bank ownership and a dated funds threshold belong to the same deliberately reviewed evidence assembly without inventing a broad “verified” badge or allowing an older favorable bundle to hide a newer failed one.

## Pulled state

- Previous local policy requires separate ownership and threshold claims.
- Nine pre-schema findings remain: newest-lineage fallback, equal-time ordering, mutable claim replay, seal/event races, lifecycle canon, approved-policy binding, trust-domain separation, command replay, and grant lifecycle/roles.
- Plaid exchange remains disabled and Link remains a sandbox demonstration.
- Named Lady Jessica, Ender/Doozer, Bean, and Thufir/Locke returns are still waiting.

## G idea 1 — immutable evidence-bundle lifecycle contract

Build a pure TypeScript contract with offline smoke proof that:

- uses one append-only event stream as lifecycle canon;
- binds subject, purpose, approved policy version/digest, reviewed scopes, trust domain, and exactly one ownership plus one threshold claim;
- binds immutable claim content digests, not mutable row identity alone;
- requires server-owned monotonic assembly ordering and fails closed on ambiguity;
- uses unique command/idempotency IDs and expected versions;
- makes membership immutable after seal;
- represents bundle state only as open, sealed, or revoked—never verified/safe;
- reconstructs state at a supplied evaluation instant.

## G idea 2 — bundle-aware funds decision and disclosure contract

Build a pure evaluator and minimal member-facing readout model that:

- selects the newest assembly across every state within one exact lineage, then evaluates that assembly;
- never skips a newer open, failed, disputed, or revoked assembly to reuse an older favorable result;
- fails closed on equal newest ordering, digest mismatch, wrong trust domain, unapproved policy binding, bad membership, observation skew, stale/disputed/revoked component claims, or inactive/expired/revoked share grants;
- requires exact-bundle grants for counterparty disclosure;
- preserves both component decisions and limitations;
- emits no global trust badge or provider/account/balance details.

## Momentum

After the two G ideas:

1. independently attack lineage selection, replay/idempotency, time-travel evaluation, digest binding, lifecycle races, trust-domain separation, IDOR/grants, and copy truth;
2. make up to two bounded repairs or usability refinements inside the same pure/local lane;
3. re-pull named CBCC packet state and write a receipt.

## Acceptance proof

- focused offline contract tests;
- TypeScript pass;
- existing Crucible/Plaid truth contracts remain green;
- production build passes;
- scoped diff checks pass;
- receipt identifies every hard stop preserved.

## Hard edges

No provider calls, secrets, environment changes, SQL, migrations, schema/RLS/policy application, production data, paid calls, staging, commit, push, deploy, or public launch. Do not impersonate named CBCC seats. Do not create an active human-gate artifact. Preserve the dirty shared tree.
