# Werkles Member Intake Custody Column Boundary — VPGM Receipt

Date: 2026-08-21

## Defect found

The unapplied account-Intake migration protected row ownership with RLS but granted authenticated callers table-level INSERT. A caller bypassing the application could still author `user_id`, forge `captured_at`, or insert malformed/oversized JSON into its own rows.

## Candidate repair

- `user_id` now defaults from `auth.uid()`.
- `captured_at` now defaults from database time.
- Authenticated table-level privileges are revoked first.
- Authenticated INSERT is granted only for `client_submission_id`, `intake_id`, and `answers`.
- The application no longer sends `user_id` or `captured_at` in its INSERT.
- Database checks enforce exact keys, string values, 600-character per-answer limits, and at least one nonblank answer.
- Existing owner SELECT/INSERT/DELETE RLS remains; UPDATE remains absent.

## Source basis

- Supabase Row Level Security guidance.
- Supabase Column Level Security guidance.
- Supabase Securing Your API guidance that privileges and RLS are separate controls.

## Proof

- `npx.cmd tsx scripts/foreman/member-intake-account-custody-smoke.ts` — PASS
- `$env:NODE_OPTIONS='--conditions=react-server'; npx.cmd tsx scripts/foreman/member-intake-custody-runtime-smoke.ts` — PASS
- `npm.cmd run typecheck` — PASS
- scoped `git diff --check` — PASS

The runtime attack captured the real adapter INSERT payload and proved it contains exactly `answers`, `client_submission_id`, and `intake_id`. It also proved extra keys, a 601-character answer, and an all-blank submission fail before the database call.

## Gate preserved

The migration remains unapplied. No Supabase project, member data, secret, environment, production account, or deployment was touched. Live schema/RLS/owner-isolation proof still requires the named human gate.
