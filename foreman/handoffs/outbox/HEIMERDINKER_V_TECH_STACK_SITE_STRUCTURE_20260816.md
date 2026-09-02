# V — Tech-stack site structure

Date: 2026-08-16  
Foreman: Heimerdinker@Betsy  
Lane: Werkles.com / Crucible / member proof journey  
Environment: local Betsy only

## Vision

Turn the existing provider foundations into an understandable site structure.
A member should be able to see where identity, phone, bank ownership/funds,
background screening, role credentials, and Werkles-native evidence belong—
without reading vendor names as universal trust badges or seeing unavailable
code paths presented as live.

## Pull inputs

- actual Ender receipt:
  `foreman/handoffs/inbox/FROM_ENDER_VPGM_20260816-223710.md`
- actual Bean receipt:
  `foreman/handoffs/inbox/FROM_BEAN_INTAKE_DUAL_PURPOSE_ACTUAL_CBCC_v0.1.md`
- provider readiness manifest and diagnostics already in the shared tree
- provider adapter port, conformance, composition-root, lifecycle, and factory
  slot contracts already in the shared tree

## G ideas

1. Create one provider-neutral member proof journey that maps narrow checks to
   the page/action they support and preserves `unknown`, `not connected`,
   `sandbox scaffold`, and policy-blocked states.
2. Integrate that journey into Crucible with plain language and a machine-checkable
   contract, without exposing operator internals or enabling provider actions.

## M beat

After the two ideas, re-pull actual CBCC inbox state. If no new receipt exists,
run a local rendered Crucible proof and write a receipt.

## Hard edges

- no Codex subagents or new environments;
- no provider calls, secrets, spend, SQL/schema/RLS, production data, push,
  merge, deploy, or public launch;
- no universal `verified`, `safe`, `trusted`, or eligibility badge;
- outgoing packets do not count as cousin review;
- production provider runtime remains off.

