# Cursor Bellows Infrastructure Result - 2026-05-30

## Outcome
Cursor started Bellows as local asset-delivery infrastructure downstream of Ghost Forge. Scaffold only — no paid calls, deploy, secrets, or Supabase schema work.

## Files Created
- `bellows/README.md`
- `bellows/package.json`
- `bellows/.env.example`
- `bellows/.gitignore`
- `bellows/src/index.js`
- `bellows/src/config.js`
- `bellows/src/health.js`
- `bellows/src/jobs/types.js`
- `bellows/src/jobs/queue.js`
- `bellows/src/storage/local.js`
- `bellows/src/storage/supabase.js` (stub)
- `bellows/src/forge/client.js` (stub)
- `bellows/scripts/dry-run.js`

## What It Does
- **Health**: reports mode, paths, and whether Ghost Forge / Supabase are configured.
- **Ingest**: accepts a forge job id, returns a dry-run completed payload, writes a local asset manifest under `bellows/data/assets/`, and appends to `bellows/data/queue.jsonl`.
- **Stubs**: Supabase adapter and live Ghost Forge client throw until human gates clear.

## Checks
- `npm run check` passed
- `npm run health` passed
- `npm run dry-run` passed (local ingest + queue write)

## Lane Note
Ben explicitly requested Bellows infrastructure. This is outside the original `styles.css`-only Cursor handoff but does not run Bellows against external providers. Recommend recording `bellows/**` ownership in `foreman/LANES.md` (Codex or shared lane).

## Human Gates Still Required
- Ghost Forge live URL + Render deploy
- Replicate / paid generation calls
- Supabase schema, buckets, RLS, service-role key
- Push, merge, deploy, production asset writes

## Next Suggested Slice
1. Codex: add `bellows/**` lane ownership and optional webhook entrypoint from Ghost Forge.
2. Implement Supabase storage adapter after schema gate.
3. Wire Werkles UI to read local asset manifests (optional, separate slice).
