# Werkles Autonomous Matching Go-Live Receipt

Status: `COMPLETED__AUTONOMOUS_MATCHING_PUBLIC_GO_LIVE`

Timestamp: `2026-07-16T13:42:00-04:00`  
Machine: `Betsy`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`

## Human Gate

Ben's exact approval (recorded in `foreman/gates/APPROVAL_LOG.md`):

```text
P, G. Autonomous Matching (reverse the name) i sapproved/Go
```

## Code Commit

- Commit: `92a30814a244fd99a3df0fd334103f984431a76c`
- Message: Enable Autonomous Matching public go-live.

## Feature Flags (code)

| Flag | Value |
|------|-------|
| `MATCHING_AUTONOMOUS_PUBLIC` | `true` |
| `MATCHING_LLM_TRANSLATE_ENABLED` | `false` |

LLM matching: **OFF** (no enablement in this run).

## Production Deployment

- Vercel project: `werkles/werkles1`
- Deployment id: `dpl_9u8Gn4F7r8qS38ZGkpn3uevNFqRi`
- Deployment URL: `https://werkles1-3z6a4fvfa-werkles.vercel.app`
- Production alias: `https://werkles.com`
- Vercel state: `READY`
- Deploy source: clean detached worktree @ `92a3081` (`C:\wkr-am-golive`, removed after deploy)
- Canonical dirty tree deployed: `NO`

Note: First CLI deploy without `--project werkles1` created an unrelated Vercel project `werkles/wkr-am-golive` (`dpl_7dAxqR9FwiWTK5gtzs69daZ8UKbU`, alias `wkr-am-golive.vercel.app`). Production go-live used a second deploy with `--project werkles1` to `werkles.com`.

## Live Smoke (`https://werkles.com`)

Overall: **PASS**  
Receipt JSON: `foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_20260716.json`

| Scenario | HTTP | Expected top path | Actual top path | Shadow run id | matching_mode | Result |
|---|---:|---|---|---|---|---|
| `capital_partner` | 200 | `verify_proof` | `verify_proof` | `shadow_20260716174155_6536e25d` | `autonomous_matching` | PASS |
| `job_change` | 200 | `find_better_job` | `find_better_job` | `shadow_20260716174156_bad2e038` | `autonomous_matching` | PASS |
| `training_not_partner` | 200 | `get_training` | `get_training` | `shadow_20260716174157_b4bb230d` | `autonomous_matching` | PASS |
| `operator_shadow_page` | — | production boundary denied | denied as expected | — | — | PASS |

## Residual Risk (accepted at gate)

- Member-facing export UX and automated deletion job are **not** built; policy approved, execution gated.
- Golden-path smoke only; broader intake coverage remains incremental.

## Hard Stops Preserved

- LLM matching enabled: **NO**
- Production SQL/schema mutation in this run: **NO**
- Secret values printed: **NO**
- Unrelated dirty-tree files in go-live commit: **NO**
