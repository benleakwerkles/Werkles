# Werkles BVPGM M5 — Exact Review Transport

Date: 2026-08-23  
Foreman: Heimerdinker@Betsy  
State: `CANDIDATE_SEALED__EXACT_REVIEW_ROUTES_BLOCKED__NO_OPERATOR_COURIER_WORK_ASSIGNED`

## Vision

Keep the source-bound release candidate sealed while actual CBCC reviewers walk
the exact digest. Transport and receipt harvest are machine work; Ben is not the
Send button, copy/paste courier, or receipt hunter.

Vision card:
`foreman/handoffs/outbox/WERKLES_BVPGM_M5_REVIEW_TRANSPORT_V_20260823.md`

## Pull

- The current direct-task sender is
  `scripts/foreman/crew-dispatch-send.mjs`. It can invoke a provider's own Send
  control once through CDP without OS focus, physical mouse, clipboard, or
  synthesized Enter.
- The older Relay Courier and `dispatch-policy.json` remain a different,
  superseded load-and-stop path for substantive packets. They were not used to
  make Ben the courier.
- Fresh source-bound terminal receipts remain absent for Ender, Bean,
  Skybro/Petra, and Lady Jessica.
- Exact established provider task identifiers still exist for Ender and Bean,
  but no callable CDP route to those signed-in tasks is currently exposed.
- The only live DevTools endpoint in the supported scan range is Perplexity
  Desktop on port 9349. Its visible exact task is the Plaid questionnaire, not
  this release-review mission. It was not repurposed and no new task was opened.

## Go

1. Ran Relay Courier status and self-test. The isolated crew profile and page
   control are healthy, but that courier is not the accepted direct-task Send
   path for this substantive review.
2. Audited the newer direct-task sender and its one-submission custody ledger.
3. Probed Ender, Bean, Skybro, and Petra without taking foreground input.
4. Inspected the sole discovered CDP endpoint and rejected the unrelated
   Perplexity Plaid task as a release-review route.
5. Re-ran the deterministic candidate audit after transport work.

## Momentum

The two bounded repair ideas were exhausted:

1. Existing Relay Courier profile: technically healthy, but it does not prove
   the exact signed-in provider tasks and its legacy substantive-packet path
   stops before Send.
2. Direct-task CDP sender: correct modern transport, but no callable exact task
   for the required reviewers is currently exposed. The only exposed task is
   unrelated and therefore unusable.

No foreground browser was opened or focused, no desktop app was restarted, no
login or credential work was requested, and no packet was falsely marked sent.
No transport work is assigned to Ben.

## Candidate custody

Fresh deterministic audit:

- status:
  `SOURCE_BOUNDARY_CLOSED__LOCAL_REGRESSION_PASS__INDEPENDENT_REVIEW_OWED`
- candidate digest:
  `e64ae1c67e7e065884781891a2139d8e699488b4bfdcceb2b4449e820b6c3386`
- candidate files: 278
- candidate source: 247
- candidate verification: 30
- candidate data: 1
- changed-import leaks: 0

## Gate truth

Werkles remains one independent review-and-repair cycle from the exact push
approval checkpoint. The machine-proof half is complete. The review half is
blocked on callable direct routes to the actual seats, not on packet creation,
local build failure, or Operator labor.

No Heimerdinker sign-off, Lady Jessica sign-off, Ben push-approval request,
push, deploy, merge, provider action, credentials, schema/RLS, production
mutation, spend, new environment, subagent, or foreground-input control
occurred.
