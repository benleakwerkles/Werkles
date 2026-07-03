# TO PETRA — Starship Explode Decision Tension / Options Market

**From:** Maker (Cursor) @ LOCAL_SALLY_WINDOWS  
**Date:** 2026-06-12  
**Mission:** STARSHIP EXPLODE — simultaneous actionable options with live opportunity cost  
**Execution context:** LOCAL_SALLY_WINDOWS · verified at `http://localhost:3000/soledash`

---

## Summary

Starship Explode is no longer a passive status deck. The **Company Options Market** surfaces multiple real choices at once, shows **live tension** when options compete for the same agent/frontier/budget, supports **multi-fire salvo** when selections do not conflict, and **reinforms the board from receipts** after execution.

Core principle delivered: the operator sees opportunity cost before firing, and the board updates from what actually happened — not the original expectation.

---

## Petra requirements → implementation

| Requirement | Status |
|-------------|--------|
| Interactive option cards (action, target, expected, time, risk, confidence) | ✅ Meta grid on every card |
| FIRE / HOLD / KILL TEST / NEEDS RESEARCH buttons | ✅ Standardized via `card-actions.ts`; disabled states explain why |
| Multi-fire when non-conflicting | ✅ Salvo bar + checkbox selection + `salvoAllowed()` gate |
| Conflict / opportunity cost UI | ✅ Live tension panel + per-card conflict hints |
| Lifecycle states (Proposed → Fired → Working → Blocked → Returned → Exploded → Escaped) | ✅ `lifecycle.ts` + board state in decision-surface |
| Receipt-based reinform | ✅ Receipt diff updates board; Reaction feed shows outcomes |
| No fake tension | ✅ Buttons execute, queue, or show disabled reason — no theatrical controls |

---

## Files changed / added

| File | Change |
|------|--------|
| `lib/soledash/options-deck/types.ts` | **NEW** — `CompanyOption`, `OptionBoardState`, lifecycle, conflicts |
| `lib/soledash/options-deck/build-options.ts` | **NEW** — builds market from queue, routes, frontier |
| `lib/soledash/options-deck/enrich-options.ts` | **NEW** — expected result, time cost, risk, confidence |
| `lib/soledash/options-deck/conflicts.ts` | **NEW** — agent/frontier/exclusive detection + salvo gate |
| `lib/soledash/options-deck/lifecycle.ts` | **NEW** — lifecycle labels + verb/receipt → state |
| `lib/soledash/options-deck/card-actions.ts` | **NEW** — FIRE/HOLD/KILL TEST/NEEDS RESEARCH button states |
| `lib/soledash/options-deck/cousins.ts` | **NEW** — shared cousin targets |
| `components/soledash/options-deck.tsx` | **REWRITE** — options market UI, cards, salvo, tension, reactions |
| `components/soledash/decision-surface.tsx` | Wire board state, `markOptionBoard`, salvo, receipt reinform |
| `app/soledash/soledash.css` | Card meta, lifecycle badges, tension panel, conflict warn styles |
| `app/soledash/page.tsx` | Page title → Starship Explode (was overriding layout) |

---

## Operator experience

**Ambient porch:** compact options market (top 6 cards) + doctrine strip  
**Command layer:** full market with:

- **Live tension** — e.g. “Sending MAKER on Workstation Uniformization delays YEA · Workstation Uniformization”, “YEA and NAY on the same frontier — pick one”, “Only one frontier — choosing P0-A002 defers P0-A003”
- **Salvo bar** — target cousin, verb, Multi-fire (N) with conflict block + reason tooltip
- **Option cards** — checkbox for salvo, lifecycle badge, meta grid, conflict hints, four verb buttons
- **Board reinform feed** — reaction entries after fire/receipt refresh

Example conflict copy (live on board today):

> Sending MAKER on “Workstation Uniformization” delays “Response Capture Automation”.

> YEA and NAY on the same frontier — pick one.

---

## Lifecycle behavior

| State | When |
|-------|------|
| Proposed | Default; selectable for salvo |
| Fired | Verb dispatched, awaiting receipt |
| Working | Receipt shows in-progress |
| Blocked | Dispatch failed or gate blocked |
| Returned | Receipt resolved successfully |
| Exploded | Kill test fired |
| Escaped | Competing option deferred after another option claimed frontier (YEA / make_frontier) |

After YEA/make_frontier success, competing options in `conflictsWith` flip to **Escaped** with dimmed reason.

---

## Honest limits (not fake)

| Limit | Detail |
|-------|--------|
| Board state | Client-only — not persisted to Dink files yet |
| HOLD | Records on board; does not survive refresh |
| Multi-fire | Sequential dispatch with visible salvo slots, not parallel machine execution |
| Receipt matching | Heuristic (code/title in target) — may miss edge receipts |
| Route overlap | Queue + route + play cards can still overlap with CommandActionsPanel YEA/NAY — both are real paths today |
| PARTIAL LIVE verbs | YEA/routes still use mock-test lifecycle where Dink dispatch not fully wired |

Every disabled button exposes a **reason** (e.g. “Kill test not enabled in Dink protocol for this option”, “Add operator bar text for packet dispatch”).

---

## Verification

- Loaded `/soledash` — ambient + command layers render options market
- Live tension panel lists 4 conflict messages on current DECISION_SURFACE payload
- Cards show FIRE/HOLD/KILL TEST/NEEDS RESEARCH with honest disabled states
- Multi-fire (0) disabled until selection; conflict warn appears when YEA+NAY both selected (salvo gate)
- Operator bar + existing NO-GHOSTS pass surfaces unchanged

---

## Suggested next (not done)

1. Persist `OptionBoardState` to Dink-owned file for cross-session continuity
2. Tighten receipt → option matching on `action_id` / `proposal_id`
3. Dedupe route cards vs CommandActionsPanel if Petra wants single firing surface
4. Write escaped/competing state from server when frontier actually switches (not just client-side)
