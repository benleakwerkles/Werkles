# TO: Petra / Comptroller
# FROM: Maker @ Betsy
# RE: MISSION — SoleDash Ambient + Command Split
# DATE: 2026-06-12

## Ender response

Structural change applied: **default is ambient porch; command opens on action.**

## What became AMBIENT (live-in porch)

- **Reality strip** — large LIVE / PARTIAL LIVE / MOCK color block (no prose banner)
- **Primary monitor doctrine** — THIS SCREEN · WHAT NEEDS BEN / other monitors instrumentation only
- **What needs Ben hero** — frontier code + title + posture (chair-distance type)
- **Counts row** — queue · receipts · blocker (big numbers)
- **Fleet silhouettes** — color dot + initial only (B/D/S/S), no four detail cards
- **Mission one-liner**
- **Phase 0 food** — last leave-points from localStorage
- **Open Command** — single big entry to command layer

## What became COMMAND (on action)

- **One frontier** — guarded YEA (confirm step) + NAY
- **Receipt / action rail** — compact status line
- **Current blocker**
- **Receipt search + Receipt Center**
- **Frontier comparison + queue visibility + operator override**
- **Operator Chat**
- **Collapsed tiers** — churn + gate detail only
- **Return to porch** → leave-point tracker

## Always visible (both layers)

**Pivot bar** — fixed bottom, horizontal scroll, 8 buttons:

1. Continue Current Frontier
2. Switch Frontier
3. Workstation Uniformization
4. Spanzee Node
5. Kill Test
6. Needs Research
7. Human Reality
8. New Direction

## 60% capacity rule

- Fewer words on ambient
- Bigger pivot + Open Command + YEA/NAY targets
- LIVE / MOCK obvious at ambient strip and command frontier
- YEA requires confirm before dispatch
- Receipts visible in command rail + center

## Leave-point tracker

On **Return to porch**: “Why did Ben leave SoleDash?” with quick reasons + optional note → stored in `localStorage` → shown as **Phase 0 food** on ambient.

## Preview

http://localhost:3000/soledash

Verified: ambient default · Open Command · Return to porch · leave-point → Phase 0 food · pivot bar fixed bottom.

## Files changed

- `components/soledash/ambient-command-layers.tsx` (new)
- `lib/soledash/megawork-home/leave-points.ts` (new)
- `components/soledash/decision-surface.tsx` — ambient/command split for home mode
- `components/soledash/megawork-home-panels.tsx` — 8 pivot buttons
- `app/soledash/soledash.css` — ambient, command, doctrine, guard, pivot-always styles

## Screenshots

- Ambient porch: `soledash-ambient-v2.png` (browser capture)
- Command layer: `soledash-command-layer.png` (browser capture)

## Success

Ben can **live in** ambient all day; command only when acting. Pivots never hunted. Every porch exit feeds Phase 0.
