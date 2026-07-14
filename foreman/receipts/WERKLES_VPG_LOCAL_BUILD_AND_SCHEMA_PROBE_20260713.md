# Werkles VPG Local Build And Schema Probe Receipt

Status: `LOCAL_BUILD_GREEN__LIVE_SCHEMA_PROBE_BLOCKED_AUTH`

Machine: `Betsy`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
HEAD: `6790477`  
Date: `2026-07-13`

## Scope

User requested return to Werkles VPG while Lady Jessica is still locked out.

This receipt separates two truths that must not be collapsed:

- Local Werkles code verification is green.
- Current live Supabase table verification from this seat is blocked by auth, not proven pass or proven fail.

## Current Auth Posture

Read-only auth-path check:

| Check | Result |
|---|---:|
| `C:\Users\Ben Leak\.supabase\access-token` | `MISSING` |
| `SUPABASE_ACCESS_TOKEN` environment variable | `MISSING` |
| `.supabase\config.toml` | `MISSING` |
| `supabase\config.toml` | `MISSING` |
| `foreman\gates\werkles-vercel-tier-a.env.oprefs` | `PRESENT` |
| `op` CLI | `AVAILABLE` |

Earlier in this VPG pass, the service-role PostgREST probe through `op run --env-file=foreman\gates\werkles-vercel-tier-a.env.oprefs` did not return table evidence before timeout. That is recorded as an auth/1Password blockage, not as a database-table result.

Current live schema verdict:

`BLOCKED_PROBE_AUTH`

No current claim is made that `public.discovery_intakes` or `public.matching_shadow_runs` are present or absent from the live Supabase project.

## Historical Context Held Separately

An older repo receipt exists:

`foreman/receipts/WERKLES_MATCHING_SCHEMA_APPLIED_20260712.md`

That receipt claims:

- target project ref `ltixqticdtvztjcqmtjn`
- migration file `supabase/migrations/00004_matching_shadow_persistence.sql`
- SQL-editor path
- independent `information_schema.tables` verification of both `discovery_intakes` and `matching_shadow_runs`

This 2026-07-13 VPG receipt does not invalidate that older receipt. It only says this current seat cannot independently re-probe the live tables until an auth path exists.

## Migration File Custody

File:

`supabase/migrations/00004_matching_shadow_persistence.sql`

SHA-256:

`8EBB3B012A4DFE8A696EFD537CECF0F38E5122B26865A358F975570FD464442F`

## Local Verification

| Gate | Command | Result |
|---|---|---:|
| TypeScript typecheck | `npm.cmd run typecheck` | `PASS` |
| Matching storage-mode contract smoke | `node scripts/foreman/test-matching-storage-mode.Inner.mjs` | `PASS` |
| Production build | `npm.cmd run build` | `PASS` |

Matching storage-mode smoke output:

```json
{"ok":true,"schema":"WERKLES_MATCHING_STORAGE_MODE_V1","checks":4}
```

Production build output summary:

- Next.js `15.5.18`
- optimized production build compiled successfully
- lint and type validation passed
- generated static pages: `84/84`
- middleware emitted
- no build errors

## Safety Boundary

- SQL applied: `NO`
- Supabase migration run: `NO`
- Deployment performed: `NO`
- Production storage-mode changed: `NO`
- Public matching enabled: `NO`
- Secrets printed: `NO`
- Tokens printed: `NO`
- Existing dirty worktree changes reverted: `NO`

## VPG Return

`VPG_LOCAL_GREEN`

`VPG_SCHEMA_PROBE_BLOCKED_AUTH`

`NO_SQL_NO_DEPLOY_NO_SECRET_PRINT`

## Next Unblock

One of these must exist before current live schema verification can be treated as real:

- visible Betsy `npx supabase login` OAuth completed, followed by a read-only table probe
- restored noninteractive 1Password automation token/session that allows the service-role probe to run without a desktop prompt
- another verified live path that can query the target Supabase project without exposing secrets

Once the probe returns both `public.discovery_intakes` and `public.matching_shadow_runs`, the next gated step is preview rollout verification, not production/public enablement.
