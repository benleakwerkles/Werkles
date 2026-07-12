# TO LADY JESSICA — Matching Data Policy Align V/P/G Cycle 9

Packet: `TO_LADY_JESSICA_MATCHING_DATA_POLICY_ALIGN_VPG9_20260712`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`

## Mission

Align durable shadow-run writes and preview smoke with `WERKLES_MATCHING_DATA_POLICY_DECISION_V0_20260711` before schema apply.

## Tasks

1. Replace `matching_shadow_runs` upsert with insert-and-reject (duplicate `run_id` fails visibly).
2. Expose `shadow_top_eligible_path` + `shadow_disqualified_kinds` on shadow intake responses for smoke/readiness on any origin.
3. Update smoke mule to use intake response semantics (not local JSONL readback).
4. Revalidate typecheck + storage mode + localhost smoke 7/7.

No SQL apply, Supabase calls, deploy, push, or flag flip.
