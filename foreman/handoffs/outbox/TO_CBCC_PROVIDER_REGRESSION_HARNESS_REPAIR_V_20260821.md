# Vision — Provider Regression Harness Repair

Date: 2026-08-21  
Lane: Tech-stack preparation / local proof  
Executor: Dink@Betsy  
Review requested from: Bean and Doozer

## Problem

The provider suite reports false failures because two source sentinels lag current reviewed architecture and member copy:

1. composition-root isolation exempts Twilio's adapter factory from importing the sanctioned factory-acceptance boundary, but not the equivalent Plaid and Stripe Identity factories;
2. Crucible journey copy expects the retired one-word `Pricing` link while the page correctly renders `See check pricing`.

Separately, top-level-await adapter scripts require Node's native TypeScript stripping plus the `react-server` condition on this machine.

## Candidate

- Exempt all current concrete provider factory modules—Plaid, Stripe Identity, and Twilio—from the forbidden-import scan while continuing to forbid those internals everywhere else.
- Update the member-copy sentinel to the exact current `See check pricing` text.
- Prove every adapter using `node --experimental-strip-types --conditions=react-server`.

## Hard edges

No adapter behavior, production gate, credential, provider call, environment file, schema, payment, push, or deploy change.
