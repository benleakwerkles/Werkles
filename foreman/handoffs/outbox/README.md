# Handoffs outbox

Status: operator dispatch lane  
Doctrine: **stops before Send**

## Active packets

Generate fresh packets with Crew Dispatch Console v2 — do not rely on stale files in this folder.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\foreman\crew-dispatch-console.ps1 -Action Generate -Mission crew-checkin -Role petra
```

## STALE / DO NOT SEND (pre 2026-05-30 cockpit sync)

| File | Reason |
|------|--------|
| `TO_PETRA_COMPTROLLER_CREW_CHECKIN_v0.1.md` | Predates morale deploy on `60f74c8` |
| `TO_PETRA_CREW_CHECKIN_v2_20260530-0059.md` | Generated from stale NEXT_ACTION |
| `PETRA_PASTE_BLOCK.txt` | Until regenerated after sync |

Regenerate after `foreman/CURRENT_STATE.md` and `foreman/NEXT_ACTION.md` are synced.

## Outbox lifecycle (crew relay)

| Folder | Purpose |
|--------|---------|
| `outbox/` (this folder) | **Unsent** packets — dashboard default view |
| `outbox/sent/` | Mark-sent packets (timestamp prefix) |
| `outbox/archive/` | Sent packets older than 30 days |

```powershell
node foreman/crew-dispatch/crew-response-intake.mjs mark-sent TO_PETRA_....md
node foreman/crew-dispatch/crew-response-intake.mjs list-outbox
node foreman/crew-dispatch/crew-response-intake.mjs list-outbox --sent
node foreman/crew-dispatch/crew-response-intake.mjs archive-sent
```

**Do not send stale packets** — mark-sent rejects if relay hashes differ from live cockpit.

See `foreman/crew-dispatch/CREW_RELAY_README.md`.

## Reference packets (historical)

| File | Notes |
|------|-------|
| `TO_CODEX_GHOST_FORGE_ICONS_FIRST_v0.2.md` | Gates 01–04 complete; Gate 05 paused |
| `TO_CURSOR_CLAUDE_DRAFT_SITE_UI_PASS_v0.1.md` | UI pass largely complete |
| `TO_CLAUDE_*` | Pre-v0.6 polish — superseded by morale deploy |

## Launcher index

See `OPEN_HANDOFF_HERE.md` and `foreman/crew-dispatch-console/DISPATCH_CONSOLE_v2.md`.
