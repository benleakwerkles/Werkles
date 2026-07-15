# Tier 1 Gate — Matching Shadow Production Deploy

Status: `COMPLETED__PRODUCTION_DEPLOY_AND_ACCEPTANCE_PASS`  
Parent chain: Option B → schema apply APPROVED → preview rollout PASS  
Branch: `maker/site-g-20260703` @ `76fd30e`  
Confidence: `HIGH` on preview evidence; `MEDIUM` on production alias traffic until live smoke

## Decision

Promote matching shadow (durable Supabase custody) to **werkles.com production**?

```text
APPROVE MATCHING SHADOW PRODUCTION DEPLOY
```

Until approved: **do not** production deploy, alias, or set Production `MATCHING_STORAGE_MODE`.

## What would happen if approved (mechanical sequence)

1. Set `MATCHING_STORAGE_MODE=supabase` on Vercel **Production** (preview already set)
2. Deploy pushed commit `76fd30e` from `maker/site-g-20260703` to production (`vercel deploy --prod` or alias an existing ready build proven to contain that commit)
3. Live smoke against `https://werkles.com` (protection bypass if needed)
4. File receipt: `foreman/receipts/WERKLES_MATCHING_PRODUCTION_DEPLOY_<date>.md`
5. **Hold** — public matching remains OFF

## Pre-flight evidence (already proven)

| Check | Result | Evidence |
|-------|--------|----------|
| Schema tables live | PASS | `discovery_intakes`, `matching_shadow_runs` → `ok` |
| Schema apply gate | APPROVED | `APPROVAL_LOG` 2026-07-12 |
| Data policy V0 | APPROVED | `APPROVAL_LOG` 2026-07-12 |
| Preview `MATCHING_STORAGE_MODE=supabase` | set | Vercel Preview |
| Preview smoke 7/7 | PASS | `WERKLES_MATCHING_PREVIEW_ROLLOUT_20260713.md` |
| Golden paths | PASS | verify_proof / find_better_job / get_training |
| Production `MATCHING_STORAGE_MODE` | **not set** | env ls (intentional until this gate) |
| Public matching flag | OFF | `lib/matching/feature-flags.ts` |
| LLM matching flag | OFF | same |

Preview URLs (reference):

- `https://werkles1-k0actja5s-werkles.vercel.app`
- `https://werkles1-kdci0hih3-werkles.vercel.app` (documented PASS smoke)

## Blast radius

- `/api/discovery/intake` and `/api/bellows/intake` write durable custody on production
- `/operator/matching/shadow` becomes live on werkles.com (operator surface)
- Personal data (intake payloads) lands in production Supabase tables already created
- Production serverless cold starts no longer lose shadow history (durable mode)
- Does **not** flip public recommendations or LLM assist

## Unknowns / residual risk

- Production may still be on an older deployment without matching routes (historical 404/500) — deploy replaces that
- Production deploy protection / edge config may differ from Preview
- Retention cron / member deletion automation still not built (policy APPROVED; automation gated)
- Dirty worktree on Betsy — production deploy must use allowlisted matching commit / Vercel CLI of known HEAD, not accidental local debris

## Budget

No new paid vendor spend. Existing Vercel + Supabase project only.

## Lane status

Werkles.com / G matching shadow only. Harvey out of scope. Public go-live and LLM remain separate gates.

## What remains blocked after this gate (even if APPROVED)

- `APPROVE MATCHING AUTONOMOUS GO-LIVE` (public flip)
- LLM matching enable
- Retention/deletion automation
- Speaker Charter V1 ratification

## Reject / patch

```text
REJECT MATCHING SHADOW PRODUCTION DEPLOY
```

```text
PATCH MATCHING SHADOW PRODUCTION DEPLOY: <instructions>
```

## Prohibited without this phrase

- `vercel deploy --prod` for matching
- Alias preview → werkles.com
- Production env `MATCHING_STORAGE_MODE=supabase`
- Any public recommendation surface change

## Execution result

Ben approved this gate with `Approved` on 2026-07-13.

- Production deployment `dpl_8RBL4NA2dfKZLpLL3RG1qM4iNp8x`: `READY`
- `https://werkles.com` alias: live, HTTP `200`
- Three live Matching write and semantic scenarios: `PASS`
- Production `/operator/matching/shadow`: HTTP `404`, consistent with the internal-route middleware
- Overall legacy smoke: `FAIL` because it expects the production operator page to be visible

Current receipt:

`foreman/receipts/WERKLES_MATCHING_PRODUCTION_DEPLOY_20260713.md`

Current stop:

`BLOCKER: MATCHING_PRODUCTION_OPERATOR_READBACK_BOUNDARY_CONFLICT`

Resolved 2026-07-14 by correcting the smoke contract to require the intended production HTTP `404` while preserving visible operator-page checks on localhost and protected Preview. Final production smoke: `PASS`.

Final smoke receipt:

`foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_20260714.json`
