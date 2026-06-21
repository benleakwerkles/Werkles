# RECEIPT_DRAWER_V1

**Mission:** RECEIPT_DRAWER_V1  
**Decision Owner:** Ben  
**Reviewer:** Ender  
**Return Destination:** SoleDash Guillotine Queue  
**Execution context:** LOCAL_SALLY_WINDOWS · Maker @ Betsy  

---

## Objective

Canonical receipt surface on SoleDash — Ben never hunts for receipts again.

---

## Sections

| Section | Purpose |
|---------|---------|
| **New Receipts** | Terminal proof just arrived — no operator disposition yet |
| **Needs Review** | Follow-ups, failures, sim receipts, or explicit Follow-Up action |
| **Approved** | Operator accepted proof |
| **Archived** | Operator rejected — retired from active queue |

---

## Receipt fields (every card)

| Field | Source |
|-------|--------|
| Owner | Transport `owner`, relay cousin/agent, or decision route |
| Machine | `view.machine_label` or relay `targetComputer` |
| Timestamp | `last_update` / relay `lastUpdate` |
| Artifact | `receipt_link`, relay artifact value, or decision `written_to` |
| Result | Transport status, relay state, or decision outcome |
| Next Recommendation | Rule-based (`lib/soledash/receipt-drawer/recommendations.ts`) |

---

## Actions

| Action | Disposition | Section after act |
|--------|-------------|-------------------|
| **Approve** | `approved` | Approved |
| **Reject** | `rejected` | Archived |
| **Follow-Up** | `follow_up` | Needs Review |

Dispositions persist to `foreman/soledash/RECEIPT_DRAWER.json` via `POST /api/soledash/v1/receipt-drawer`.

---

## Data sources (merged into drawer)

1. **Transport receipts** — `ReceiptCenterEntry` with terminal status (`received`, `resolved`, `failed`)
2. **Relay cards** — `RECEIPT RETURNED` or `EXPLODED` from automatica-relay
3. **Frontier decision receipt** — `DecisionReceipt` when outcome or written path exists

In-flight items (`working`, `sent`, relay `FIRED`, etc.) stay in Guillotine **Working** — not duplicated in drawer.

---

## UI placement

| Surface | Integration |
|---------|-------------|
| Guillotine (desktop) | Replaces flat **Receipts** section |
| Duck (mobile) | **Receipts** tab — compact drawer |

Header badge / thumb count uses **attention** = New + Needs Review.

---

## Files

| Path | Role |
|------|------|
| `lib/soledash/receipt-drawer/types.ts` | Drawer types |
| `lib/soledash/receipt-drawer/build-sections.ts` | Partition receipts into four sections |
| `lib/soledash/receipt-drawer/recommendations.ts` | Next recommendation copy |
| `lib/soledash/receipt-drawer/storage.ts` | Server read/write `RECEIPT_DRAWER.json` |
| `lib/soledash/receipt-drawer/use-receipt-drawer.ts` | Client hook — load dispositions, act |
| `components/soledash/receipt-drawer.tsx` | Canonical UI |
| `app/api/soledash/v1/receipt-drawer/route.ts` | GET dispositions · POST approve/reject/follow_up |
| `components/soledash/guillotine-surface.tsx` | Wired drawer |
| `components/soledash/duck-command-strip.tsx` | Wired drawer (compact) |
| `app/soledash/soledash.css` | `.sd-rdraw-*` styles |

---

## Verify (Operator)

```text
npm run typecheck
npm run dev
# http://localhost:3000/soledash
# Approve / Reject / Follow-Up on a receipt → foreman/soledash/RECEIPT_DRAWER.json updates
```

---

## Receipt

**RECEIPT_DRAWER_V1 complete.** Four-section canonical drawer live on Guillotine and Duck. Operator actions persist on disk. Return to SoleDash Guillotine Queue for Ender review.
