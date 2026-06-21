# SOLEDASH_GUILLOTINE_RECEIPT

**Mission:** SOLEDASH_GUILLOTINE_V1  
**Decision Owner:** Petra  
**Reviewer:** Ender  
**Return Destination:** Frontier Queue  
**Execution context:** LOCAL_SALLY_WINDOWS · Maker @ Betsy  

---

## Objective

Convert SoleDash from dashboard to command surface. Operator answers within 10 seconds:

- What is being worked?
- What is blocked?
- What came back?

---

## What shipped

### Three sections only

| Section | Purpose |
|---------|---------|
| **CURRENT FRONTIER** | Single active decision — owner, status, receipt, decision owner |
| **WORKING** | In-flight receipts, blockers, relay runs, lifecycle actions |
| **RECEIPTS** | Returned / closed proof |

### Allowed statuses

`Queued` · `Working` · `Blocked` · `Human Gate` · `Returned` · `Closed`

### Uniform card fields

Every card displays:

- Owner
- Status
- Receipt
- Decision Owner

### Removed from `/soledash` home (guillotine cut)

- Ambient porch / command toggle / leave-point tracker
- Options deck, salvo, company options
- Fleet row, dispatch matrix, wisdom watcher, focus theft, permission fly
- Intent router, intent memory overlay, operator bar chat
- Queue visibility, frontier comparison, queue override panels
- Receipt search table, churn tiers, mock harness (home path)
- Duplicate mobile command surface stack
- Automatica relay grid as separate dashboard (relay state folds into WORKING / RECEIPTS)
- Send packet button (required hidden operator-bar text)

### Kept (executing)

- Frontier **YEA / NAY** and enabled route buttons (`CommandActionsPanel`, `hidePacket`)
- **RED Human Gate** panel when tier is red
- 20s decision-surface poll + manual Refresh
- Relay card state in WORKING/RECEIPTS via automatica-relay API (read-only in guillotine cards)

---

## Files

| Path | Role |
|------|------|
| `lib/soledash/guillotine/types.ts` | `GuillotineCard`, `GuillotineStatus`, sections |
| `lib/soledash/guillotine/map-status.ts` | Receipt / lifecycle / relay → guillotine status |
| `lib/soledash/guillotine/build-sections.ts` | Partition payload → frontier / working / receipts |
| `components/soledash/guillotine-surface.tsx` | UI — header pulse + 3 sections + frontier actions |
| `components/soledash/decision-surface.tsx` | Home route renders `GuillotineSurface` only |
| `components/soledash/command-actions.tsx` | `hidePacket` prop for guillotine |
| `app/soledash/soledash.css` | `.sd-guill-*` styles |

---

## Data sources (unchanged transport)

- `foreman/soledash/DECISION_SURFACE.json` — frontier proposal, gate, queue brain
- `foreman/soledash/receipts/` — receipt center entries
- `foreman/soledash/actions/` — action lifecycle
- `foreman/soledash/automatica/` — relay packets/receipts (non-READY states only)

---

## Success test (Operator)

Open `http://localhost:3002/soledash` (or `:3000`):

1. **Working** — header pulse + WORKING section list in-flight items
2. **Blocked** — pulse count + WORKING cards with `Blocked` status (frontier blocker slot)
3. **Returned** — RECEIPTS section + pulse count

Target: answer all three questions without scrolling past three sections.

---

## Not in scope

- Protocol schema change (Dink-owned `GuillotineCard` in `DECISION_SURFACE.json`) — client-side partition for v1
- Non-home decision-surface fallback path (legacy layout retained for non-MegaWork entry)
- Relay APPROVE buttons on guillotine cards — relay fires removed from UI per “no placeholder controls”; state still visible when already fired

---

## Verification

```bash
npm run typecheck
```

Load `/soledash` on Betsy — confirm three sections, no porch, no operator bar.
