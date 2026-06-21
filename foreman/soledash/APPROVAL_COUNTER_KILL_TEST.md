# APPROVAL_COUNTER_KILL_TEST

**Mission:** APPROVAL_COUNTER_DEDUP_FIX  
**Execution context:** LOCAL_SALLY_WINDOWS · Maker @ Betsy  
**Return:** SoleDash Receipt Drawer  

---

## Problem

Approval counter was counting approval clicks, not unique approved cards. Re-approving the same card inflated the count.

---

## Fix

| Rule | Implementation |
|------|----------------|
| Counter source | `COUNT(DISTINCT card_id)` where disposition is `approved` |
| Unique key | `${card_id}:${approver}` in `foreman/soledash/RECEIPT_DRAWER.json` v2 |
| Duplicate approve | No write, no counter bump, local card message |
| Approved card UI | `✓ Approved · {timestamp} · {approver}` |
| Approve button | Hidden/disabled after approval |
| Blank toast | Removed — per-card notice only |

---

## Acceptance test

```text
npx tsx scripts/soledash/approval-counter-kill-test.ts
```

| Step | Expected |
|------|----------|
| Approve card-001 | counter = 1 |
| Approve card-002 | counter = 2 |
| Approve card-001 again | counter stays 2 |
| Card message | `Already approved by Ben at … No action taken.` |
| Receipt | duplicate ignored (no new store row) |

---

## Files

| Path | Role |
|------|------|
| `lib/soledash/receipt-drawer/types.ts` | v2 store, `cardId`, dedup helpers |
| `lib/soledash/receipt-drawer/storage.ts` | Unique key enforcement + counter |
| `app/api/soledash/v1/receipt-drawer/route.ts` | GET counter · POST duplicate flag |
| `lib/soledash/receipt-drawer/use-receipt-drawer.ts` | Per-card notices, no blank toast |
| `components/soledash/receipt-drawer.tsx` | Counter badge + approved state UI |
| `scripts/soledash/approval-counter-kill-test.ts` | Kill test |

---

## Receipt

**APPROVAL_COUNTER_DEDUP_FIX complete.** Counter tracks unique approved card IDs. Duplicate approvals by the same approver are ignored with an on-card message.
