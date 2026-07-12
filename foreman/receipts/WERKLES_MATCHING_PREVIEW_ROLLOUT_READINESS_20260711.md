# Matching Preview Runbook — V/P/G Cycle 8

Machine: BETSY  
Execution context: `LOCAL_SALLY_WINDOWS`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
HEAD: `017fa2a`  
Packet: `TO_LADY_JESSICA_MATCHING_PREVIEW_RUNBOOK_VPG8_20260711`

## Verdict

`PASS — RUNBOOK READY (EXECUTION BLOCKED ON SCHEMA GATE)`

## Deliverable

`foreman/reviews/WERKLES_MATCHING_PREVIEW_ROLLOUT_RUNBOOK_V0_20260711.md`

Includes: prerequisites, stop conditions, names-only env verification, preview smoke steps, rollback, production separation, and hold point before prod gate.

## Mechanical proof (this cycle)

| Check | Result |
|-------|--------|
| Root typecheck | PASS |
| Storage mode contract | PASS (4/4) |
| Localhost semantic smoke | PASS 7/7 (`:3000`) |
| Public / LLM flags | OFF (code constants) |

## Not performed

SQL apply, Supabase calls, Vercel env mutation, deploy, push, production alias change, public matching flip.

## Known gap documented in runbook

Preview smoke mule semantic golden assertions read local `shadow-runs.jsonl` only. Supabase-mode preview proof relies on intake `shadow_run_id` + operator page + optional dashboard spot-check until readback mule exists.

## Next gate (unchanged)

```text
APPROVE MATCHING DURABLE SCHEMA APPLY
```

After approval: execute runbook Phases 0–6 on preview only.
