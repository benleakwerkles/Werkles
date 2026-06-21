import type {
  ActionLifecycle,
  ActionLifecyclePhase,
  DecisionReceipt,
  MockTestFailureMode,
  MockTestReceiptFile,
  MockTestResult,
  MockTestRoute,
  MockTestRunResponse,
  ReceiptCenterEntry,
  ReceiptCenterStatus,
  TransportActionFile
} from "@/protocol/index";

import {
  buildFailedLifecycle,
  buildLifecycle
} from "@/lib/soledash/decision-surface/action-lifecycle";
import { actionDisplayLabel, resolveRouteOwner } from "@/lib/soledash/decision-surface/action-routes";
import { lifecycleToReceiptStatus } from "@/lib/soledash/decision-surface/receipt-center";
import { lifecycleStepsForFailure, failureReason } from "@/lib/soledash/mock-test/shared";
import { MOCK_TEST_ROUTES } from "@/lib/soledash/mock-test/routes";
import { writeMockTestFiles } from "@/lib/soledash/mock-test/write-test-receipt";

function finalPhase(steps: ActionLifecyclePhase[]): ActionLifecyclePhase {
  return steps[steps.length - 1] ?? "resolved";
}

function buildTarget(route: MockTestRoute, actionCode: string | null, title: string | null): string {
  const cfg = MOCK_TEST_ROUTES[route];
  const code = actionCode ? `${actionCode} · ` : "";
  const name = title ?? cfg.label;
  return `${cfg.label} — ${code}${name}`;
}

function buildDecisionReceipt(
  action: string,
  actionId: string,
  routeOwner: string | null,
  route: MockTestRoute,
  failureMode: MockTestFailureMode,
  writtenTo: string | null,
  finalStatus: ReceiptCenterStatus
): DecisionReceipt {
  const label = actionDisplayLabel(action);
  const cfg = MOCK_TEST_ROUTES[route];

  if (finalStatus === "failed") {
    return {
      receipt_id: actionId,
      kind: "mock_test",
      last_action: action,
      outcome: `MOCK TEST failed — ${cfg.label}`,
      next_state: failureReason(failureMode) ?? "Mock test ended in failed state.",
      written_to: writtenTo,
      route_owner: routeOwner
    };
  }

  if (finalStatus === "working" && failureMode === "waiting_for_owner") {
    return {
      receipt_id: actionId,
      kind: "mock_test",
      last_action: action,
      outcome: `MOCK TEST waiting — ${cfg.label}`,
      next_state: "Simulated: action parked at working — owner has not resolved yet.",
      written_to: writtenTo,
      route_owner: routeOwner
    };
  }

  return {
    receipt_id: actionId,
    kind: "mock_test",
    last_action: action,
    outcome: `MOCK TEST resolved — ${label}`,
    next_state: cfg.would_happen_live,
    written_to: writtenTo,
    route_owner: routeOwner
  };
}

export function runMockTest(input: {
  route: MockTestRoute;
  proposal_id: string;
  failure_mode?: MockTestFailureMode;
  action_code?: string | null;
  frontier_title?: string | null;
  action_override?: string | null;
}): MockTestRunResponse {
  const failureMode = input.failure_mode ?? "success";
  const cfg = MOCK_TEST_ROUTES[input.route];
  const action = input.action_override?.trim() || cfg.action;
  const actionId = `mock_test_${Date.now()}`;
  const routeOwner = cfg.owner ?? resolveRouteOwner(action);
  const steps = lifecycleStepsForFailure(failureMode);
  const endPhase = finalPhase(steps);
  const now = new Date().toISOString();
  const target = buildTarget(input.route, input.action_code ?? null, input.frontier_title ?? null);
  const status = lifecycleToReceiptStatus(endPhase);

  const lifecycle: ActionLifecycle =
    endPhase === "failed"
      ? buildFailedLifecycle(
          action,
          input.proposal_id,
          actionId,
          failureReason(failureMode) ?? "Mock test failed.",
          routeOwner
        )
      : buildLifecycle(endPhase, action, input.proposal_id, actionId, true, routeOwner);

  const lifecycleWithSim: ActionLifecycle = {
    ...lifecycle,
    simulated: true,
    mock: true,
    message:
      failureMode === "waiting_for_owner"
        ? "MOCK TEST — waiting for owner (simulated stall at working)"
        : lifecycle.message
  };

  const receiptFile: MockTestReceiptFile = {
    action_id: actionId,
    target,
    owner: routeOwner,
    created_at: now,
    updated_at: now,
    status,
    receipt_link: `foreman/soledash/receipts/${actionId}.json`,
    simulated: true,
    mock_test: true,
    route: input.route,
    failure_mode: failureMode,
    would_happen_live: cfg.would_happen_live,
    why_simulated: cfg.why_simulated
  };

  const actionFile: TransportActionFile = {
    action_id: actionId,
    action,
    proposal_id: input.proposal_id,
    phase: endPhase,
    updated_at: now,
    message: lifecycleWithSim.message,
    route_owner: routeOwner,
    simulated: true,
    failure_reason: lifecycleWithSim.failure_reason ?? null
  };

  const writeResult = writeMockTestFiles(receiptFile, actionFile);
  const clientOnly = !writeResult.ok;
  const writtenTo = writeResult.ok
    ? writeResult.receipt_path
    : clientOnly
      ? "CLIENT-ONLY MOCK RECEIPT"
      : null;

  const receiptEntry: ReceiptCenterEntry = {
    action_id: actionId,
    target,
    owner: routeOwner,
    created_at: now,
    status,
    last_update: now,
    receipt_link: writtenTo,
    mock: false,
    simulated: true,
    mock_test: true
  };

  const result: MockTestResult = {
    action: actionDisplayLabel(action),
    route: input.route,
    status,
    receipt_id: actionId,
    action_id: actionId,
    would_happen_live: cfg.would_happen_live,
    why_simulated: cfg.why_simulated,
    failure_mode: failureMode,
    written_to: writtenTo,
    client_only: clientOnly,
    at: now
  };

  const decision_receipt = buildDecisionReceipt(
    action,
    actionId,
    routeOwner,
    input.route,
    failureMode,
    writtenTo,
    status
  );

  return {
    ok: true,
    mock_test: true,
    message: clientOnly
      ? `MOCK TEST "${cfg.label}" — CLIENT-ONLY MOCK RECEIPT (file write unavailable).`
      : `MOCK TEST "${cfg.label}" — receipt written to ${writtenTo}.`,
    result,
    receipt_entry: receiptEntry,
    action_lifecycle: lifecycleWithSim,
    decision_receipt,
    lifecycle_steps: steps
  };
}

export { lifecycleStepsForFailure } from "@/lib/soledash/mock-test/shared";
