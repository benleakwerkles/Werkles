# TO BEAN — Member Intake Account Custody Attack

Review only. Inspect the current source in the canonical Werkles repository.

## Problem

A member repeatedly submitted Intake while signed in as `gimprobotester`, but the answers remain repo-file/browser-owner state and disappear from the walkthrough. The fix must bind durable Intake rows to verified Supabase `auth.uid()` and must not trust a caller-authored owner cookie.

## Review

- attack the proposed dedicated `member_concierge_intakes` owner model and RLS;
- require exact authenticated owner select/insert/update behavior and forged-cookie rejection;
- define safe migration/backfill boundaries for the latest local Intake without moving another owner's answers;
- identify retention/deletion/data-minimization concerns;
- return P0/P1 findings and executable acceptance tests.

## Sources

`app/api/bellows/intake/route.ts`
`lib/squibb/bellows-owner-session.ts`
`lib/squibb/concierge-intake-storage.ts`
`lib/supabase/request.ts`
`supabase/migrations/00004_matching_shadow_persistence.sql`

Do not edit, apply SQL/RLS, inspect secrets, mutate production, push, or deploy. Return a receipt to `foreman/handoffs/inbox/`. ACK is not completion.

