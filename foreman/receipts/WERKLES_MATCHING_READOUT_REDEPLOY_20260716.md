# Werkles Matching readout production redeploy receipt

- **Machine:** BETSY
- **Timestamp (local):** 2026-07-16 (US Eastern)
- **Approval phrase:** Approve redeploy
- **Branch:** maker/site-g-20260703
- **Commit SHA:** a2c5a6ca224e925b3c90fbf390808f57c19afdda

## Deploy (authoritative)

- **Project:** werkles/werkles1
- **Worktree:** detached clean checkout at `C:\wkr-rd60716` pinned to commit above (`core.longpaths=true`; default Temp path failed on long paths)
- **Deployment ID:** dpl_Gf6JY5ELSfDnCRUAss3zap7BAz8m
- **Deployment URL:** https://werkles1-qhcdc290z-werkles.vercel.app
- **Inspector:** https://vercel.com/werkles/werkles1/Gf6JY5ELSfDnCRUAss3zap7BAz8m
- **Ready state:** READY
- **Production alias:** https://werkles.com updated

## Note

An earlier production deploy from the dirty canonical checkout (dpl_2mTEAztsQMLX1Jfzji3mAJFihQFx) was superseded by the clean worktree deploy above.

## Live smoke (https://werkles.com)

| Check | Result |
|-------|--------|
| Overall | **PASS** |
| capital_partner (symptom trap) | PASS — top `verify_proof`; shadow `shadow_20260716045521_7c761388` |
| job_change | PASS — top `find_better_job`; shadow `shadow_20260716045522_4024e43b` |
| training_not_partner | PASS — top `get_training`; shadow `shadow_20260716045523_d0ad36e4` |
| Golden semantic assertions (3) | PASS |
| operator_shadow_page | PASS — 404 denied (expected) |

Smoke receipt: `foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_20260716.json`

## Hard stops preserved

| Control | Status |
|---------|--------|
| Public matching (`MATCHING_AUTONOMOUS_PUBLIC`) | OFF (code constant in deployed commit) |
| LLM matching (`MATCHING_LLM_TRANSLATE_ENABLED`) | OFF (code constant in deployed commit) |
| `MATCHING_STORAGE_MODE` (production env key) | Present on Vercel production (value not logged) |

No matching public/LLM env flip performed during this redeploy.
