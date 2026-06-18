import { dispatchBuild } from "@/lib/soledash/command-surface/dispatch";
import type { CousinId } from "@/lib/soledash/command-surface/types";

import { buildIntentMemoryPanel } from "./build-memory";
import {
  loadParkedIntents,
  saveIntentState,
  saveParkedIntents,
  writeActionReceipt,
  loadIntentState
} from "./storage";
import type {
  IntentMemoryAction,
  IntentMemoryActionResult,
  IntentMemoryPanel,
  RouteRecommendation
} from "./types";

export function interpretIntent(rawCommand: string, proposalId?: string | null): IntentMemoryPanel {
  const panel = buildIntentMemoryPanel({ rawCommand, proposalId });
  const state = loadIntentState();
  state.last_intent_id = panel.intent_id;
  saveIntentState(state);
  return panel;
}

export function applyRouteEdit(
  panel: IntentMemoryPanel,
  cousin: CousinId,
  machine?: string,
  reason?: string
): IntentMemoryPanel {
  const match =
    [panel.recommended_owner, ...panel.alternate_routes].find((r) => r.cousin === cousin) ??
    panel.recommended_owner;
  return {
    ...panel,
    selected_owner: {
      cousin,
      machine: machine ?? match.machine,
      reason: reason ?? match.reason
    }
  };
}

export async function runIntentMemoryAction(
  action: IntentMemoryAction,
  panel: IntentMemoryPanel,
  opts?: { cousin?: CousinId; park_reason?: string }
): Promise<{ result: IntentMemoryActionResult; panel: IntentMemoryPanel | null }> {
  const owner = opts?.cousin ?? panel.selected_owner.cousin;

  if (action === "park") {
    const parked = loadParkedIntents();
    parked.unshift({
      intent_id: panel.intent_id,
      raw_command: panel.raw_command,
      interpreted_command: panel.interpreted_command,
      recommended_owner: panel.selected_owner.cousin,
      parked_at: new Date().toISOString(),
      reason: opts?.park_reason?.trim() || "Operator parked from Intent Memory"
    });
    saveParkedIntents(parked.slice(0, 40));
    const receipt_path = writeActionReceipt({
      intent_id: panel.intent_id,
      action: "park",
      ok: true,
      detail: "Intent parked — not dispatched"
    });
    saveIntentState({ last_intent_id: panel.intent_id, last_action: "park" });
    return {
      result: { ok: true, action, detail: "Intent parked for later", receipt_path },
      panel: null
    };
  }

  if (action === "edit_route") {
    if (!opts?.cousin) {
      return {
        result: { ok: false, action, detail: "cousin required for edit_route" },
        panel
      };
    }
    const updated = applyRouteEdit(panel, opts.cousin);
    saveIntentState({ last_intent_id: panel.intent_id, last_action: `edit_route:${opts.cousin}` });
    return {
      result: { ok: true, action, detail: `Route set to ${opts.cousin}` },
      panel: updated
    };
  }

  const targetCousin: CousinId =
    action === "send_petra" ? "PETRA" : action === "send_bean" ? "BEAN" : owner;

  const dispatch = await dispatchBuild({
    missionText: panel.raw_command,
    title: `[Intent Memory] ${panel.interpreted_command.slice(0, 72)}`,
    cousin: targetCousin,
    decisionNote: `Intent Memory ${action} · confidence ${panel.route_confidence}`
  });

  const receipt_path = writeActionReceipt({
    intent_id: panel.intent_id,
    action,
    ok: dispatch.ok,
    detail: dispatch.message ?? dispatch.blocker ?? "Dispatch attempted",
    cousin: targetCousin,
    outbound_path: dispatch.build?.outboxPath ?? null
  });

  saveIntentState({
    last_intent_id: panel.intent_id,
    last_action: `${action}:${targetCousin}`
  });

  return {
    result: {
      ok: dispatch.ok,
      action,
      detail: dispatch.ok
        ? `Outbox written for ${targetCousin}`
        : dispatch.message ?? dispatch.blocker ?? "Dispatch blocked",
      receipt_path,
      outbound_path: dispatch.build?.outboxPath ?? null
    },
    panel: dispatch.ok ? null : panel
  };
}

export { buildIntentMemoryPanel };
