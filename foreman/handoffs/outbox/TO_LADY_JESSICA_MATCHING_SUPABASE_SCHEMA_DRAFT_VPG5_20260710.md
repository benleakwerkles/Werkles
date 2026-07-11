# TO LADY JESSICA — Matching Supabase Schema Draft V/P/G Cycle 5

Packet: `TO_LADY_JESSICA_MATCHING_SUPABASE_SCHEMA_DRAFT_VPG5_20260710`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`

## Mission

Prepare a review-only SQL/RLS design for durable discovery and matching-shadow custody.

## Required design

- stable intake/run identifiers
- append-only matching payload and engine version
- timestamps and source fields
- service-role writes
- operator/admin reads only
- no public anonymous enumeration
- retention/deletion questions called out explicitly
- idempotent upsert semantics for run IDs

## Artifact

Create `foreman/reviews/WERKLES_MATCHING_SUPABASE_SCHEMA_DRAFT_V0_20260710.sql`.

This is review material only. Do not place it in `supabase/migrations`, apply SQL, inspect secrets, call Supabase, push, or deploy.
