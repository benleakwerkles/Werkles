# Tier 1 Gate — Matching Durable Schema Apply

Status: `AWAITING BEN DECISION`  
Parent gate: `GATE-matching-shadow-production-path-20260710` — **Option B approved**  
Branch: `maker/site-g-20260703` @ `056c1c2`  
Migration: `supabase/migrations/00004_matching_shadow_persistence.sql`

## Decision

Apply durable matching custody tables to Supabase?

```text
APPROVE MATCHING DURABLE SCHEMA APPLY
```

Until approved: **do not run** migration against production or linked remote.

## What the migration creates

| Object | Purpose |
|--------|---------|
| `public.discovery_intakes` | Normalized discovery/concierge intake JSONB custody |
| `public.matching_shadow_runs` | Append-only shadow run payloads + engine version |
| RLS policies | Authenticated operator read via existing `admin_users` |
| Indexes | `received_at`, `created_at`, `intake_id` |

Service-role server writes bypass RLS (existing `getSupabaseService()` pattern).

## Code already wired (post-056c1c2)

| Env | Behavior |
|-----|----------|
| `MATCHING_STORAGE_MODE=file` (default) | Local JSONL — unchanged |
| `MATCHING_STORAGE_MODE=supabase` | Writes `discovery_intakes` + `matching_shadow_runs` |

No silent fallback between modes.

## Local evidence

- Typecheck: PASS
- File-mode semantic smoke: 7/7 (when dev server running)
- Adapter modules: `shadow-store.ts`, `intake-custody.ts`, `storage-mode.ts`
- Migration file matches review draft `WERKLES_MATCHING_SUPABASE_SCHEMA_DRAFT_V0_20260710.sql`

## Blast radius

- New tables only — no changes to existing membership/billing tables
- Personal data in intake payloads (name, contact, situation text)
- Operator read surface expands to Supabase-backed shadow history
- Retention/deletion policy **not** defined in migration — requires follow-up decision

## Open questions (decide before or with apply)

1. Retention duration for intake payloads
2. Export/deletion rights for members
3. Whether `upsert` on `run_id` is acceptable vs strict append-only reject
4. Preview vs production apply order

## After apply (mechanical sequence)

1. Ben approves with phrase above → record in `APPROVAL_LOG.md`
2. Apply `00004_matching_shadow_persistence.sql` via Supabase dashboard or approved CLI path
3. Set `MATCHING_STORAGE_MODE=supabase` on Vercel **preview** first
4. Deploy matching branch to preview
5. Live smoke on preview origin
6. Separate deploy gate for production

## Reject / patch

```text
REJECT MATCHING DURABLE SCHEMA APPLY
```

```text
PATCH MATCHING DURABLE SCHEMA GATE: <instructions>
```

## Prohibited without further gates

- Production deploy
- Public matching flip
- LLM matching enable
- Retention cron / deletion automation
