# Werkles Twilio Verify test adapter — VPGM receipt

Date: 2026-08-20  
Execution context: CODEX_LOCAL on Betsy  
Vision packet: `foreman/handoffs/outbox/V_HEIMERDINKER_TWILIO_VERIFY_TEST_ADAPTER_20260820.md`

## Outcome

The reviewed `twilio_verify` factory slot now has its named server-only adapter module and export. It is dependency-injected and fully attackable offline. It performs no environment reads, SDK import, network call, credential handling, SMS send, or production composition.

The adapter contract now proves:

- SMS begin requires an authoritative E.164 destination;
- the provider Verification SID crosses only as the trusted provider-operation custody reference;
- visible destination copy is masked and expiry is ten minutes from the provider-created instant;
- send/pending is not proof;
- an incorrect/pending check remains `requires_input`;
- expired, failed, canceled, deleted, and max-attempt results fail closed;
- only exact `approved` status emits a narrow `contact_channel_possession_check` observation;
- the emitted event contains no phone number or code and has a deterministic SHA-256 digest;
- revoke resolves the provider SID from trusted storage rather than accepting it from the caller;
- malformed SID, noncanonical time, provider-result shape, and production use reject;
- captured dependency methods resist post-factory mutation.

Production remains blocked by the existing gate: provider setup/credentials, member consent copy, rate-abuse and spend controls, and durable attempt/evidence persistence.

## Exact files

- `lib/verification/adapters/twilio-verify-adapter.ts`
- `scripts/foreman/twilio-verify-adapter-smoke.ts`
- `scripts/foreman/provider-composition-root-smoke.ts`

## Proof

- `node --conditions=react-server scripts/foreman/twilio-verify-adapter-smoke.ts` — PASS
- `node --conditions=react-server scripts/foreman/provider-adapter-factory-acceptance-smoke.ts` — PASS
- `node scripts/foreman/provider-adapter-factory-slots-smoke.ts` — PASS
- `node scripts/foreman/verification-provider-adapter-port-smoke.ts` — PASS
- `node scripts/foreman/run-provider-composition-root-smoke.mjs` — PASS
- `npm.cmd run typecheck` — PASS
- scoped `git diff --check` — PASS

No provider call, credential/environment inspection, database/schema/RLS change, staging, commit, push, or deployment occurred.
