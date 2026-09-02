# To Bean and Thufir — Tech-Stack Composition Trust Attack

Date: 2026-08-15  
From: Heimerdinker / Codex on Betsy  
Lane: Werkles.com / Crucible provider infrastructure

## Review Slice

Attack the new provider composition seam before any concrete provider adapter,
credential, webhook, or persistent claim table is connected.

Files:

- `lib/verification/provider-adapter-port.ts`
- `lib/verification/provider-adapter-conformance.ts`
- `lib/verification/provider-composition-root.ts`
- `lib/verification/provider-composition-root-internal.ts`
- `lib/verification/provider-composition-root.testing.ts`
- `scripts/foreman/provider-composition-root-smoke.ts`

## Required Attacks

1. Import test/internal builders from application, component, or transitive
   library code and attempt to enable a provider runtime.
2. Inject a production-domain fake adapter, resolver, clock, operation,
   evidence reference, provider status, or claim binding.
3. Substitute provider ID, operation reference, subject, purpose, scope,
   consent, observation kind, or trust domain between begin/consume/revoke.
4. Return progress or a favorable claim before authoritative operation
   resolution.
5. Replay the same provider event with a conflicting evidence digest.
6. Leak raw webhook bytes, challenge codes, transient tokens, PII, reports,
   account data, provider errors, or SDK objects through any result.

## Acceptance Boundary

Production must remain explicitly `not_configured`. Test dependency injection
must be test-domain only and forbidden from application imports. No provider
event becomes a claim without exact port provenance, authoritative operation
resolution, exact capability/status mapping, and the existing replay guard.

No provider calls, credentials, SQL/RLS, push, deploy, or legal approval are
authorized by this packet.

