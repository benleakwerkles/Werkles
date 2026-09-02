# Vision — full member walkthrough by review lineage

Date: 2026-08-17
Foreman: Heimerdinker@Betsy
Execution context: `CODEX_LOCAL` on Betsy/Windows
Lane: Werkles local member walkthrough
Environment: `http://127.0.0.1:3000`

## Goal

Walk the product from the first stranger-facing page through the local member
journey while distinguishing actual-CBCC reviewed surfaces from partially
reviewed, legacy/mixed, and practice-only surfaces. The walkthrough is an
admission test, not a claim that the whole site is finished.

## Order

1. `/` — public Home; legacy/mixed review lineage; test comprehension first.
2. `/login?next=%2Fbellows%2Fintake` — reviewed local walkthrough transition;
   not durable account authentication.
3. `/bellows/intake` — improved actual-CBCC reviewed conversation; local
   browser/session custody only.
4. `/dashboard/blueprints` — Workshop plan/readback; partially reviewed,
   critique-ready scaffold, not a persistent collaboration room.
5. `/bellows/recommendations` — actual-CBCC reviewed options and work paths;
   provider directory/ranking remains absent.
6. `/dashboard/intros` — synthetic Ghost Fleet practice; post-build actual-CBCC
   review remains open; no real outreach.
7. `/dashboard/crucible` — ghost Stripe/Twilio practice and proof education;
   production providers remain off.
8. `/dashboard/profile` — inspect account-custody honesty; durable member
   persistence is not represented as complete.
9. `/membership` — local/mock commercial path; no charge or live checkout.

## G ideas

1. Put the browser on Home so the Operator can test the full stranger-to-member
   story rather than starting after the oldest seam.
2. Publish a concise review-lineage map beside the walkthrough order.
3. Preserve one honest stop label per surface: reviewed, partial, legacy/mixed,
   or practice-only.

## Momentum ideas

1. Verify the first page renders locally and capture its visible entry actions.
2. Re-pull current cockpit/receipts and record any stale or contradictory
   walkthrough status without silently rewriting product code.

## Hard edges

- No Codex subagents, new execution environments, or impersonated CBCC seats.
- No provider calls, secrets, spend, SQL/schema/RLS, production mutation,
  staging, commit, push, merge, or deploy.
- Do not call browser-local walkthrough custody an account save.
- Do not call outgoing review packets completed cousin reviews.

