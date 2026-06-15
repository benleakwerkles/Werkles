import type {
  DecisionActionResponse,
  DecisionReceipt,
  OperatorChatResponse,
  OperatorIntent
} from "@/protocol/index";

import { buildLifecycle } from "./action-lifecycle";
import { actionDisplayLabel, resolveRouteOwner } from "./action-routes";

const MOCK_WRITTEN_TO = "foreman/soledash/DECISION_SURFACE.json (mock — Dink owns live writes)";

function decisionReceipt(
  action: string,
  proposalId: string,
  actionId: string,
  routeOwner: string | null
): DecisionReceipt {
  const label = actionDisplayLabel(action);
  const base: DecisionReceipt = {
    receipt_id: actionId,
    kind: "mock_action",
    last_action: action,
    written_to: MOCK_WRITTEN_TO,
    outcome: null,
    next_state: null,
    route_owner: routeOwner
  };

  switch (action) {
    case "yea":
      return {
        ...base,
        outcome: "MOCK ACTION approved",
        next_state: `MOCK: YEA on ${proposalId} — Dink protocol will dispatch when live.`
      };
    case "nay":
      return {
        ...base,
        outcome: "MOCK ACTION declined",
        next_state: "MOCK: NAY logged — Dink advances frontier when live."
      };
    case "needs_research":
      return {
        ...base,
        outcome: `MOCK ACTION — ${label} routed to Thufir`,
        next_state: "MOCK: Thufir owns research lane — Dink wires live handoff when ready."
      };
    case "kill_test":
      return {
        ...base,
        outcome: `MOCK ACTION — ${label} routed to Bean`,
        next_state: "MOCK: Bean owns kill-test lane — Dink wires live handoff when ready."
      };
    case "human_reality":
      return {
        ...base,
        outcome: `MOCK ACTION — ${label} routed to Ender`,
        next_state: "MOCK: Ender owns human-reality audit — Dink wires live handoff when ready."
      };
    case "more_info":
      return {
        receipt_id: null,
        kind: "decision",
        last_action: action,
        outcome: "MOCK expand why",
        next_state: "Rationale panel opened — no dispatch.",
        written_to: null,
        route_owner: null
      };
    default:
      return {
        ...base,
        outcome: routeOwner
          ? `MOCK ACTION "${label}" routed to ${routeOwner}`
          : `MOCK ACTION "${label}"`,
        next_state: "Dink owns execution policy for unknown actions."
      };
  }
}

export function mockDecisionAction(
  proposalId: string,
  action: string,
  actionId?: string | null
): DecisionActionResponse {
  const id = actionId?.trim() || `act_mock_${Date.now()}`;
  const routeOwner = resolveRouteOwner(action);
  const receipt = decisionReceipt(action, proposalId, id, routeOwner);
  return {
    ok: true,
    mock: true,
    message: routeOwner
      ? `MOCK ACTION "${actionDisplayLabel(action)}" — routed to ${routeOwner}. Dink owns live dispatch.`
      : `MOCK ACTION "${actionDisplayLabel(action)}" — Dink owns execution policy.`,
    decision_receipt: receipt,
    action_lifecycle: buildLifecycle("resolved", action, proposalId, id, true, routeOwner)
  };
}

function buildOperatorIntent(text: string, proposalId?: string | null): OperatorIntent {
  const normalized = text.trim().toLowerCase();
  const isNext = normalized === "next";
  const created_at = new Date().toISOString();

  return {
    intent_id: `oi_mock_${Date.now()}`,
    created_at,
    raw_text: text,
    parsed_command: isNext ? "advance_frontier" : null,
    kind: isNext ? "advance_frontier" : "freeform",
    target_proposal_id: proposalId ?? null,
    summary: isNext
      ? "Operator requested next frontier decision — MOCK: Dink will re-rank when live."
      : `Operator intent captured — MOCK: "${text.slice(0, 100)}${text.length > 100 ? "…" : ""}"`,
    receipt_ref: "foreman/soledash/OPERATOR_INTENT_MOCK.jsonl (mock)"
  };
}

export function mockOperatorChat(text: string, proposalId?: string | null): OperatorChatResponse {
  const intent = buildOperatorIntent(text, proposalId);

  const decision_receipt: DecisionReceipt = {
    receipt_id: intent.intent_id,
    kind: "operator_intent",
    last_action: intent.parsed_command ?? "operator_intent",
    outcome: intent.summary,
    next_state: "MOCK: Dink routes intent when protocol live — no execution yet.",
    written_to: intent.receipt_ref,
    route_owner: null
  };

  return {
    ok: true,
    mock: true,
    message: "MOCK chat — structured OperatorIntent created; Dink owns routing.",
    entry: { entry_type: "operator_intent", intent },
    decision_receipt,
    pending_route: intent.parsed_command === "advance_frontier" ? "MOCK: advance_frontier" : null
  };
}
