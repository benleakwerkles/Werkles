# Werkles provider begin custody handoff — VPGM receipt

Date: 2026-08-20  
Execution context: CODEX_LOCAL on Betsy  
Packet: `foreman/handoffs/outbox/V_HEIMERDINKER_PROVIDER_BEGIN_CUSTODY_HANDOFF_20260820.md`

## Outcome

The provider adapter boundary can now return a narrow provider-created operation reference when a begin call creates a provider-side session, verification, Item, or invitation. The composition root sends that reference only to the trusted lifecycle finalizer. It is not returned in the member-facing begin or revoke result.

This closes the custody handoff needed by later reviewed Stripe Identity, Plaid, Twilio Verify, and Checkr factories without pretending that any production adapter is configured.

## Exact files

- `lib/verification/provider-adapter-port.ts`
- `lib/verification/provider-composition-root-internal.ts`
- `scripts/foreman/verification-provider-adapter-port-smoke.ts`
- `scripts/foreman/provider-composition-root-smoke.ts`

## Fail-closed properties

- provider-created references are optional, nonblank, bounded plain text;
- malformed or extra begin-result data is rejected by the port;
- the frozen trusted lease outcome receives the reference on acknowledged begin;
- rejected begin and revoke outcomes record `null` rather than inventing a reference;
- browser/member results expose neither internal operation refs nor provider operation refs;
- production provider runtime remains unconfigured and off.

## Proof

- `node scripts/foreman/verification-provider-adapter-port-smoke.ts` — PASS
- `node --conditions=react-server scripts/foreman/provider-adapter-factory-acceptance-smoke.ts` — PASS
- `node scripts/foreman/run-provider-composition-root-smoke.mjs` — PASS
- `node scripts/foreman/provider-adapter-factory-slots-smoke.ts` — PASS
- `npm.cmd run typecheck` — PASS
- scoped `git diff --check` — PASS

No provider call, credential inspection, environment change, database/schema/RLS action, staging, commit, push, or deployment occurred.
