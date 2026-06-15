# SoleDash OS Reframe v1 — Implementation Plan

Authority: `foreman/reviews/ENDER_HUMAN_EXPERIENCE_REVIEW_SOLEDASH_v1.md`  
Status: **prototype shipped** on `/soledash` (v1 shell)

---

## Architecture

```
┌─────────────────────────────────────────┐
│  FRONTIER (one operable decision)       │
│  · what / why / impact / risk / time      │
│  · YEA · NAY · DEFER · MORE INFO         │
│  · transport gap (only when blocked)     │
└─────────────────────────────────────────┘
         ↓ after action → next frontier
┌─────────────────────────────────────────┐
│  INSTRUMENTATION (collapsed <details>)  │
│  · recent decisions · queue depth         │
│  · snoozed · in-flight · blocked          │
│  · machine readback · freeform override   │
└─────────────────────────────────────────┘
```

## Module map

| Layer | Path | Role |
|-------|------|------|
| OS view builder | `lib/soledash/command-surface/os-view.ts` | Picks frontier, queue depth, transport gap |
| OS UI | `components/soledash/sole-dash-os.tsx` | Frontier + instrumentation prototype |
| Decision API | `/api/soledash/v1/decide` | Unchanged — frontier calls same endpoints |
| Legacy board | `components/soledash/command-surface.tsx` | Preserved — swap import to revert |

## Frontier selection (priority)

Sorted by Skybro / Phase 0 queue (`lib/soledash/command-surface/frontier-priority.ts`):

1. `mule_elimination` → unblockers → human_gate → open_mission → roadmap
2. Higher risk breaks ties within same tier
3. Else human_gate work item · posture blocker · idle

Context packet: `foreman/soledash/MASHREEN_SOLEDASH_OS_THREAD.md`

## Transport gap rules

Show gap panel when:

- External cousin dispatch → auto-send not wired; exact manual step
- `TRUE_HUMAN_GATE` on YEA → gate reason, no fake dispatch
- Dispatch failed → blocker text from approval classifier

Hide gap when local MAKER/DINK YEA succeeds with no manual step.

## v1 prototype scope (done)

- [x] Single frontier replaces six-card grid
- [x] Queue depth hint (“N more after this”) not ticket list
- [x] Instrumentation collapsed
- [x] Status labels removed from card face
- [x] Post-action behavior advances frontier via refresh
- [x] Transport gap panel on frontier

## v2 follow-ups

- [ ] Frontier from `NEXT_ACTION.md` when no catalog proposals remain
- [ ] Push notification / Foreman pin “frontier changed”
- [ ] Instrumentation sparkline (decisions/day) — telemetry only
- [ ] Retire `command-surface.tsx` after Ben sign-off

## Rollback

In `app/soledash/page.tsx`, import `CommandSurface` + `buildCommandSurfaceView` instead of `SoleDashOs` + `buildOsSurfaceView`.
