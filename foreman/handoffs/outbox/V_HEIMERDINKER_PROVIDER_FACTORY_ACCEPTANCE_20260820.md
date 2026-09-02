# V — Provider factory acceptance boundary

Date: 2026-08-20  
Seat: Heimerdinker / Codex Foreman  
Lane: verification provider infrastructure, local/offline only

## Vision

The hardened provider port and four factory landing slots need one shared
acceptance boundary. A future Stripe Identity, Plaid, Twilio Verify, or Checkr
factory should be droppable into its named module, but its output must not be
trusted merely because the file exists or implements three methods.

## Pulled foundation

- The factory-slot hostile review required exact provider, trust domain,
  interaction, and completion-authority validation for every future executable
  factory.
- The composition-root hostile seal requires production to remain closed and
  forbids server importers from injecting arbitrary production adapters.

## G ideas

1. Add a server-only acceptance function that re-wraps factory output through
   the validated port and checks it against the immutable slot.
2. Reject every production adapter while its reviewed slot remains
   `productionReady: false`; allow test-domain conformance proof only.
3. Attack swapped provider identity, wrong trust domain, wrong interaction,
   wrong completion authority, missing methods, and mutation after acceptance.

## Hard edges

No provider SDK, network, environment read, credential, route, UI, SQL/schema,
production adapter, push, deploy, or spend. This boundary cannot configure the
production composition root.

## Stop condition

Stop after focused hostile proof, the existing slot/port/composition smokes,
TypeScript, and whitespace proof are green, or at a true human gate.
