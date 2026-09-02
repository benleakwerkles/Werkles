# Receipt — Member Intake append-only custody hardening

Date: 2026-08-20  
Execution: CODEX_LOCAL on Betsy  
Vision: `foreman/handoffs/outbox/V_HEIMERDINKER_MEMBER_INTAKE_APPEND_ONLY_CUSTODY_20260820.md`

## Pre-live defects closed

- Replaced mutable Intake upsert semantics with append-only insert semantics.
- Same member + same client submission ID + same answers returns the original
  row as an idempotent retry.
- The same submission ID with changed answers fails closed instead of replacing
  history.
- Removed duplicate packet, answered-count, and updated-at storage. The server
  rebuilds derived packet/count values from the saved answers.
- Removed authenticated UPDATE grant and RLS policy; member SELECT, INSERT, and
  DELETE remain owner-exact.
- Invalid calendar instants fail closed without throwing from the validator.

## Proof

- `npx.cmd tsx scripts/foreman/member-intake-account-custody-smoke.ts` — PASS
- `node scripts/foreman/member-intake-client-continuity-smoke.mjs` — PASS
- `npm.cmd run typecheck` — PASS
- scoped `git diff --check` — PASS

## Gate preserved

The Supabase migration is still a candidate. No schema/RLS apply, live owner
test, account data import, environment mutation, stage, push, or deploy occurred.
See `foreman/reviews/GATE-member-intake-account-custody-20260820.md`.

