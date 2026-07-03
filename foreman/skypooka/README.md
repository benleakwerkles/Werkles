# SkyPooka mobile queues

SkyPooka mobile FIRE/HOLD actions write queue artifacts here. They do **not** send relay traffic from the phone.

- `fire-queue/` — operator requested a handoff to move
- `hold-queue/` — operator requested a hold on a relay card
- `archive/` — completed queue items moved by the drain tool
- `smoke/` — mobile smoke-test screenshots and results
- `QUEUE_LOG.md` — append-only pickup log

## Desk-side pickup (Dink / courier)

```bash
npm run skypooka:queue -- list
npm run skypooka:queue -- ack <id> --by DINK_BETSY
npm run skypooka:queue -- done <id> --note "delivered via courier"
npm run skypooka:queue -- archive
```

Handing the packet to relay courier / Edge Bay remains a separate, human-gated step. The drain tool only tracks pickup state.

## Mobile smoke test

```bash
npm run build && npm run skypooka:smoke        # production server smoke
npm run skypooka:smoke:dev                     # dev-server smoke
node scripts/foreman/skypooka-mobile-smoke.mjs --base-url http://127.0.0.1:3000   # reuse a running server
```

Captures iPhone-viewport screenshots of every SkyPooka route into `smoke/<timestamp>/` with a `SMOKE_RESULT.json` verdict.

