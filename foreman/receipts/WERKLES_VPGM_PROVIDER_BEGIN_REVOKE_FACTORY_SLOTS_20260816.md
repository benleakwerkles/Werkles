# Werkles VPGM receipt — provider begin/revoke + factory slots

Date: 2026-08-16
Execution: `CODEX_LOCAL` on Betsy
Canonical repo: `C:\Users\Ben Leak\github\Werkles`
Branch: `maker/site-g-20260703`
Baseline commit: `93b79d128f33b27ca5c7d3f9b65d76ad74260c81`

## Vision

Extend the sealed provider-consume boundary toward drop-in integrations without activating a provider: add authoritative begin/revoke orchestration, reserve concrete factory landing slots, and fail closed everywhere production authority or persistence is absent.

Vision packet: `foreman/handoffs/outbox/HEIMERDINKER_V_PROVIDER_BEGIN_REVOKE_AND_FACTORY_SLOTS_20260815.md`

## Pull

Pulled the prior composition/diagnostics receipt and current composition root, testing seam, adapter port, conformance boundary, readiness manifest, and operator diagnostic. Production started and remains `configured: false` with no injectable production dependencies.

## G1 — begin orchestration

- Caller supplies only internal operation ID and authorization ID.
- Trusted server resolvers supply authenticated actor, owner-bound operation, authorization, provider, trust domain, capability, subject reference, return URL, and verified delivery-target reference.
- Exact actor/owner/provider/trust/capability/action agreement is required before adapter invocation.
- Return URLs are restricted to internal origins; provider redirect results are restricted to reviewed provider origins.
- Contact challenges resolve an owner-bound verified target and outward display must be genuinely masked.
- Atomic action lease is acquired before provider side effects.
- Success and sanitized failure are finalized against the lease.
- An unrecordable post-side-effect result returns `action_outcome_unrecorded`, never a generic retry signal.
- Repeat and concurrent starts fail closed.

## G2 — revoke orchestration

- Uses the same authenticated actor, owner, authorization, provider, trust, capability, and lease boundaries.
- Provider operation references do not leave the composition result.
- A provider revoke acknowledgement explicitly leaves claim and evidence state unchanged and does not assert provider-data deletion.
- Repeated/concurrent revoke requests fail closed through the action lease.

## M1 — concrete factory slots

Added immutable, server-only, production-closed landing contracts for:

- Stripe Identity — hosted redirect / signed webhook;
- Plaid — embedded Link / signed webhook;
- Twilio Verify — challenge code / server check;
- Checkr — hosted invitation / signed webhook.

Each slot names dependency identifiers, operation/evidence persistence requirements, provider/local/late-event revoke semantics, and an explicit `productionReady: false` gate. No SDK, credentials, environment reads, provider calls, or fake production adapter were added.

Provider distinctions retained:

- Stripe cancellation is not redaction.
- Plaid Item removal does not remove existing Asset Reports or Audit Copies.
- Twilio send remains pending; only an approved Verification Check proves channel possession.
- Checkr cancellation/deletion is not adverse-action completion.

## M2 — CBCC review and handoffs

Unnamed implementation cousins split lifecycle, factory-slot, and hostile-review work. The final hostile pass found and drove repairs for actor binding, repeat/concurrent side effects, redirect/delivery injection, missing lease finalization, provider-reference leakage, masking, and progress ownership. Final hostile seal: PASS, no residual P0/P1.

External-seat review packets were prepared without impersonation:

- `foreman/handoffs/outbox/TO_BEAN_THUFIR_PROVIDER_LIFECYCLE_TRUST_REVIEW_20260816.md`
- `foreman/handoffs/outbox/TO_ENDER_LADY_JESSICA_PROVIDER_LIFECYCLE_LANGUAGE_REVIEW_20260816.md`
- `foreman/handoffs/outbox/TO_LADY_JESSICA_PROVIDER_LIFECYCLE_PUSH_CUSTODY_20260816.md`

These are requests, not claims that those external seats reviewed the work.

## Files

- `lib/verification/provider-composition-root-internal.ts`
- `lib/verification/provider-composition-root.ts`
- `lib/verification/provider-composition-root.testing.ts`
- `lib/verification/provider-adapter-factory-slots.ts`
- `scripts/foreman/provider-composition-root-smoke.ts`
- `scripts/foreman/provider-adapter-factory-slots-smoke.ts`
- the vision/review packets listed above

## Proof

PASS:

- provider adapter factory-slot smoke;
- provider adapter port smoke;
- provider adapter conformance/replay smoke;
- provider composition hostile smoke;
- operator tech-stack diagnostic smoke;
- full TypeScript `tsc --noEmit`;
- scoped `git diff --check`;
- independent final hostile seal.

## Hard stops preserved

- Production provider runtime remains OFF and non-injectable.
- No Stripe, Plaid, Twilio, or Checkr call was made.
- No credentials, secrets, environment values, SQL, RLS, or provider dashboards were inspected or changed.
- No route or member UI was wired to this runtime.
- No stage, commit, push, or deploy occurred.
- Durable operation/evidence/authorization/lease persistence and reviewed concrete adapter factories remain gates before activation.
- LJ retains sole push custody; Ben, Codex foreman, and LJ must all sign off before any push phrase.

## Next pull

The next safe slice is the persistence-neutral reconciliation contract for `action_outcome_unrecorded` plus reviewed concrete adapter factory shells that still accept injected SDK interfaces only in test. Production activation, credentials, SQL/RLS, provider accounts, and member-facing routes remain separate human gates.

COMPLETED.
