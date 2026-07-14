# To Lady Jessica: Matching Phase 2 Unlock

Status: `LOCAL_G_PASS__PREVIEW_G_BLOCKED_AUTH_TOOLING`

Machine: `Betsy`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
HEAD: `6790477`  
Date: `2026-07-13`

## Operator Trigger

Ben issued:

```text
P, G
```

Interpreted in the active Werkles matching lane as:

- `P`: prepare/read back the next matching rollout work from canonical repo artifacts
- `G`: execute the best safe moves without crossing blocked auth, deploy, SQL, production, public, or secret boundaries

## P Readback

Canonical runbook:

`foreman/reviews/WERKLES_MATCHING_PREVIEW_ROLLOUT_RUNBOOK_V0_20260711.md`

The runbook says the next intended sequence is:

1. schema verified
2. set `MATCHING_STORAGE_MODE=supabase` for Vercel Preview only
3. deploy preview for `maker/site-g-20260703`
4. smoke preview origin
5. stop before production/public enablement

The same runbook also says to stop if migration verification fails or cannot be proven.

## G Executed Locally

Local Werkles gates are green:

- `npm.cmd run typecheck`: `PASS`
- `node scripts/foreman/test-matching-storage-mode.Inner.mjs`: `PASS`
- `npm.cmd run build`: `PASS`

Receipt:

`foreman/receipts/WERKLES_VPG_LOCAL_BUILD_AND_SCHEMA_PROBE_20260713.md`

Local matching shadow smoke was run against:

`http://localhost:3000`

Result:

`PASS`

Smoke receipt:

`foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_20260713.json`

Smoke proved:

| Scenario | Expected top path | Actual top path | Result |
|---|---|---|---:|
| `capital_partner` | `verify_proof` | `verify_proof` | `PASS` |
| `job_change` | `find_better_job` | `find_better_job` | `PASS` |
| `training_not_partner` | `get_training` | `get_training` | `PASS` |
| `operator_shadow_page` | page loads | HTTP 200 | `PASS` |

Operator review URL on Betsy:

`http://localhost:3000/operator/matching/shadow`

## Current Preview Blocker

Current live schema re-probe from this seat is blocked:

`BLOCKED_PROBE_AUTH`

Known current checks:

- no `C:\Users\Ben Leak\.supabase\access-token`
- no `SUPABASE_ACCESS_TOKEN`
- no `.supabase\config.toml`
- no `supabase\config.toml`
- `op` CLI exists, but prior service-role probe through `foreman\gates\werkles-vercel-tier-a.env.oprefs` timed out before table evidence
- Vercel CLI is not on PATH in this shell

This is not a claim that the schema is absent. It is a claim that this current seat cannot independently re-prove live table state yet.

Historical applied receipt still exists:

`foreman/receipts/WERKLES_MATCHING_SCHEMA_APPLIED_20260712.md`

## Do Next

Unlock one live auth/tool path, then rerun the preview rollout:

1. Complete visible Betsy Supabase OAuth or restore noninteractive 1Password/service-role probing.
2. Verify both live tables:
   - `public.discovery_intakes`
   - `public.matching_shadow_runs`
3. Make Vercel Preview-only environment change:
   - `MATCHING_STORAGE_MODE=supabase`
4. Deploy `maker/site-g-20260703` to preview.
5. Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\Test-WerklesMatchingShadowSmoke.ps1 -SiteOrigin "https://<preview-origin>"
```

6. File preview rollout receipt.
7. Stop before production alias, production storage mode, public matching, or LLM matching.

## Hard Stops Preserved

- SQL applied in this P/G pass: `NO`
- Preview Vercel env changed in this P/G pass: `NO`
- Preview deploy run in this P/G pass: `NO`
- Production deploy/alias touched: `NO`
- Public matching enabled: `NO`
- LLM matching enabled: `NO`
- Secrets or tokens printed: `NO`
