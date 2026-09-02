# TO HEIMERDINKER — Matching Storage Contract V/P/G Cycle 5

Packet: `TO_HEIMERDINKER_MATCHING_STORAGE_CONTRACT_VPG5_20260710`  
Repo: `C:\Users\Ben Leak\github\Werkles`  
Branch: `maker/site-g-20260703`

## Mission

Define a storage contract that supports local JSONL and durable Supabase modes without silent fallback.

## Required behavior

- Default local development mode remains file-backed.
- `MATCHING_STORAGE_MODE=supabase` uses the existing server-side service client.
- Missing Supabase configuration, table errors, or write/read failures throw truthful errors.
- Production durable mode must never silently fall back to `/tmp`.
- Every run reports its actual receipt/storage path.
- Public and LLM matching remain OFF.

## Collision boundary

Other matching files are dirty. Allowed implementation files are limited to:

- new storage adapter module
- `lib/matching/shadow-storage.ts`
- `lib/matching/shadow-pipeline.ts`
- focused receipts/tests

Do not edit `types.ts`, signals, score, delivery, operator UI, or recommendation mapping.

## Verification

Root typecheck, production build, default-mode semantic smoke 7/7, and a no-secret configuration-selection check.

