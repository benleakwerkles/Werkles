# SOLEDASH_GUILLOTINE_SWEEP

**Mission:** SOLEDASH_GUILLOTINE_SWEEP  
**Operator:** Ben  
**Maker:** @ Betsy + Cowork  
**Execution context:** LOCAL_SALLY_WINDOWS  
**Scope:** `/soledash` live path (`app/soledash/page.tsx` → `DecisionSurface` → `SoleDashHome` → Guillotine / Duck)  
**Rule:** No redesign. Delete or mark for deletion only.

---

## Summary

| Action | Count |
|--------|------:|
| Deleted this sweep | 6 |
| Marked for deletion (blocker) | 28 |

---

## Sweep ledger

| Item | Location | Deleted | Blocker |
|------|----------|:-------:|---------|
| Legacy full dashboard (`!isHome` branch: mock harness, mission posture, queue panels, operator chat, ambient porch, fleet row, options deck mount, mobile SD stack) | `components/soledash/decision-surface.tsx` (was ~1270–1539) | **yes** | — |
| `CurrentRealityBanner` render (only shown when `homeView` null; page always passes home) | `components/soledash/decision-surface.tsx` return | **yes** | — |
| `optionsDeckProps` object (built but never rendered) | `components/soledash/decision-surface.tsx` | **yes** | — |
| `DuckFrontier` static read-only frontier block (replaced by `NextStepPanel`) | `components/soledash/duck-command-strip.tsx` | **yes** | — |
| `DuckCommandActions` duplicate YEA/NAY/routes (replaced by `NextStepPanel`) | `components/soledash/duck-command-strip.tsx` | **yes** | — |
| `soledash-dashboard.tsx` orphan (v12 kanban + fake mission cards; zero imports) | `components/soledash/soledash-dashboard.tsx` | **yes** | — |
| Dead component imports (panels, ambient layers, operator bar, mobile SD, mock harness UI, options deck, intent panels) | `components/soledash/decision-surface.tsx` imports | no | Trim after dead helper fns removed; TS may still compile with unused imports |
| Dead local helpers (`MissionPosture`, `FrontierButton`, `TierPanel`, `ReceiptBlock`, `ActionStatusRail`, etc.) | `components/soledash/decision-surface.tsx` ~L100–418 | no | Safe delete once imports trimmed; not on live render path |
| Options deck state + handlers (`salvoSlots`, `reactions`, `optionBoardStates`, `fireOption`, `fireSalvo`, receipt→deck `useEffect`) | `components/soledash/decision-surface.tsx` ~L455–1171 | no | `OptionsDeck` never mounted; delete with deck component |
| `OptionsDeck` component (NAY cards filtered; salvo excludes nay; never wired on home) | `components/soledash/options-deck.tsx` + `lib/soledash/options-deck/*` | no | Remove when salvo/company-options product retired |
| Nay outcome deck cards (`option.title` contains `nay ·`, `decision-outcome` ids) | `lib/soledash/options-deck/filter-cards.ts` | no | Already filtered from deck; delete builder paths that emit them |
| `command-surface.tsx` legacy six-proposal board (YEA/NAY/DEFER) | `components/soledash/command-surface.tsx` | no | Zero imports; kept for documented revert (`SOLEDASH_OS_REFRAME_v1.md`) |
| `sole-dash-os.tsx` OS prototype | `components/soledash/sole-dash-os.tsx` | no | Zero UI imports; APIs still use `lib/soledash/command-surface/os-view.ts` |
| `automatica-relay-grid.tsx` desktop grid | `components/soledash/automatica-relay-grid.tsx` | no | Zero imports; relay data consumed via `useRelayCards` in guillotine/duck |
| `mobile-sd-surface.tsx` + `mobile-operator-strip.tsx` | `components/soledash/mobile-sd-surface.tsx`, `mobile-operator-strip.tsx` | no | Only referenced from removed legacy branch |
| `operator-bar.tsx` (Send to cousin bar) | `components/soledash/operator-bar.tsx` | no | Unwired after guillotine; dispatch moved to `NextStepPanel` chat |
| Ambient porch / leave-point / command toggle | `components/soledash/ambient-command-layers.tsx` | no | Unwired from home; `DirectYeaNay` still used by `CommandActionsPanel` |
| Side panels: intent router, intent memory, wisdom watcher, focus theft, permission fly, dispatch matrix | respective `components/soledash/*-panel.tsx` | no | Unwired; APIs/libs may still serve other routes |
| `MockTestHarness` + `MockTestBanner` UI | `components/soledash/mock-test-harness.tsx` | no | Harness UI removed from render; **client mock runner still powers `runAction` YEA/NAY/routes** |
| Mock-simulated decide path (`runAction` → `runMockTestRoute` → `executeMockTest`) | `components/soledash/decision-surface.tsx` `runAction` | no | Live `/api/soledash/v1/decide` not wired on home; receipts show `(sim)` |
| `Send packet` button + `onSendPacket={() => {}}` noop | `components/soledash/command-actions.tsx`, `next-step-panel.tsx` | no | Hidden via `hidePacket`; remove prop when operator bar retired |
| Protocol-disabled route buttons (NEEDS RESEARCH / KILL TEST / HUMAN REALITY greyed) | `CommandActionsPanel` in `next-step-panel.tsx`, duck/guillotine gates | no | Not dead — Dink must enable in `DECISION_SURFACE.json` protocol |
| Duplicate YEA/NAY: Next Step panel + Gates tab + `HumanGatePanel` | `next-step-panel.tsx`, `duck-command-strip.tsx`, `guillotine-surface.tsx` | no | Intentional surfaces; consolidate only with product sign-off |
| Duplicate Refresh controls | Guillotine header, duck header, Next Step | no | Low harm; dedupe is redesign |
| `onGateDefer` / Defer on human gate | `decision-surface.tsx` → `SoleDashHome`; duck/gate panels | no | `defer` filtered from route buttons; gate defer still calls mock path |
| Fake static mission cards (`CONCIERGE_TEST_CASE_CARD`, `LEVERAGE_MISSION_CARD`) | `lib/soledash/concierge-test-case-card.ts`, `leverage-mission-card.ts` | no | Were only rendered in deleted `soledash-dashboard.tsx`; delete libs when confirmed unused |
| Mock decision payload fallback | `lib/soledash/decision-surface/mock-payload.ts`, `load-contract.ts` | no | Used when live transport missing; operator sees unavailable state |
| `buildMockDecisionSurfacePayload` on API state route | `app/api/soledash/v1/state/route.ts` via `load-contract` | no | Transport fallback — not UI dead code |
| Fleet row / receipt search (legacy megawork home) | `components/soledash/megawork-home-panels.tsx` | no | Unwired from home; fleet state still updated in `decision-surface` poll |
| `.sd-duck-frontier*` / `.sd-duck-actions*` CSS (orphaned after component delete) | `app/soledash/soledash.css` | no | Cosmetic cleanup only |

