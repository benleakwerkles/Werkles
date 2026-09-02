# Werkles VPGM Receipt — Provider Drop-In Foundation

Date: 2026-08-15  
Foreman: Heimerdinker / Codex on Betsy  
Execution context: `CODEX_LOCAL`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`

## V

Authored before execution:

- `foreman/handoffs/outbox/HEIMERDINKER_V_PROVIDER_DROP_IN_FOUNDATION_20260815.md`

The packet bounded work to local adapter, readiness, conformance, and review
infrastructure. It explicitly excluded provider calls, secrets, SQL/RLS apply,
SDK installation, push, deploy, and production enablement.

## P

Pulled current Crucible/provider routes, provider-readiness packets, claim and
evidence contracts, Plaid schema-gap review, cockpit state, human gates, lanes,
budget, next action, and CBCC protocol.

## G

### G1 — Provider-neutral adapter port

Added a closed provider adapter port and immutable registry for Stripe Identity,
Plaid, Twilio Verify, and Checkr. The boundary exact-key validates begin,
completion, and revoke I/O; binds provider, operation, trust domain, transport,
and completion authority; sanitizes outputs; and excludes raw tokens, reports,
accounts, PII, and webhook payloads.

### G2 — Fail-closed provider readiness

Added an exhaustive Crucible readiness manifest and integrated it into existing
cards without conflating adapter availability, owner check state, and current
action eligibility. All entries remain explicitly non-production-live.

## M

### M1 — Event-to-claim conformance and replay integrity

Added a registry-owned provider-status mapping into narrow claim types. Trusted
bindings and verified observations use object-identity boundaries; callers do
not choose evaluation, method, TTL, claim type, or environment. Test successes
downgrade to inconclusive. The replay reducer treats same-key/same-digest as
idempotent and same-key/different-digest as a fail-closed conflict. Atomic
database uniqueness remains a persistence requirement.

### M2 — Tech-stack landing map and CBCC review packets

Added an eight-slot architecture catalog for Supabase Auth/member data/Storage,
Stripe Billing/Identity, Plaid, Twilio Verify, and Checkr. Added separate UX,
trust, and push-custody review packets without impersonating external seats.

## Files

Core:

- `lib/verification/provider-adapter-port.ts`
- `lib/verification/provider-adapter-conformance.ts`
- `lib/crucible-provider-readiness.ts`
- `lib/integrations/tech-stack-slot-catalog.ts`
- `lib/crucible.ts`
- `components/crucible/verification-card.tsx`

Proofs:

- `scripts/foreman/verification-provider-adapter-port-smoke.ts`
- `scripts/foreman/verification-provider-adapter-conformance-smoke.ts`
- `scripts/foreman/crucible-provider-readiness-smoke.ts`
- `scripts/foreman/crucible-provider-readiness-integration-smoke.mjs`
- `scripts/foreman/tech-stack-slot-catalog-smoke.ts`

Review packets:

- `foreman/handoffs/outbox/TO_ENDER_LADY_JESSICA_PROVIDER_DROP_IN_READINESS_UX_REVIEW_20260815.md`
- `foreman/handoffs/outbox/TO_BEAN_THUFIR_PROVIDER_ADAPTER_TRUST_ATTACK_20260815.md`
- `foreman/handoffs/outbox/TO_LADY_JESSICA_PROVIDER_DROP_IN_FOUNDATION_PUSH_CUSTODY_20260815.md`

## Proof

- provider adapter conformance: PASS
- provider adapter port: PASS
- Crucible provider readiness manifest: PASS
- Crucible readiness integration: PASS
- tech-stack slot catalog: PASS
- claim/evidence/receipt contract: PASS
- claim decision engine: PASS
- TypeScript `tsc --noEmit`: PASS

## Preserved Stops

- no provider or external network call;
- no SDK/package installation;
- no secrets or environment mutation;
- no SQL/schema/RLS apply;
- no staging, commit, push, deploy, or production enablement;
- no claim that Twilio, Checkr, Plaid proof custody, Supabase member custody, or
  production provider accounts are ready.

Next gates are durable member/claim schema and RLS, server-only authenticated
composition roots, private provider credentials/accounts, and provider-specific
legal or human flows. Lady Jessica retains push custody under the current
three-signoff rule.

