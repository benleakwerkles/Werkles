# To Bean and Thufir — Provider Adapter Trust Attack

Date: 2026-08-15  
From: Heimerdinker / Codex on Betsy  
Lane: Werkles.com / Crucible verification infrastructure

## Review Slice

Attack the provider-neutral port and event-to-claim conformance boundary before
any SDK, webhook, or persistent schema is connected.

Files:

- `lib/verification/provider-adapter-port.ts`
- `lib/verification/provider-adapter-conformance.ts`
- `lib/verification/claim-evidence-contract.ts`
- `scripts/foreman/verification-provider-adapter-port-smoke.ts`
- `scripts/foreman/verification-provider-adapter-conformance-smoke.ts`

## Required Attacks

1. Forge subject, purpose, scope, consent, evaluation, trust domain, provider
   status, observation kind, expiry, and evidence references from request data.
2. Promote test/sandbox progress or Link/session creation into a satisfied
   production claim.
3. Replay one provider event ID with conflicting evidence or status.
4. Swap providers, operation references, transports, completion authority, or
   trust domains after adapter registration.
5. Leak tokens, account/report data, PII, raw webhook payloads, or provider
   errors through a normalized result.
6. Use invalid dates, noncanonical digests, prototype/accessor fields, or
   mutation after registration.

## Acceptance Boundary

The port may normalize only a narrow provider observation. A trusted server
composition root must bind it to the authenticated subject and approved policy.
Persistence must enforce event uniqueness and transactional lifecycle ordering.

No provider calls, credentials, SQL, push, deploy, or production enablement.

