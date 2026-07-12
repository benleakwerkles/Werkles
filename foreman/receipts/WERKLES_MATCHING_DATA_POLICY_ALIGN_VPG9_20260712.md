# Matching Data Policy Align — V/P/G Cycle 9

Machine: BETSY  
Execution context: `LOCAL_SALLY_WINDOWS`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
Packet: `TO_LADY_JESSICA_MATCHING_DATA_POLICY_ALIGN_VPG9_20260712`

## Verdict

`PASS — POLICY ALIGNMENT READY FOR SCHEMA GATE`

## Changes

| Area | Change |
|------|--------|
| `lib/matching/shadow-store.ts` | `matching_shadow_runs` uses `insert`; duplicate `run_id` → visible error (`23505`) |
| `lib/matching/shadow-pipeline.ts` | `shadowRunSmokeSummary()` for intake response fields |
| Intake routes | Discovery + Bellows return `shadow_top_eligible_path`, `shadow_disqualified_kinds` in shadow mode |
| Smoke mule | Semantic golden checks from intake JSON (localhost + preview capable) |
| Runbook | Preview smoke gap closed in `WERKLES_MATCHING_PREVIEW_ROLLOUT_RUNBOOK_V0_20260711.md` |

## Mechanical proof

| Check | Result |
|-------|--------|
| Root typecheck | PASS |
| Storage mode contract | PASS (4/4) |
| Localhost semantic smoke | PASS 7/7 (`:3000`, response-based) |
| Public / LLM flags | OFF |

## Intake custody note

`discovery_intakes` upsert retained for idempotent intake custody per policy §3 (idempotency key at intake layer). Only `run_id` is strict append-only.

## Not performed

SQL apply, Supabase exercise, Vercel env change, deploy, production promotion.

## Gates (unchanged queue)

1. `APPROVE MATCHING DATA POLICY V0` (optional — recommendation exists)
2. `APPROVE MATCHING DURABLE SCHEMA APPLY` (required before migration)
3. Preview rollout per runbook
