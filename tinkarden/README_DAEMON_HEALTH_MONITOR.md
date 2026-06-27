# Tinkarden Daemon Health Monitor

This folder preserves the Doss-local daemon health surface for review.

## What It Contains

- `ecosystem.config.js` manages the local PM2 process list.
- `nervous_system/brainstem.js` watches local nervous-system files with Chokidar.
- `server/index.js` exposes a small Fastify health API.
- `nervous_system/crawler.js` scans `C:\tinkarden\server\circulation.db` for unassimilated successful receipts and writes Speaker queue candidates.
- `nervous_system/ender_apoptosis.js` runs the filtration cron.
- `nervous_system/daemon_watchdog.js` watches PM2 process health and writes daemon state into `frictional_heat.json`.

## Restore On Doss

From a clean checkout of this branch:

```powershell
Copy-Item -Recurse -Force .\tinkarden\* C:\tinkarden\
Push-Location C:\tinkarden
npm ci
.\node_modules\.bin\pm2.cmd start ecosystem.config.js --update-env
.\node_modules\.bin\pm2.cmd save
Pop-Location
```

## Preview

Open:

```text
http://127.0.0.1:3339/
```

Machine-readable endpoints:

- `http://127.0.0.1:3339/health`
- `http://127.0.0.1:3339/daemon`
- `http://127.0.0.1:3339/friction`

## Current Boundary

This proves a local monitored daemon surface and a GitHub-preserved source copy.

It does not prove:

- Windows startup-service persistence.
- canonical promotion to `origin/main`.
- full Nerdkle life.
- automatic assimilation.

Windows startup persistence remains a Human Gate because it changes machine boot behavior.
