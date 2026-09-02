# TO HEIMERDINKER — Matching Durable Storage Options V/P/G Cycle 4

Packet: `TO_HEIMERDINKER_MATCHING_DURABLE_STORAGE_OPTIONS_VPG4_20260710`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`

## Mission

Audit existing repo storage capabilities and produce a decision-ready architecture recommendation for discovery intake records and matching shadow runs.

## Required options

1. Deploy current `/tmp` crash-prevention behavior for shadow-only validation.
2. Add durable shared Supabase persistence before deploy.
3. If evidence supports it, describe a hybrid local-file/Supabase adapter.

For each option state durability, cross-instance visibility, schema/RLS needs, failure behavior, blast radius, migration work, and live-smoke implications.

## Truth rules

- Do not claim an existing matching table if none is present in migrations.
- Do not read or print secrets.
- Do not apply SQL, create tables, mutate production, push, or deploy.
- Prefer fail-closed or explicitly partial states over fake persistence success.

## Artifact

`foreman/reviews/WERKLES_MATCHING_DURABLE_STORAGE_OPTIONS_V0_20260710.md`

