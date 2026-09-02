# Werkles Matching Durable Schema Apply Receipt

Status: `APPLIED`  
Machine: `BETSY`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
HEAD: `6790477`  
Date: 2026-07-12

## Approved authority

- `APPROVE MATCHING DURABLE SCHEMA APPLY` — APPROVED in `foreman/gates/APPROVAL_LOG.md`.
- `approve matching data policy` — APPROVED in `foreman/gates/APPROVAL_LOG.md`.
- Parent Option B durable persistence gate — APPROVED.

## Target proof

- Supabase organization: `Werkles.com`
- Supabase project: `Werkles.com`
- Project ref: `ltixqticdtvztjcqmtjn`
- Vercel production `NEXT_PUBLIC_SUPABASE_URL` project ref: `ltixqticdtvztjcqmtjn`
- Target match: `PASS`
- Temporary Vercel environment file: deleted after in-memory ref comparison

## Migration

- File: `supabase/migrations/00004_matching_shadow_persistence.sql`
- SHA-256: `8EBB3B012A4DFE8A696EFD537CECF0F38E5122B26865A358F975570FD464442F`
- Path used: `supabase_dashboard_sql_editor`
- SQL execution result: `Success. No rows returned`

## Verification

Independent verification query against `information_schema.tables` returned exactly two rows:

| Table | Result |
|---|---|
| `public.discovery_intakes` | `EXISTS` |
| `public.matching_shadow_runs` | `EXISTS` |

Prior `PGRST205` missing-table blocker is cleared.

## Safety boundary

- Secrets printed: `NO`
- Tokens printed or pasted: `NO`
- Operator SQL paste/copy work: `NO`
- Wrong project apply: `NO` — ref matched against Vercel before execution
- Public matching enabled: `NO`
- Production storage-mode change: `NO`
- Deployment performed: `NO`

## Handoff

`MATCHING SCHEMA APPLIED — tables verified. Ready for preview env + deploy.`

Maker/Lady Jessica may proceed with preview rollout runbook Phase 2 only. Production deploy and public matching remain separately gated.
