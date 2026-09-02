# Werkles provider factory acceptance — VPGM receipt

Date: 2026-08-20  
Foreman: Heimerdinker / Codex local on Betsy  
Mutation: shared local working tree only  
Provider/network/env/schema/git/deploy/spend activity: none

## V

Executed:

- `foreman/handoffs/outbox/V_HEIMERDINKER_PROVIDER_FACTORY_ACCEPTANCE_20260820.md`

## P

Applied the returned hostile requirements recorded with the provider factory
slots and production composition-root seal: future executable factories must
match provider, trust domain, interaction, and completion authority; mere file
existence must never imply configured or live.

## G

1. Added server-only `acceptProviderAdapterFactoryOutput(...)`.
2. Every candidate is wrapped by the runtime-validating adapter port and then
   checked against the immutable factory slot and port profile.
3. Production output is rejected while the slot remains
   `productionReady: false`; only offline test-domain conformance is accepted.
4. The composition hostile import scan now treats this acceptance module as a
   trusted boundary and forbids app/components/untrusted lib imports of it.

## Attack proof

- all four exact test providers accepted and frozen
- production-domain candidate rejected while gate closed
- Checkr output substituted into Plaid slot rejected
- wrong interaction rejected
- wrong completion authority rejected
- missing method rejected
- mutation of raw adapter identity after acceptance cannot change accepted
  output

## Proof

- provider factory acceptance smoke — PASS
- provider factory slots smoke — PASS
- provider adapter port smoke — PASS
- provider composition root hostile smoke — PASS
- TypeScript — PASS
- scoped whitespace — PASS

## Boundary

No concrete SDK factory exists yet. Production runtime remains immutable,
unconfigured, and fail-closed. Credentials, persistence, provider setup,
policy/legal approval, and production activation remain their named gates.
