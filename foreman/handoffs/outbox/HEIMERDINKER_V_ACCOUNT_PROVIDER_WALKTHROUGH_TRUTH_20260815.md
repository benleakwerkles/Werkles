# V — Account and provider walkthrough truth

Date: 2026-08-15
Owner: Heimerdinker / Codex Foreman on Betsy
Environment: canonical local repo and localhost only

## Question to answer

Before Ben re-enters an honest Intake, prove whether a signed-in `gimptest`
submission is durable account-owned data or only a browser/local-file session.
Then publish a plain testing map for Supabase, Stripe, Plaid, Twilio, Checkr,
and Ghost Fleet surfaces.

## Authorized slice

- Trace browser auth token -> Intake route -> storage -> Recommendations,
  Workshop, Intros, and Crucible readback.
- Inspect applied schema and provider route/scaffold truth without exposing
  secrets or calling paid/live providers.
- Run bounded local/sandbox-safe contract and route proofs.
- Repair only false readiness copy or local walkthrough scaffolding that can be
  fixed without SQL, credentials, provider actions, or production data.
- Leave a member-facing/local operator test map and receipt.

## Hard stops

No SQL/schema/RLS apply, Supabase data mutation, provider call that can charge,
OAuth/login handling, secret inspection, checkout, push, merge, deploy, or
production mutation. If account durability requires missing schema or SSR auth,
say so before Ben fills the form.

## Stop condition

Stop after the account answer is proven, every provider is classified, the
ghost-match routes are named, focused checks pass, and the next real human gate
is isolated.