---

## Live path after sweep

```
/soledash
  └── DecisionSurface (homeView only)
        └── SoleDashHome
              ├── GuillotineSurface (desktop) — Next Step + WORKING + RECEIPTS
              └── DuckCommandStrip (mobile) — tabs + Next Step
```

Unreachable fallback only: empty-state paragraph if `homeView` missing.

---

## Files touched this sweep

| Path | Change |
|------|--------|
| `components/soledash/decision-surface.tsx` | Removed legacy branch, `optionsDeckProps`, `CurrentRealityBanner` block |
| `components/soledash/duck-command-strip.tsx` | Removed `DuckFrontier`, `DuckCommandActions` |
| `components/soledash/soledash-dashboard.tsx` | **Deleted** |
| `foreman/soledash/SOLEDASH_GUILLOTINE_SWEEP.md` | This receipt |

---

## Verification (Operator)

```text
npm run typecheck
npm run dev
# http://localhost:3000/soledash — Guillotine (wide) or Duck (?duck=1 or ≤768px)
```

---

## Receipt

**SOLEDASH_GUILLOTINE_SWEEP complete.** Six dead surfaces removed from disk or render path. Twenty-eight items marked for deletion pending live decide wiring, protocol enablement, or explicit retire of options-deck / legacy command-surface revert path. No redesign applied.
