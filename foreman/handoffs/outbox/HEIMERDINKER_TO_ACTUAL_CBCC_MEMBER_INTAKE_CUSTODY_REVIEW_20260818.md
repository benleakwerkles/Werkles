# TO ACTUAL CBCC — Member Intake custody and identity continuity review

Date: 2026-08-18  
From: Heimerdinker / Werkles.com Foreman  
Requested seats: Bean (trust/ownership), Ender (return experience), Lady Jessica (site integration/push custody)  
Status: REVIEW REQUEST ONLY — not dispatched proof, not a returned review, not approval

## Mechanical defect already repaired locally

The local member ledger contained a complete nine-answer Werkles/Pooka Intake
followed by a bakery test. Every downstream page used the last row, so the
bakery displaced the operator's actual work. The local-only repair:

- reactivated the already-owned complete Intake without rewriting its answers;
- prefills Intake from the current owner record;
- keeps an unfinished browser draft while typing;
- makes local Login offer one explicit `gimprobotester` walkthrough seat rather
  than a password form that cannot validate without Supabase configuration;
- browser-proves the same Intake on Recommendations, Workshop, and Intros.

This is not durable account custody.

## Durable design proposed for review

### Auth composition

Use Supabase cookie-based SSR auth for Next.js via `@supabase/ssr`. The browser
and server must share the refreshed PKCE session. Authenticated pages and route
handlers derive the verified user on the server; the Bellows owner cookie is no
longer an authorization source for account data.

Official current references:

- https://supabase.com/docs/guides/auth/server-side
- https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs
- https://supabase.com/docs/guides/auth/server-side/advanced-guide

### Member custody table

Proposed immutable submission table: `member_concierge_intakes`.

Required fields:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id)`
- `version text not null`
- `answers jsonb not null`
- `packet jsonb not null`
- `answered_count integer not null`
- `supersedes_id uuid null`
- `created_at timestamptz not null`

No email, password, access token, refresh token, provider payload, or service
credential belongs in the row.

### RLS floor

- RLS enabled before Data API exposure.
- `SELECT TO authenticated USING ((select auth.uid()) = user_id)`.
- `INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id)`.
- No caller-supplied `user_id` accepted by application composition.
- No `user_metadata` authorization.
- Updates should not rewrite historical submissions; correction creates a new
  immutable version referencing `supersedes_id`.
- Export/deletion behavior requires an explicit product/legal ruling before
  go-live.

### Matching separation

Member Intake custody is not the operator matching table. Matching runs may
reference the member Intake ID, but cannot become the source of ownership or
serve raw member answers to another member. A matching failure cannot roll back
an already-durable Intake save.

## Required hostile review

Bean:

1. Cross-user reads/inserts, forged owner cookie, caller `user_id`, stale JWT,
   `user_metadata`, service-role misuse, and Data API exposure.
2. Export/deletion, retention, and immutable-correction gaps.

Ender:

1. Sign in → return to exact work, new browser return, expired session, save
   confirmation, draft recovery, and matching failure after successful save.
2. Copy that distinguishes saved account work from an unsent browser draft
   without training-manual clutter.

Lady Jessica:

1. Integration ownership for Login/Header/Intake/Recommendations/Workshop/
   Intros/Profile/Membership.
2. Dirty-tree slice boundaries and eventual three-key push custody.

## Gate

Do not apply SQL/RLS, configure secrets, mutate production, deploy, or claim
account portability until actual reviews return, the final schema packet is
sealed, and Ben approves the exact Tier 1 gate.

