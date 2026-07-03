/**
 * APPROVAL_COUNTER_KILL_TEST — deduped unique-card approval counter.
 * Run: npx tsx scripts/soledash/approval-counter-kill-test.ts
 */
import {
  applyDrawerDisposition,
  countUniqueApprovedCards,
  emptyDrawerStore
} from "../../lib/soledash/receipt-drawer/approval-store";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

let store = emptyDrawerStore();

const first = applyDrawerDisposition(store, {
  receiptId: "transport:card-001:2026-06-17T00:00:00.000Z",
  cardId: "card-001",
  action: "approve",
  approver: "Ben"
});
store = first.store;
assert(!first.result.duplicate, "first approve should not be duplicate");
assert(first.result.counter.uniqueApproved === 1, `counter after card-001 → expected 1, got ${first.result.counter.uniqueApproved}`);

const second = applyDrawerDisposition(store, {
  receiptId: "transport:card-002:2026-06-17T00:00:01.000Z",
  cardId: "card-002",
  action: "approve",
  approver: "Ben"
});
store = second.store;
assert(!second.result.duplicate, "second approve should not be duplicate");
assert(second.result.counter.uniqueApproved === 2, `counter after card-002 → expected 2, got ${second.result.counter.uniqueApproved}`);

const dup = applyDrawerDisposition(store, {
  receiptId: "transport:card-001:2026-06-17T00:00:02.000Z",
  cardId: "card-001",
  action: "approve",
  approver: "Ben"
});
assert(dup.result.duplicate, "duplicate approve should be flagged");
assert(dup.result.counter.uniqueApproved === 2, `counter after duplicate → expected 2, got ${dup.result.counter.uniqueApproved}`);
assert(dup.result.message?.includes("Already approved by Ben") ?? false, "duplicate message must name approver");
assert(dup.result.message?.includes("No action taken.") ?? false, "duplicate message must say no action taken");
assert(Object.keys(store.approvals).length === 2, "store must hold exactly two approval keys after duplicate");
assert(countUniqueApprovedCards(store).uniqueApproved === 2, "store count must stay 2");

console.log("APPROVAL_COUNTER_KILL_TEST passed");
console.log(JSON.stringify({ counter: dup.result.counter, duplicateMessage: dup.result.message }, null, 2));
