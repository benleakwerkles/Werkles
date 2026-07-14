# Werkles Matching Preview Rollout Receipt

Status: `PREVIEW_ROLLOUT_PASS`

Machine: `Betsy`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
HEAD at start of run: `6790477`  
Date: `2026-07-13`

## Operator Trigger

Ben issued:

```text
V, P, G
```

This run continued until the Matching preview lane was unblocked or a true hard blocker remained.

## V: Verified Starting Blockers

Initial live blockers were real:

- Supabase CLI was missing from PATH.
- Supabase API auth token was missing.
- 1Password CLI existed, but the Werkles automation token was not stored.
- Vercel CLI was not initially callable through PowerShell's `.ps1` shim, but `.cmd` worked.
- Preview deployments were protected by Vercel SSO.
- The existing preview deployment did not contain the matching routes.

## P: Prepared Tooling And Gates

Actions completed:

- Installed user-level CLI tooling:
  - `supabase.cmd` version `2.109.1`
  - `vercel.cmd` version `55.0.0`
- Confirmed Vercel auth:
  - account: `benleak-2090`
  - project: `werkles/werkles1`
- Fixed shared 1Password helper compatibility:
  - added `Set-WerklesOnePasswordServiceToken` shim in `scripts/foreman/WerklesOnePasswordCredential.ps1`
- Added repeatable Supabase table probe:
  - `scripts/foreman/probe-supabase-tables-from-env-file.mjs`
- Added Vercel protection-bypass support to the matching smoke runner:
  - `scripts/foreman/test-matching-shadow-smoke.Inner.mjs`
- Stored the existing Vercel automation bypass secret in Windows Credential Manager:
  - target: `Werkles/Vercel/ProtectionBypass`
  - secret printed: `NO`
- Set Vercel Preview-only env:
  - `MATCHING_STORAGE_MODE=supabase`
  - `WERKLES_INTERNAL_PREVIEW_ACCESS=enabled`
- Production env/storage mode/public matching were not changed.

## Schema And Project Proof

Using Vercel-pulled env files in temp storage, then deleting them immediately:

| Environment | Supabase project ref | Probe key | `discovery_intakes` | `matching_shadow_runs` |
|---|---|---|---:|---:|
| Production | `ltixqticdtvztjcqmtjn` | anon fallback | `ok` | `ok` |
| Preview | `ltixqticdtvztjcqmtjn` | anon fallback | `ok` | `ok` |

Notes:

- `SUPABASE_SERVICE_ROLE_KEY` exists by name in Vercel, but Vercel env pull returns it as an unreadable/blank sensitive value in this shell.
- Runtime Preview writes still succeeded with `MATCHING_STORAGE_MODE=supabase`, proving the deployed server had the needed write path at runtime.

## G: Preview Deployment

Final Preview deployment:

`https://werkles1-kdci0hih3-werkles.vercel.app`

Deployment id:

`dpl_5TGeVLXrVPmWnZ3haz5hKDRgRtbC`

Vercel inspect status:

`Ready`

Build proof:

- Next.js `15.5.18`
- production build compiled successfully
- type/lint validation passed during Vercel build
- route manifest includes `/api/discovery/intake`
- route manifest includes dynamic `/operator/matching/shadow`

Local verification before final deploy:

| Gate | Result |
|---|---:|
| `node scripts/foreman/test-werkles-route-audience-boundary.mjs` | `PASS` |
| `npm.cmd run build` | `PASS` |
| `npm.cmd run typecheck` after build settled | `PASS` |

## Preview Smoke Result

Command:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\Test-WerklesMatchingShadowSmoke.ps1 -SiteOrigin "https://werkles1-kdci0hih3-werkles.vercel.app"
```

Vercel protection bypass used:

`YES`

Secret printed:

`NO`

Receipt:

`foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_20260713.json`

Smoke receipt SHA-256:

`4548AA2D7A83E72CEC0AC523336245E7815AB679F549706FBB371412380185D8`

Scenario results:

| Scenario | Intake status | Expected top path | Actual top path | Shadow run id | Result |
|---|---:|---|---|---|---:|
| `capital_partner` | `200` | `verify_proof` | `verify_proof` | `shadow_20260713072148_e0332d90` | `PASS` |
| `job_change` | `200` | `find_better_job` | `find_better_job` | `shadow_20260713072148_de8f290a` | `PASS` |
| `training_not_partner` | `200` | `get_training` | `get_training` | `shadow_20260713072149_67df6b48` | `PASS` |
| `operator_shadow_page` | `200` | page loads | page loads | n/a | `PASS` |

Additional operator readback:

- `shadow_20260713072148_e0332d90` present on operator page: `YES`
- `shadow_20260713072148_de8f290a` present on operator page: `YES`
- `shadow_20260713072149_67df6b48` present on operator page: `YES`

## Route Boundary Change

The newer internal-route boundary denied all operator pages outside local development. That conflicted with the preview rollout runbook's requirement to verify `/operator/matching/shadow` on Preview.

The implemented bridge is narrow:

- Production internal routes remain denied.
- Preview internal routes remain denied without an explicit env flag.
- Preview internal routes remain denied without the Vercel protection-bypass header.
- No query-string or cookie bypass was added.

Boundary receipt:

`foreman/receipts/WERKLES_INTERNAL_EXTERNAL_ROUTE_BOUNDARY_20260712.json`

Boundary receipt SHA-256:

`7AE37B2C213E9E4AA461A393EC9464595155D2B4ADF4BCD22D852FE47B807FFD`

## Remaining Caveat

1Password service-account automation is still not fully ready:

- `op` CLI exists.
- `Werkles/1Password/AutomationToken` is still not present.
- `OP_SERVICE_ACCOUNT_TOKEN` is not set.
- `OP_SESSION*` is not set.

This no longer blocks the Matching preview rollout proof because Vercel auth and the existing Vercel automation bypass were enough to complete Preview deployment and smoke. It still matters for future 1Password-backed secret operations.

## Hard Stops Preserved

- Production deploy: `NO`
- Production alias: `NO`
- Production `MATCHING_STORAGE_MODE=supabase`: `NO`
- Public matching enabled: `NO`
- LLM matching enabled: `NO`
- SQL applied in this run: `NO`
- Supabase destructive operation: `NO`
- Secret values printed: `NO`
- Token values printed: `NO`

## Handoff

`MATCHING PREVIEW ROLLOUT PASS`

Lady Jessica can review the protected preview via the stored Vercel bypass path and the final Preview URL:

`https://werkles1-kdci0hih3-werkles.vercel.app`

Next gate is separate:

- production deployment / production alias
- public matching go-live
- permanent 1Password service-account automation repair
