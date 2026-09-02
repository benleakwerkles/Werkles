# Soft live nested Bellows — Production Deploy Receipt

Status: `PASS — NESTED BELLOWS SOFT-LIVE ON WERKLES.COM`  
Completed: `2026-07-24`  
Operator phrase:

```text
APPROVE PRODUCTION DEPLOY NESTED BELLOWS FROM maker/site-g-20260703
```

Execution: LadyJessica@Betsy  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Vercel: `werkles/werkles1` / `werkles.com`

## Approval

Logged in `foreman/gates/APPROVAL_LOG.md` before production mutation.

## Exact deployed source

- Branch tip: `maker/site-g-20260703`
- Commit: `674f3db2dd56a8b131981fb3ea974bc018463fb9`
- Clean worktree: `C:\nb` (detached tip only)
- Canonical dirty Sally tree included: **NO**

## Deploy result

| Field | Value |
|-------|--------|
| Deployment id | `dpl_97jNhHL7o7G5PvM2cUSjbT721uVa` |
| Immutable URL | https://werkles1-3a76w9adq-werkles.vercel.app |
| Inspect | https://vercel.com/werkles/werkles1/97jNhHL7o7G5PvM2cUSjbT721uVa |
| Alias | https://werkles.com |
| State | **READY** |

## Rollback

Prior Production: https://werkles1-5l7giazkq-werkles.vercel.app

## Live smoke

| URL | Status |
|-----|--------|
| https://werkles.com/bellows | **200** |
| https://werkles.com/bellows/intake | **200** |
| https://werkles.com/bellows/recommendations | **200** |
| https://werkles.com/dashboard/crucible | **200** |

## Soft-live boundaries held

| Item | Status |
|------|--------|
| Intake submit open | **NO** — submit control disabled; no intake-open env set |
| HG-4 / HG-5 live money | **NOT** in this deploy |
| LLM matching flip | **NO** |
| FCRA | **NO** |
| Env / secret mutations | **NONE** |
| Push to `main` | **NO** |

## Next (separate phrases)

- Open public intake: `APPROVE OPEN BELLOWS INTAKE SUBMISSION ON WERKLES.COM`
- Live secrets: `APPROVE SECRET ENTRY` (after HG-3 products exist)
- Live checkout: `APPROVE PAID CHECKOUT GO-LIVE`

`COMPLETED`
