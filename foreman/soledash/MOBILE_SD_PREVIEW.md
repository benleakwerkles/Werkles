# MOBILE SD SURFACE — PREVIEW RECEIPT

**From:** Maker (Cursor) @ LOCAL_SALLY_WINDOWS  
**Date:** 2026-06-12  
**Mission:** Mobile-friendly SoleDash (web, not native)  
**Execution context:** LOCAL_SALLY_WINDOWS · responsive `@media (max-width: 640px)` · dev `@ /soledash`

---

## Goal

Phone-usable SoleDash command surface with four operator essentials:

1. **Current frontier**
2. **Human Gates** (RED only)
3. **Relay cards**
4. **Receipts**

Not a native app — responsive web with touch targets, bottom-sheet modals, and a fixed operator bar.

---

## Mobile layout (Command)

Open Command from the porch (`Open Command` button). On viewports ≤640px:

| Order | Section | Component |
|-------|---------|-----------|
| 1 | **Frontier** | `MobileFrontierPanel` — code, title, evidence, summary, RED gate alert, blocker, reactions |
| 2 | **Human Gate** | `HumanGatePanel` — **only when tier = RED** |
| 3 | **Command** | `MobileCommandActions` — touch YEA/NAY + route buttons (hidden approve on RED) |
| 4 | **Latest** | `MobileLatestReceipt` — in-flight lifecycle + last receipt row |
| 5 | **Relay cards** | `MobileRelayCardList` — fire + receipt per Automatica card |
| 6 | **Receipts** | `MobileReceiptList` — tap row → bottom-sheet detail |

Orchestrated by `MobileSdSurface` in `components/soledash/mobile-sd-surface.tsx`.

---

## Mobile layout (Porch / Ambient)

Before opening Command:

| Section | Component |
|---------|-----------|
| **Status strip** | `MobileOperatorStrip` — frontier chip + RED human-gate count (if any) + blocker |
| **Ambient porch** | Existing hero, fleet dots, counts, **Open Command** (large touch target) |
| **Operator bar** | Compose + Send (status row hidden on mobile to save vertical space) |

---

## Desktop panels hidden on mobile

These remain on desktop (`sd-mobile-hide`) but do not render on phone Command:

- Full `AutomaticaRelayGrid` (replaced by `MobileRelayCardList`)
- Focus Theft Report
- Dispatch Matrix
- Wisdom Watcher
- Options deck (full)
- Desktop frontier + `CommandActionsPanel` block

Intent Memory panel still shows on mobile when triggered from operator Send — full width, scrollable.

---

## Touch / UX details

- Buttons **min-height 2.75rem** (YEA/NAY, relay Fire/Receipt, Open Command)
- Chat textarea **16px font** (avoids iOS zoom-on-focus)
- Relay/receipt modals **slide from bottom** (existing `auto-relay__modal` mobile styles)
- **Safe-area insets** on operator bar and page padding
- `touch-action: manipulation` on primary actions

---

## Shared relay logic

| File | Role |
|------|------|
| `lib/soledash/automatica-relay/use-relay-cards.ts` | Poll, fire, fetch receipt |
| `lib/soledash/automatica-relay/relay-receipt-format.ts` | Readable receipt rows |
| `components/soledash/automatica-relay-grid.tsx` | Desktop grid (uses hook) |
| `components/soledash/mobile-field-command.tsx` | `MobileRelayCardList` + receipts + actions |

---

## Files changed / added

| File | Change |
|------|--------|
| `components/soledash/mobile-sd-surface.tsx` | **NEW** — mobile command shell |
| `components/soledash/mobile-field-command.tsx` | Frontier, actions, latest receipt, relay list |
| `components/soledash/mobile-operator-strip.tsx` | RED-only gate chip; porch strip |
| `components/soledash/decision-surface.tsx` | Wire `MobileSdSurface`; hide desktop panels on mobile |
| `lib/soledash/automatica-relay/use-relay-cards.ts` | **NEW** — shared hook |
| `lib/soledash/automatica-relay/relay-receipt-format.ts` | **NEW** |
| `components/soledash/automatica-relay-grid.tsx` | Refactored to hook |
| `app/soledash/soledash.css` | Mobile shell, actions, relay, touch targets |

---

## Verify on phone (Betsy)

1. Open SoleDash in mobile viewport or on device (≤640px width).
2. **Porch:** see frontier strip + Open Command.
3. **Command:** scroll — frontier → (RED gate if forced) → YEA/NAY → relay cards → receipts.
4. **Relay:** tap Fire → confirm sheet → tap Receipt on returned card.
5. **Receipts:** tap any row → bottom detail sheet.
6. **Operator bar:** type message, Send — bar stays fixed at bottom.

**Force RED gate (optional):** set `human_gate.classification` to `true_human_gate` in `DECISION_SURFACE.json` — card appears between frontier and command actions.

---

## Acceptance

| Criterion | Status |
|-----------|--------|
| Relay cards on mobile | Pass — `MobileRelayCardList` |
| Receipts on mobile | Pass — list + modal detail |
| Human Gates on mobile | Pass — RED-only `HumanGatePanel` in mobile stack |
| Current frontier on mobile | Pass — porch strip + Command frontier panel |
| Usable on phone (not native) | Pass — responsive web, touch targets, bottom sheets |

---

## Not in scope

- Native iOS/Android shell
- Options deck on mobile (desktop-only for now)
- Wisdom Watcher / Dispatch Matrix on mobile (desktop analyst panels)
