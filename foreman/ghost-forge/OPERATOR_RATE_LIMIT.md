# Ghost Forge — hourly batch cap (operator)

**Not a human gate.** This is the worker API rate limit (`MAX_BATCH_REQUESTS_PER_HOUR`), separate from Gate 05 PAUSE and from page building on localhost.

## What happened

- Worker: `ghost-forge-worker/server.mjs` → `enforceBatchRequestRateLimit()` (rolling 1-hour window, in-memory).
- Default cap: `MAX_BATCH_REQUESTS_PER_HOUR` (10 on code default; Render should use 12 per `ghost-forge-worker/.env.example`).
- Batch 1 (7) + Batch 2 (5 rapid submits) can hit 429 in the same hour.
- A prior Cursor agent **slept 35 minutes** in shell to wait for the window — that is **not** required and **not** queued in repo files.

## Grey overlay confusion

| Surface | Behavior |
|---------|----------|
| **Foreman Control Panel** (`http://localhost:4317`) | `#modal` grey backdrop when showing gate/budget text — **informational**, not failure. Now lighter + click-outside dismiss. |
| **GimpDash** | Section on Foreman home (`/#gimpdash`) — no rate-limit overlay. |
| **Cursor long shell sleep** | IDE can look stuck/greyed while a background `Start-Sleep` runs — cancel terminal if you did not ask for a wait. |

## Page building — no wait

**Gate 05 PAUSE** stops Ghost Forge **spend**. It does **not** block:

- `npm run dev` / localhost preview (3000 or 3002 if you set `PORT=3002`)
- Homepage / component work with existing draft assets

## Run next batch immediately (operator)

1. **Check cap:** `GET /diagnostics/rate-limit` (auth: `GHOST_FORGE_API_KEY`).
2. **Lift cap (Render):** set env `GHOST_FORGE_SKIP_RATE_LIMIT=1` → redeploy or restart service.
3. **Optional reset** (only when skip env is on): `POST /diagnostics/rate-limit/reset`.
4. **Run script with operator GO** (after lift or window clear):

```powershell
cd C:\Users\BenLeak\github\Werkles
.\scripts\foreman\ghost-forge-render-batch-2.ps1 -ShotIds "icon-lane-spark-ember" -Force
```

Scripts **fail fast on 429** — they do not auto-queue or auto-sleep. You decide when to retry.

## Quick clear without skip env

Restart the Render Ghost Forge service — clears the in-memory window (does not raise the hourly cap).

## No queue files

There is no batch queue state file in repo. Partial progress is in `foreman/ghost-forge/*RESULTS*` and run logs only.
