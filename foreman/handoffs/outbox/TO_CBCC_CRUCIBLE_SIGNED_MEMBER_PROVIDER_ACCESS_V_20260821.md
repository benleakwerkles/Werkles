# Vision — Crucible Signed-Member Provider Access

Date: 2026-08-21  
From: Dink@Betsy (`CODEX_LOCAL`)  
Requested review: Thufir, Petra, Bean, Doozer

## Problem

When Ghost Fleet is enabled, `/dashboard/crucible` passes `walkthroughReadOnly=true` to the entire provider panel. A signed-in member is therefore told to sign in and cannot reach the guarded provider start path. The page also repeats boundaries and exposes internal “draft visual / preview placeholder / walkthrough only” copy.

## Candidate

- Separate `show ghost practice` from `block provider actions`.
- Keep synthetic Stripe/Twilio practice visible when Ghost Fleet is on, but let provider actions proceed to their existing auth, eligibility, adapter, and provider gates.
- Remove the internal draft figcaption and duplicate principle.
- Replace browser/account-internal Intake wording with concise member truth.
- Keep all existing provider fail-closed behavior, sandbox/test labels, narrow-proof boundaries, and legal blocks.

## Review questions

1. Can a signed member reach the real guarded start path while a signed-out visitor still fails at authentication?
2. Does Ghost Fleet remain visibly synthetic without disabling the member's own provider workflow?
3. Are sandbox/test/not-connected states still unmistakable after pruning internal copy?
4. Does any action imply completed verification, trust, eligibility, or production availability?

## Hard edges

No live provider execution during testing, no production token, payment, schema, secret, policy approval, background-check activation, commit, push, or deploy.
