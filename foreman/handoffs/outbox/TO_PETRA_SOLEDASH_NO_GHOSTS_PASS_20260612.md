# TO PETRA — SoleDash NO-GHOSTS PASS

**From:** Maker (Cursor) @ LOCAL_SALLY_WINDOWS  
**Date:** 2026-06-12  
**Mission:** SOLEDASH NO-GHOSTS PASS — trustworthy command surface  
**Execution context:** LOCAL_SALLY_WINDOWS · verified at `http://localhost:3000/soledash`

---

## Summary

Replaced the global bottom pivot carousel with a permanent **Operator Bar**, tightened **Ambient vs Command** split, normalized fleet health to **GREEN / YELLOW / RED / UNKNOWN**, and removed or relocated ghost controls.

---

## Files changed

| File | Change |
|------|--------|
| `components/soledash/operator-bar.tsx` | **NEW** — permanent bottom bar (frontier, gates, chat, cousin send, dispatch status) |
| `components/soledash/command-actions.tsx` | **NEW** — command panel: YEA/NAY, route buttons, send packet |
| `lib/soledash/megawork-home/fleet-health.ts` | **NEW** — four-state fleet normalization |
| `app/api/soledash/v1/cousin-dispatch/route.ts` | **NEW** — live outbox dispatch to Maker/Dink/Ender/Bean/Thufir/Skybro |
| `components/soledash/decision-surface.tsx` | Remove PivotBar/handlePivot; wire OperatorBar + CommandActionsPanel |
| `components/soledash/ambient-command-layers.tsx` | Ambient: fleet health dots, active cousins, blocker line |
| `components/soledash/megawork-home-panels.tsx` | FleetRow uses GREEN/YELLOW/RED/UNKNOWN; **PivotBar deleted** |
| `components/soledash/decision-surface-panels.tsx` | Disabled Make Frontier shows reason tooltip |
| `app/soledash/soledash.css` | Operator bar, cmd actions, fleet health, ambient styles |

---

## Preview notes

**Ambient (default porch):**
- LIVE/PARTIAL LIVE reality strip, WHAT NEEDS BEN hero, queue/receipt/blocker counts
- Fleet silhouettes with GREEN/YELLOW/RED/UNKNOWN labels (B=GREEN, D=YELLOW, S=GREEN, Spanzee=UNKNOWN)
- Active cousins list, blocker headline, Open Command

**Operator bar (always visible on home):**
- Frontier chip (P0-A001 · Workstation Uniformization)
- Waiting gates count (0 when live_transport; tooltip from human_gate)
- Dispatch status (Idle / busy / ok / warn / bad)
- Talk to the machine input + Send
- Send to Maker · Dink · Ender · Bean · Thufir · Skybro (disabled with “Enter message first” when empty)

**Command layer:**
- Fleet detail, blocker, frontier + CommandActionsPanel (YEA/NAY, NEEDS RESEARCH, KILL TEST, HUMAN REALITY, Send packet)
- Receipt center, queue override (inside panel), chat log only (compose moved to operator bar)
- Mock test harness collapsed in tier “Mock test harness (dev only)” — not on main surface

Screenshot: `page-2026-06-15T17-09-45-539Z.png` (ambient + operator bar)

---

## Fake controls removed

| Removed | Reason |
|---------|--------|
| **PivotBar** (8-button global carousel) | Global carousel over multi-panel surface — mission rule violation |
| Continue Current Frontier pivot | Duplicate of guarded YEA in command |
| Switch Frontier pivot | Queue panel owns frontier switch (Make Frontier / Inspect) |
| Workstation Uniformization pivot | Hardcoded queue guess — unreliable ghost |
| Spanzee Node pivot | Mock-only with no live instrument |
| New Direction pivot | Focus-only, no dispatch |
| Send to Petra (home command chat) | Not in operator spec; removed from home compose |
| Mock Test Harness (always-visible) | Moved to collapsed dev tier |
| Mock Test route row on main surface | Only inside dev tier now |

---

## Carousel / global mode logic removed

- Deleted `PivotBar`, `PivotAction`, `handlePivot`, `activePivot` state
- Removed `.mw-pivot.mw-pivot--always` fixed bottom carousel usage from home layout
- Replaced with `.sd-operator-bar` fixed footer; content scrolls above it (`mw-with-operator-bar` padding)

---

## What remains unwired

| Item | Status |
|------|--------|
| **Cousin auto-send (Edge paste)** | Live dispatch writes outbox via `cousin-dispatch` API; manual open still required for Edge cousins (degraded mode per existing doctrine) |
| **YEA/NAY/route actions in PARTIAL LIVE** | Still run mock-test lifecycle when not full LIVE — receipts labeled SIM |
| **Waiting human gates count** | Heuristic from `human_gate.classification` + `transport_gap`; no multi-gate inbox parser yet |
| **Petra transport** | Not on operator bar (spec lists Maker/Dink/Ender/Bean/Thufir/Skybro only); still available on legacy non-home decision surface |
| **Make Frontier** on active queue row | Disabled with tooltip “Already operator frontier” — wired, not ghost |
| **Mock test harness tier** | Dev-only; buttons execute mock lifecycle + write receipts when expanded |

---

## Fleet state semantics

Only four display states on cards and ambient dots:

- **GREEN** — ready (maps LIVE, ONLINE, OK, etc.)
- **YELLOW** — partial / needs attention (maps PARTIAL LIVE, DEGRADED, etc.)
- **RED** — blocked / unreachable
- **UNKNOWN** — not enough signal

Raw FLEET_STATE.json values unchanged on disk; normalization is display-layer only.

---

## Verification

- Browser: `http://localhost:3000/soledash` — ambient + operator bar + command layer opened
- Cousin buttons disabled without text (correct)
- Command shows YEA/NAY + three route slots with disabled reasons when protocol omits them
- Typecheck/lint: clean on touched files

---

## Operator next

None required for this pass. Optional: commit when ready.
