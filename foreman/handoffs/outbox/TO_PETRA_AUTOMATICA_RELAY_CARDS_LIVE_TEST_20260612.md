# TO PETRA — Automatica Relay Cards Live Test

**From:** Maker (Cursor) @ LOCAL_SALLY_WINDOWS  
**Date:** 2026-06-12  
**Mission:** AUTOMATICA RELAY CARDS LIVE TEST  
**Execution context:** LOCAL_SALLY_WINDOWS · `http://localhost:3000/soledash` → Open Command

---

## Summary

First real **Automatica relay card grid** inside Starship Explode command layer. Five cards, file-backed packets + receipts, 4s polling, honest states. No mock success.

**Screenshot:** `automatica-relay-grid-live-test.png` (browser capture — BLOCKED Spanzee + EXPLODED UI Cleanup visible)

---

## Paths

| Kind | Path |
|------|------|
| Packets | `foreman/soledash/automatica/packets/` |
| Receipts | `foreman/soledash/automatica/receipts/` |

---

## API

| Method | Route |
|--------|-------|
| GET | `/api/soledash/v1/automatica-relay` |
| POST | `/api/soledash/v1/automatica-relay/fire` `{ "card_id": "..." }` |
| GET | `/api/soledash/v1/automatica-relay/receipt?packet_id=...` |

---

## Cards + live test status (2026-06-15 run)

| Card | State | Route | Result |
|------|-------|-------|--------|
| SPANZEE REMOTE CHECK | **BLOCKED** | Not connected | `ROUTE NOT CONNECTED` — Spanzee not instrumented in FLEET_STATE |
| UI CLEANUP ACROSS SCREENS | **EXPLODED** | Maker outbox | Human gate blocked dispatch (`STOP: HUMAN GATE`) — honest failure receipt |
| KINDSIR.COM CLEANUP | **RECEIPT RETURNED** | Ender outbox | `TO_ENDER_SOLEDASH_AUTOMATICA_KINDSIR_COM_CLEANUP_20260615-192532.md` |
| KIND SIR SUE RESEARCH | **RECEIPT RETURNED** | Petra outbox | `TO_PETRA_SOLEDASH_AUTOMATICA_KIND_SIR_SUE_RESEARCH_20260615-192521.md` |
| KIND SIR GRADING RESEARCH | **READY** | Petra outbox | Not fired in this run — route connected, awaiting FIRE |

---

## Files added/changed

| File | Change |
|------|--------|
| `lib/soledash/automatica-relay/types.ts` | Card/packet/receipt types + states |
| `lib/soledash/automatica-relay/cards.ts` | Five test card definitions |
| `lib/soledash/automatica-relay/storage.ts` | Packet/receipt IO, route checks, dispatch |
| `lib/soledash/automatica-relay/fire-card.ts` | Fire orchestration + list |
| `app/api/soledash/v1/automatica-relay/route.ts` | GET grid |
| `app/api/soledash/v1/automatica-relay/fire/route.ts` | POST fire |
| `app/api/soledash/v1/automatica-relay/receipt/route.ts` | GET receipt JSON |
| `components/soledash/automatica-relay-grid.tsx` | Relay card grid UI |
| `components/soledash/decision-surface.tsx` | Wire grid in command layer |
| `app/soledash/soledash.css` | Relay card styles |
| `foreman/soledash/.gitignore` | Ignore runtime packets/receipts |

---

## Acceptance (Ben)

1. Open Command on `/soledash`
2. See **Automatica · LightTrip relay** grid with 5 cards
3. FIRE ≥3 cards — each moves state + writes packet/receipt
4. OPEN RECEIPT shows JSON in modal
5. Unwired route shows **ROUTE NOT CONNECTED** (Spanzee)
6. Connected route without gate returns **RECEIPT RETURNED** + outbox path (Petra/Ender)
7. Human-gated route returns **EXPLODED** + exact blocker (Maker UI cleanup)

---

## Not built (next integration)

- Spanzee remote probe endpoint
- Cousin auto-send from outbox (Edge paste still manual)
- Response capture back into Automatica receipts (poll cousin replies)
- Maker UI cleanup requires human gate approval before dispatch
