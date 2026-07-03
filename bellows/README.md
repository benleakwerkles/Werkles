# Bellows

Local asset-delivery infrastructure for the Werkles image pipeline.

Bellows sits downstream of **Ghost Forge** (generation on Render + Replicate). It accepts forge job results, validates payloads, stores assets locally or in Supabase, and exposes a dry-run path for local development without paid calls.

## Status

Infrastructure scaffold only. Do not run against production providers until human gates are cleared (secrets, billing, deploy, Supabase schema).

## Layout

```
bellows/
  src/
    index.js          CLI entry: health + dry-run
    config.js         Env loading and validation
    health.js         Health check helpers
    jobs/             Job types and local queue
    storage/          Local filesystem adapter (+ Supabase stub)
    forge/            Ghost Forge client stub (no network by default)
  scripts/
    dry-run.js        End-to-end local proof without external calls
```

## Commands

```bash
cd bellows
npm install
npm run health
npm run dry-run
```

## Environment

Copy `.env.example` to `.env` for local overrides. No secrets are required for dry-run mode.

## Human gates still required

- Replicate / Render / Supabase credentials
- Deploy to Render or other host
- SQL, schema, RLS, or storage bucket creation
- Production asset writes

## Related

- Ghost Forge: generation worker (not in this repo yet)
- Werkles product: static prototype at repo root
