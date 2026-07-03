import type { ActionLifecycle, ActionLifecyclePhase } from "@/protocol/index";

import { actionDisplayLabel, resolveRouteOwner } from "./action-routes";

/** Petra-visible lifecycle rail — mock mode labels simulated steps */
export const LIFECYCLE_PHASES: ActionLifecyclePhase[] = [
  "clicked",
  "queued",
  "sent",
  "received",
  "working",
  "resolved"
];

export function createActionId(): string {
  return `act_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function idleLifecycle(): ActionLifecycle {
  return {
    phase: "idle",
    action: null,
    action_id: null,
    proposal_id: null,
    updated_at: new Date().toISOString(),
    message: null,
    route_owner: null,
    mock: false,
    failure_reason: null
  };
}

export function lifecycleMessage(
  action: string,
  phase: ActionLifecyclePhase,
  mock: boolean,
  routeOwner: string | null
): string {
  const a = action.toLowerCase();
  const tag = mock ? "MOCK ACTION — " : "";
  const label = actionDisplayLabel(action);
  const owner = routeOwner ?? resolveRouteOwner(action);

  if (phase === "clicked") return `${tag}You clicked ${label} — recording…`;
  if (phase === "queued") return `${tag}Queued on SoleDash — action_id assigned`;
  if (phase === "sent") {
    if (owner) return `${tag}Sent — routing to ${owner}`;
    return `${tag}Decision sent to SoleDash handler`;
  }
  if (phase === "received") {
    if (owner) {
      return mock
        ? `${tag}Simulated-received by ${owner} lane (mock until live dispatch)`
        : `Received by ${owner} dispatch queue`;
    }
    return mock
      ? `${tag}Simulated-received by mock handler (no live Dink transport)`
      : "Received by dispatch queue";
  }
  if (phase === "working") {
    if (a === "yea") return `${tag}Simulated-working — cousin lane (mock until Dink live)`;
    if (a === "nay") return `${tag}Simulated-working — closing proposal rank`;
    if (owner) return `${tag}Simulated-working — ${owner} owns next step`;
    return `${tag}Machine processing your decision`;
  }
  if (phase === "resolved") {
    if (a === "yea") return `${tag}YEA resolved — receipt written (mock transport)`;
    if (a === "nay") return `${tag}NAY resolved — next frontier on refresh when live`;
    if (owner) return `${tag}${label} resolved — routed to ${owner} (mock transport)`;
    return `${tag}Action complete`;
  }
  if (phase === "failed") return `${tag}Action failed — see failure reason below`;
  return "";
}

export function buildLifecycle(
  phase: ActionLifecyclePhase,
  action: string,
  proposalId: string,
  actionId: string,
  mock = true,
  routeOwner: string | null = null
): ActionLifecycle {
  const owner = routeOwner ?? resolveRouteOwner(action);
  return {
    phase,
    action,
    action_id: actionId,
    proposal_id: proposalId,
    updated_at: new Date().toISOString(),
    message: lifecycleMessage(action, phase, mock, owner),
    route_owner: owner,
    mock,
    failure_reason: null
  };
}

export function buildFailedLifecycle(
  action: string,
  proposalId: string,
  actionId: string,
  reason: string,
  routeOwner: string | null = null
): ActionLifecycle {
  const owner = routeOwner ?? resolveRouteOwner(action);
  return {
    phase: "failed",
    action,
    action_id: actionId,
    proposal_id: proposalId,
    updated_at: new Date().toISOString(),
    message: lifecycleMessage(action, "failed", true, owner),
    route_owner: owner,
    mock: true,
    failure_reason: reason
  };
}

export async function animateLifecycle(
  action: string,
  proposalId: string,
  actionId: string,
  onUpdate: (lifecycle: ActionLifecycle) => void,
  routeOwner: string | null = null
): Promise<ActionLifecycle> {
  const steps: ActionLifecyclePhase[] = [
    "clicked",
    "queued",
    "sent",
    "received",
    "working",
    "resolved"
  ];

  let current = buildLifecycle("clicked", action, proposalId, actionId, true, routeOwner);
  onUpdate(current);

  for (const phase of steps.slice(1)) {
    await new Promise((r) => setTimeout(r, phase === "queued" ? 120 : 400));
    current = buildLifecycle(phase, action, proposalId, actionId, true, routeOwner);
    onUpdate(current);
  }

  return current;
}
