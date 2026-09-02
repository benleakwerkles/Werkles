# Gate — Member Intake Account Custody

Tier: 1 — schema/RLS and member data custody
Confidence: MEDIUM

The code and migration candidate are prepared. Local `gimprobotester` continuity is repaired without rewriting the last Intake. Durable cross-browser account saving cannot become active until the Supabase migration/RLS and runtime configuration are applied and verified.

## Proposed gated action

Apply `supabase/migrations/20260820073346_member_concierge_intakes.sql` to the intended Werkles Supabase project, then run owner-isolation tests with two authenticated test accounts.

## Blast radius

- new `public.member_concierge_intakes` table;
- authenticated member SELECT/INSERT/DELETE policies; accepted submissions are append-only;
- column-level INSERT privilege permits only submission ID, Intake ID, and answers; `user_id` comes from `auth.uid()` and capture time comes from the database;
- Intake POST and account current-Intake/recommendation GET routes;
- no existing table mutation or backfill in this migration.

The candidate stores only member/submission/Intake identifiers, answers, and
timestamps. Derived packets and answer counts are rebuilt at read time. An
exact retry returns the original submission; a reused submission ID with
different answers fails closed.

The migration also rejects missing/extra answer keys, non-string values,
individual answers over 600 characters, and entirely blank submissions at the
database boundary. These constraints are required because RLS protects rows,
not the shape of caller-authored JSON.

## Known risks / unknowns

- the local Betsy environment currently has no Supabase URL/anon-key names configured;
- no live schema or RLS inspection has been performed;
- column privileges and defaults are source-reviewed but have not been proven against the intended project's Data API configuration;
- the local saved Intake can be recovered, but importing it into the real `gimprobotester` row is a separate production-data mutation;
- Bean/Ender/Lady Jessica returns for this exact slice remain pending and are not counted as reviews.

## What remains blocked

- SQL/RLS apply;
- live owner-isolation proof;
- local runtime secret/config connection;
- one-time import of the recovered local Intake into the verified account;
- push/deploy.

## Current source basis

- Supabase Row Level Security: ownership policy uses `(select auth.uid()) = user_id` and explicit `TO authenticated`.
- Supabase Column Level Security: table-level INSERT is revoked before granting INSERT only on the three caller-owned columns.
- Supabase Securing Your API: object privileges and RLS are treated as separate required controls.

## Approval phrase

`APPROVE MEMBER INTAKE SCHEMA AND RLS APPLY`

This phrase authorizes only the reviewed migration apply and owner-isolation verification. It does not authorize production-data import, secret entry, push, or deploy.

## Rejection / patch phrases

- `REJECT MEMBER INTAKE SCHEMA`
- `PATCH MEMBER INTAKE SCHEMA: <change>`
