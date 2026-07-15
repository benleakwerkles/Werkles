# Werkles Matching Production Deploy Receipt

Status: `COMPLETED__PRODUCTION_DEPLOY_AND_ACCEPTANCE_PASS`

Timestamp: `2026-07-13T20:24:23-04:00`  
Machine: `Betsy`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
Approved deploy commit: `76fd30ef30bbe764613dc55326509f92a59f017d`

## Human Gate

Ben's exact approval received in chat:

```text
Approved
```

The approval was recorded in `foreman/gates/APPROVAL_LOG.md` before production mutation.

## Production Environment

- Vercel project: `werkles/werkles1`
- Production `MATCHING_STORAGE_MODE`: set to `supabase`
- Secret values printed: `NO`
- Public matching flag: `OFF`
- LLM matching flag: `OFF`

## Deployment

- Deployment id: `dpl_8RBL4NA2dfKZLpLL3RG1qM4iNp8x`
- Deployment URL: `https://werkles1-9bww1nn4f-werkles.vercel.app`
- Production alias: `https://werkles.com`
- Vercel state: `READY`
- Build: `PASS`
- Type validation during build: `PASS`
- Deployment source: clean detached worktree pinned to `76fd30e`
- Canonical dirty working tree included in deploy: `NO`

## Live Smoke

Three production Matching writes and semantic assertions passed:

| Scenario | HTTP | Expected top path | Actual top path | Shadow run id | Result |
|---|---:|---|---|---|---:|
| `capital_partner` | 200 | `verify_proof` | `verify_proof` | `shadow_20260714002358_0b3af304` | PASS |
| `job_change` | 200 | `find_better_job` | `find_better_job` | `shadow_20260714002359_7549b790` | PASS |
| `training_not_partner` | 200 | `get_training` | `get_training` | `shadow_20260714002400_983ee4ca` | PASS |

Production root alias returned HTTP `200`.

## Acceptance Blocker

`https://werkles.com/operator/matching/shadow` returned HTTP `404`.

This is consistent with the deployed production middleware, which intentionally denies internal `/operator/**` routes in production. The older smoke runner still requires that operator page to contain its expected copy, so it returned overall `FAIL` despite all three live Matching writes and semantic assertions passing.

No boundary was weakened and no second deployment was attempted.

## Hard Stops Preserved

- Public matching enabled: `NO`
- LLM matching enabled: `NO`
- Production SQL/schema mutation in this run: `NO`
- Production data mutation beyond the three authorized smoke intakes: `NO`
- Secret values printed: `NO`
- Unrelated dirty-tree files deployed: `NO`

## Required Follow-up Decision

Choose and approve one consistent acceptance model before closing the production gate:

1. Keep the production operator boundary and update the production smoke to accept HTTP `404` for `/operator/matching/shadow`, using a protected non-production operator page for readback; or
2. Explicitly approve a new authenticated production operator-access design. Do not expose `/operator/**` publicly.

Until then:

```text
BLOCKER: MATCHING_PRODUCTION_OPERATOR_READBACK_BOUNDARY_CONFLICT
```

## VPG Resolution — 2026-07-14

Ben issued `V, P, G.` in the active production-acceptance lane.

The smoke contract was corrected without weakening middleware:

- `werkles.com` and `www.werkles.com` now require the operator probe to return HTTP `404`.
- Localhost and protected Preview still require the operator page to return HTTP `200` with expected copy.
- An explicit `WERKLES_OPERATOR_PAGE_EXPECTATION=visible|denied` override is available for nonstandard origins; invalid values fail closed.

Preparation proof:

- smoke script syntax: `PASS`
- route-audience boundary matrix: `PASS`
- TypeScript: `PASS`

Final bounded production smoke:

| Scenario | HTTP | Expected top path | Actual top path | Shadow run id | Result |
|---|---:|---|---|---|---:|
| `capital_partner` | 200 | `verify_proof` | `verify_proof` | `shadow_20260714041930_9c17b803` | PASS |
| `job_change` | 200 | `find_better_job` | `find_better_job` | `shadow_20260714041931_02e2d9b5` | PASS |
| `training_not_partner` | 200 | `get_training` | `get_training` | `shadow_20260714041932_5d29e7d5` | PASS |
| production operator boundary | 404 | denied | denied | n/a | PASS |

Final smoke receipt:

`foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_20260714.json`

No second deployment or Production environment mutation was required.

```text
COMPLETED — MATCHING SHADOW PRODUCTION DEPLOY
COMMIT: 76fd30e
PUBLIC_MATCHING: OFF
LLM_MATCHING: OFF
```
