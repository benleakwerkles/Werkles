# G lane — PROCEED (Operator 2026-07-10)

**P, G** — Ben GO on Werkles.com matching shadow QA.

## Dink — do now

```powershell
cd C:\Users\Ben Leak\github\Werkles
git pull origin maker/site-g-20260703
.\scripts\foreman\Test-WerklesMatchingShadowSmoke.ps1
```

Smoke auto-targets **localhost:3000** when dev server is up (localhost was **PASS** 3/3).

Human review: `http://localhost:3000/operator/matching/shadow`

File: `foreman/receipts/WERKLES_MATCHING_SHADOW_QA_20260710.md`

## Production

Still **not deployed** — werkles.com 404/500 expected until Operator deploy gate.

Diagnosis: `foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_DIAGNOSIS_20260710.md`

## Maker

Build deputy on standby for false-positive tune list from Dink QA receipt.
