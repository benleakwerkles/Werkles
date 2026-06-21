import type { ActionLifecycle, ActionLifecyclePhase, MockTestFailureMode } from "@/protocol/index";
import {
  buildFailedLifecycle,
  buildLifecycle,
  createActionId,
  lifecycleMessage
} from "@/lib/soledash/decision-surface/action-lifecycle";
import { resolveRouteOwner } from "@/lib/soledash/decision-surface/action-routes";

const SUCCESS_STEPS: ActionLifecyclePhase[] = [
  "clicked",
  "queued",
  "sent",
  "received",
  "working",
  "resolved"
];

const FAIL_TRANSPORT_STEPS: ActionLifecyclePhase[] = ["clicked", "queued", "failed"];

function failureReason(mode: MockTestFailureMode): string | null {
  switch (mode) {
    case "failed_transport":
      return "MOCK TEST: Transport failed — cousin dispatch unreachable (simulated).";
    case "blocked_red_gate":
      return "MOCK TEST: STOP — HUMAN GATE. RED classification blocks auto-dispatch.";
    case "waiting_for_owner":
      return null;
    case "missing_live_payload":
      return "MOCK TEST: LIVE PAYLOAD UNAVAILABLE — DECISION_SURFACE.json missing or corrupt.";
    default:
      return null;
  }
}

export function lifecycleStepsForFailure(mode: MockTestFailureMode): ActionLifecyclePhase[] {
  switch (mode) {
    case "success":
      return SUCCESS_STEPS;
    case "failed_transport":
      return FAIL_TRANSPORT_STEPS;
    case "blocked_red_gate":
      return ["clicked", "queued", "sent", "received", "working", "failed"];
    case "waiting_for_owner":
      return ["clicked", "queued", "sent", "received", "working"];
    case "missing_live_payload":
      return ["clicked", "failed"];
    default:
      return SUCCESS_STEPS;
  }
}

/** Map legacy action string to mock test route when possible */
export function routeForAction(action: string): import("@/protocol/index").MockTestRoute | null {
  switch (action) {
    case "yea":
    case "nay":
      return "continue";
    case "needs_research":
      return "needs_research";
    case "kill_test":
      return "kill_test";
    case "human_reality":
      return "human_reality";
    default:
      return null;
  }
}

export function createMockTestActionId(): string {
  return createActionId().replace(/^act_mock_/, "mock_test_");
}

export function stepLifecycle(
  phase: ActionLifecyclePhase,
  action: string,
  proposalId: string,
  actionId: string,
  routeOwner: string | null,
  failureMode: MockTestFailureMode
): ActionLifecycle {
  if (phase === "failed") {
    return {
      ...buildFailedLifecycle(
        action,
        proposalId,
        actionId,
        failureReason(failureMode) ?? "Mock test failed.",
        routeOwner
      ),
      simulated: true
    };
  }
  return {
    ...buildLifecycle(phase, action, proposalId, actionId, true, routeOwner),
    simulated: true,
    message: lifecycleMessage(action, phase, true, routeOwner).replace(
      "MOCK ACTION — ",
      "MOCK TEST — "
    )
  };
}

export { failureReason };
