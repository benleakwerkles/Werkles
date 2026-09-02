# Vision — Plaid sandbox activation

Date: 2026-08-22
Foreman: Heimerdinker@Betsy
Project: WERKLES_COM
Work: PLAID_SANDBOX_ACTIVATION
Cycle: PRECODE_01
SEAM_ID: PLAID_SANDBOX_MINIMUM_FUNDS_PROOF_V1
Attempt: 1

## Bounded question

Now that Werkles has Plaid sandbox access and production credentials are under
review, what is the smallest truthful sandbox lifecycle that proves the chosen
product fit, Link handoff, minimum-funds evaluation, deletion/revocation, and
member readout without implying production verification is live?

## Fixed baseline

- The provider onboarding request selected `Auth + Balance` for a user-initiated,
  point-in-time minimum-funds check.
- Current local Link construction requests `products: ["assets"]`.
- The provider-neutral adapter prototype models Fast Assets creation, signed
  readiness webhook handling, narrow threshold output, Item/report disposal,
  and no raw-value return.
- The live exchange route is deliberately disabled; the client discards the
  public token and reports `completed-not-saved`.
- Production credentials are pending provider review and remain out of scope.

## Observable outcome

One reviewed decision selects Balance, Assets, or a deliberately separated
sandbox experiment; the local implementation and copy agree with that decision;
focused tests prove no raw financial values or reusable tokens escape the
server boundary; the walkthrough distinguishes sandbox completion from a real
funds receipt.

## Crew duties

- Computer: official Plaid product/lifecycle research and exact API/deletion
  implications.
- Bean: independent pre-code hostile trust/data-minimization challenge.
- Ender: independent pre-code member UX/copy challenge.
- Foreman: assimilate only validated receipts, choose the bounded candidate,
  implement locally, and run technical proof.

## Allowed

- Read-only official-provider research and local source inspection.
- Local code/tests/cockpit edits inside Plaid/Crucible sandbox scope after
  pre-code receipts permit a candidate.
- Credential-free contracts and sandbox-only probes that do not print secrets
  and make no paid call.

## Forbidden

- Production credentials or calls, billing, provider plan changes, SQL/schema/
  RLS, production data, push, deploy, public launch, legal certification,
  secrets in output, raw balance/transaction/account-number persistence, or a
  public `Funds verified` claim from Link success alone.

## Acceptance checks

1. Product selection and code request are explicitly reconciled.
2. Link success cannot become verification without server-side evaluation.
3. Any transient public/access token is confined to the server lifecycle.
4. Raw balance and account data are not returned, logged, or persisted.
5. Item/report removal semantics are tested, including partial failure.
6. Sandbox UI says what happened and what did not happen in ordinary language.
7. Existing focused Plaid tests, TypeScript, and the relevant local browser flow
   pass without production-provider mutation.

## Budget and expiry

- Paid calls: zero.
- New tasks/environments/subagents: zero.
- Exact existing CBCC routes only.
- Expiry: end of this VPGM cycle or first true Human Gate.

## Checkpoint

Stop at one of: reviewed local sandbox lifecycle complete; exact product-fit
blocker requiring Plaid clarification; missing private credential gate;
production-review gate; or the two-attempt repair limit.

