# Matching Durable Persistence — Operator Decision B

| Field | Value |
|-------|-------|
| **Decision** | `REQUIRE MATCHING DURABLE PERSISTENCE BEFORE DEPLOY` |
| **Recorded** | `foreman/gates/APPROVAL_LOG.md` @ 2026-07-10 |
| **Effect** | Temporary `/tmp` shadow deploy **rejected** |

## Maker wired (this session)

| Component | Path |
|-----------|------|
| Storage mode | `lib/matching/storage-mode.ts` — `MATCHING_STORAGE_MODE=file\|supabase` |
| Shadow adapter | `lib/matching/shadow-store.ts` — file + Supabase, no silent fallback |
| Pipeline wiring | `lib/matching/shadow-storage.ts`, `shadow-pipeline.ts` |
| Discovery custody | `lib/discovery/intake-custody.ts` |
| Migration (not applied) | `supabase/migrations/00004_matching_shadow_persistence.sql` |

**Default:** `file` (localhost unchanged). **Production target:** `MATCHING_STORAGE_MODE=supabase` after schema apply.

## Next human gate

```text
APPROVE MATCHING DURABLE SCHEMA APPLY
```

Then:

1. Apply `00004_matching_shadow_persistence.sql` to Supabase
2. Set `MATCHING_STORAGE_MODE=supabase` on Vercel preview
3. Live smoke on werkles.com
4. Separate deploy gate for matching branch

## Still blocked

- Deploy without durable custody
- Public matching flip
- LLM matching layer
