import assert from "node:assert/strict";
import test from "node:test";

import { projectHarveySwateyeCounter } from "../../../lib/harvey/swateye-counter.ts";

const receiptPath = "foreman/receipts/one.json";
const event = {
  event_id: "one",
  created_at: "2026-07-29T11:29:08.556Z",
  class: "GREEN",
  decision: "BYPASSED_NON_HUMAN_BLOCKER",
  swat_kind: "TECHNICAL_BLOCKER_BYPASSED",
  receipt_path: receiptPath,
  machine: "Doss",
  action: "RUN_LOCAL_TYPECHECK"
};
const request = {
  schema: "werkles.harvey-swateyes-permission-request/v1",
  request_id: "permission.harvey.doss.typecheck.001",
  requested_at: "2026-07-29T11:29:08.556Z",
  machine: "Doss",
  project_id: "harvey",
  action: "RUN_LOCAL_TYPECHECK",
  platform_permission_prompt: false,
  requires_secret: false,
  requires_provider_sign_in: false,
  recurring_operation: false,
  paid_action: false,
  push_or_merge: false,
  deploy_or_publish: false,
  production_mutation: false,
  destructive_or_irreversible: false
};
const outcomeReceipt = {
  schema: "werkles.harvey-swateye-event-receipt/v1",
  receipt_id: "swat.one",
  event_id: "one",
  recorded_at: "2026-07-29T11:30:00.000Z",
  event_at: "2026-07-29T11:29:08.556Z",
  machine: "Doss",
  action: "RUN_LOCAL_TYPECHECK",
  decision: "BYPASSED_NON_HUMAN_BLOCKER",
  swat_kind: "TECHNICAL_BLOCKER_BYPASSED",
  outcome: "TERMINAL_SUCCESS",
  intended_action_completed: true,
  authority_receipt_id: "approval.harvey.doss.001",
  platform_prompt_was_human_gate: false,
  true_human_gate_bypassed: false,
  permission_request: request
};
const authorityReceipt = {
  schema: "werkles.harvey-swateyes-authority-receipt/v1",
  receipt_id: "approval.harvey.doss.001",
  status: "APPROVED",
  granted_by: "BEN_OPERATOR",
  machine: "Doss",
  project_id: "harvey",
  allowed_actions: ["RUN_LOCAL_TYPECHECK"],
  allowed_operations: [],
  issued_at: "2026-07-29T10:00:00Z",
  expires_at: "2026-07-29T14:00:00Z",
  recurring_operation_authority: false
};

function project(candidateEvent = event, candidateReceipt = outcomeReceipt, candidateAuthority = authorityReceipt) {
  return projectHarveySwateyeCounter(
    { events: [candidateEvent] },
    { [receiptPath]: candidateReceipt },
    [candidateAuthority]
  );
}

test("counter includes a terminal Swateye intervention only when outcome and exact authority validate", () => {
  const projection = project();
  assert.equal(projection.confirmed_swats, 1);
  assert.equal(projection.permissions_swatted, 0);
  assert.equal(projection.technical_blockers_bypassed, 1);
  assert.equal(projection.green, 1);
  assert.equal(projection.blue, 0);
  assert.equal(projection.red, 0);
  assert.equal(projection.latest.event_id, "one");
  assert.equal(projection.truth, "ONLY_RECEIPT_BACKED_TERMINAL_SWATS_COUNT");
});

test("labels, paths, tests, sends, and human gates cannot count without terminal validated evidence", () => {
  for (const [candidateEvent, candidateReceipt, candidateAuthority] of [
    [{ ...event, decision: "TEST_PASSED" }, outcomeReceipt, authorityReceipt],
    [{ ...event, decision: "SENT" }, outcomeReceipt, authorityReceipt],
    [{ ...event, receipt_path: null }, outcomeReceipt, authorityReceipt],
    [{ ...event, class: "RED", decision: "HUMAN_GATE" }, outcomeReceipt, authorityReceipt],
    [event, { ...outcomeReceipt, outcome: "FAILED" }, authorityReceipt],
    [event, { ...outcomeReceipt, intended_action_completed: false }, authorityReceipt],
    [event, { ...outcomeReceipt, true_human_gate_bypassed: true }, authorityReceipt],
    [event, { ...outcomeReceipt, event_id: "other" }, authorityReceipt],
    [event, { ...outcomeReceipt, machine: "Betsy" }, authorityReceipt],
    [event, { ...outcomeReceipt, action: "RUN_LOCAL_BUILD" }, authorityReceipt],
    [event, { ...outcomeReceipt, event_at: "not-a-date" }, authorityReceipt],
    [{ ...event, class: "red" }, outcomeReceipt, authorityReceipt],
    [{ ...event, created_at: "not-a-date" }, outcomeReceipt, authorityReceipt],
    [event, outcomeReceipt, { ...authorityReceipt, machine: "Betsy" }],
    [event, outcomeReceipt, { ...authorityReceipt, status: "REVOKED" }],
    [event, { ...outcomeReceipt, permission_request: { ...request, deploy_or_publish: true } }, authorityReceipt]
  ]) {
    assert.equal(project(candidateEvent, candidateReceipt, candidateAuthority).confirmed_swats, 0);
  }
});

test("counter rejects RED and duplicate event, path, or receipt IDs and chooses the newest distinct event", () => {
  const secondPath = "foreman/receipts/two.json";
  const secondEvent = { ...event, event_id: "two", created_at: "2026-07-29T12:00:00Z", receipt_path: secondPath };
  const secondReceipt = { ...outcomeReceipt, receipt_id: "swat.two", event_id: "two", event_at: "2026-07-29T12:00:00Z", recorded_at: "2026-07-29T12:01:00Z", permission_request: { ...request, request_id: "permission.harvey.doss.typecheck.002", requested_at: "2026-07-29T12:00:00Z" } };
  const duplicateReceiptPath = "foreman/receipts/duplicate-two.json";
  const duplicateReceiptEvent = { ...secondEvent, event_id: "duplicate-two", receipt_path: duplicateReceiptPath };
  const duplicateReceipt = { ...secondReceipt, event_id: "duplicate-two" };
  const projection = projectHarveySwateyeCounter(
    { events: [
      event,
      { ...event },
      secondEvent,
      duplicateReceiptEvent,
      { ...secondEvent, event_id: "red", class: "RED" }
    ] },
    { [receiptPath]: outcomeReceipt, [secondPath]: secondReceipt, [duplicateReceiptPath]: duplicateReceipt },
    [authorityReceipt]
  );
  assert.equal(projection.confirmed_swats, 2);
  assert.equal(projection.latest.event_id, "two");
  assert.equal(projection.red, 0);
});

test("missing receipt or authority collections project as an honest zero", () => {
  assert.equal(projectHarveySwateyeCounter({ events: [event] }).confirmed_swats, 0);
  assert.equal(projectHarveySwateyeCounter({ events: [event] }, { [receiptPath]: outcomeReceipt }).confirmed_swats, 0);
  assert.equal(projectHarveySwateyeCounter({}).confirmed_swats, 0);
  assert.equal(projectHarveySwateyeCounter({ events: null }).confirmed_swats, 0);
});
