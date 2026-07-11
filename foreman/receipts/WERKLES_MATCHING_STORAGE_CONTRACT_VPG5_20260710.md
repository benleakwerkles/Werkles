# Matching Storage Contract — V/P/G Cycle 5 Receipt

Machine: BETSY  
Execution context: `LOCAL_SALLY_WINDOWS`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`  
HEAD at start: `1499d4b`

## Packets executed

- `foreman/handoffs/outbox/TO_HEIMERDINKER_MATCHING_STORAGE_CONTRACT_VPG5_20260710.md`
- `foreman/handoffs/outbox/TO_LADY_JESSICA_MATCHING_SUPABASE_SCHEMA_DRAFT_VPG5_20260710.md`

## Intended implementation and final-state collision

- Added `lib/matching/storage-mode.ts` as the pure configuration parser.
- Added `lib/matching/shadow-store.ts` with explicit file and Supabase adapters.
- Added inert review-only SQL at `foreman/reviews/WERKLES_MATCHING_SUPABASE_SCHEMA_DRAFT_V0_20260710.sql`.

The adapter wiring patch to `lib/matching/shadow-storage.ts` and `lib/matching/shadow-pipeline.ts` was overwritten by a concurrent workspace writer before final verification. Their final on-disk contents remain the pre-adapter file implementation. The new adapter modules are therefore currently unreferenced scaffolding, not integrated behavior.

No active Supabase migration was created or applied.

## Contract behavior proven in isolation

- Default mode: `file`
- Durable mode: `supabase`
- Invalid mode: rejected
- The isolated Supabase adapter is written to throw on read/write errors and contains no silent fallback, but this is not yet exercised through the application pipeline.
- Receipt paths:
  - file: `data/matching/shadow-runs.jsonl`
  - Supabase: `supabase:public.matching_shadow_runs`

## Verification

### Configuration selection

```text
default: file
file: file
supabase: supabase
fileReceipt: data/matching/shadow-runs.jsonl
supabaseReceipt: supabase:public.matching_shadow_runs
invalid: rejected
```

No environment values or secrets were printed.

### Typecheck

`npm.cmd run typecheck`: `PASS`, exit 0.

### Semantic smoke — existing file pipeline

`PASS — 7/7`

- Capital: `shadow_20260711030800_bbdb159b`, top `verify_proof`
- Job: `shadow_20260711030800_df9ff255`, top `find_better_job`
- Training: `shadow_20260711030800_dc84f562`, top `get_training`
- Partner suppression: PASS
- Disqualification dedupe: PASS
- Operator shadow page: PASS

This smoke exercised the existing directly file-backed pipeline, not `shadow-store.ts`, because the wiring changes were overwritten.

### Production build

`PARTIAL / BLOCKED_GENERATED_ARTIFACT_RACE`

Attempt 1 compiled and typechecked, then a missing webpack cache pack caused `/_document` page resolution failure.

Attempt 2 removed only the verified generated directory `C:\Users\Ben Leak\github\Werkles\.next`, compiled and typechecked, then failed because `.next/server/pages-manifest.json` disappeared during page-data collection.

Inspection found orphaned Next build processes still using the same `.next` directory. They were terminated. The two-attempt repair limit prevented a third build in this cycle. Localhost was restored on port 3000 and smoke passed afterward.

This is a build-process/cached-artifact blocker, not a TypeScript or semantic matching failure. A later clean build must still pass before deploy review advances.

### Concurrent writer

Final Git/on-disk verification showed no changes in `lib/matching/shadow-storage.ts` or `lib/matching/shadow-pipeline.ts`; both had reverted to their prior direct file implementation after the patch was initially accepted. Reapplying over an active writer would risk destroying concurrent matching work, so integration stopped.

## Schema draft boundary

The draft proposes:

- `public.discovery_intakes`
- `public.matching_shadow_runs`
- stable primary identifiers and timestamps
- JSONB normalized/run payloads
- service-role server writes
- authenticated operator reads through existing `admin_users`
- no anonymous read policies

Open human decisions remain retention, deletion/export rights, field separation/encryption, operator-role scope, and upsert versus strict append-only semantics.

## Status

`PARTIAL — CONTRACT SCAFFOLD + SCHEMA DRAFT CREATED; ADAPTER NOT WIRED DUE CONCURRENT WRITER; EXISTING FILE MODE PROVEN; CLEAN BUILD RETRY REQUIRED.`

No SQL, Supabase call, secret read, production request, push, deploy, merge, public flip, or LLM enable occurred.
