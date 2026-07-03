import type {
  ActionLifecycle,
  DecisionSurfacePayload,
  DecisionSurfaceView,
  WorkbenchPacket
} from "@/protocol/index";
import { readActionReceipts, synthesizeReceiptFromBuild } from "@/lib/soledash/command-surface/action-receipts";
import { readCommandState } from "@/lib/soledash/command-surface/command-state";

import { loadLiveTransport, surfaceFileExists } from "./load-live-transport";
import { buildMockDecisionSurfacePayload } from "./mock-payload";
import { computeRealityMode } from "./reality-mode";

function unavailablePayload(error: string): DecisionSurfacePayload {
  const now = new Date().toISOString();
  return {
    schema_version: "soledash-protocol-v0.1",
    generated_at: now,
    generated_by: "maker-load-error",
    live_transport: false,
    mock: false,
    mission: {
      id: "unavailable",
      label: "SoleDash",
      summary: "Live payload unavailable"
    },
    current_churn: {
      summary: error,
      current_threat: "Cannot render Dink-owned state",
      next_decision: "Restore foreman/soledash/DECISION_SURFACE.json"
    },
    thread_health: {
      status: "blocked",
      detail: error
    },
    queue_brain: {
      active_owner: null,
      waiting_report: null,
      blocker: error,
      recommended_next_action: null
    },
    proposal: null,
    rationale: null,
    human_gate: {
      classification: "load_failure",
      operator_prompt: "Live payload unavailable",
      operator_line: "LIVE PAYLOAD UNAVAILABLE",
      detail: error,
      transport_gap: null
    },
    decision: {
      buttons: [],
      if_clicked: null
    },
    decision_receipt: {
      receipt_id: null,
      kind: null,
      last_action: null,
      outcome: null,
      next_state: null,
      written_to: null
    },
    operator_chat: {
      placeholder: "Live payload unavailable — restore Dink transport files.",
      entries: [],
      pending_route: null
    },
    current_blocker: {
      headline: "LIVE PAYLOAD UNAVAILABLE",
      detail: error,
      mock: false
    },
    receipt_center: [],
    action_lifecycle: {
      phase: "idle",
      action: null,
      action_id: null,
      proposal_id: null,
      updated_at: now,
      message: null,
      route_owner: null,
      mock: false,
      failure_reason: null
    } satisfies ActionLifecycle
  };
}

export function loadDecisionSurfacePayload(): {
  payload: DecisionSurfacePayload;
  data_source: DecisionSurfaceView["data_source"];
  load_error: string | null;
} {
  if (surfaceFileExists()) {
    const live = loadLiveTransport();
    if (live.ok) {
      const source = live.payload.mock ? "mock" : "dink";
      return { payload: live.payload, data_source: source, load_error: null };
    }
    return {
      payload: unavailablePayload(live.error),
      data_source: "unavailable",
      load_error: live.error
    };
  }

  return {
    payload: buildMockDecisionSurfacePayload(),
    data_source: "mock",
    load_error: null
  };
}

export function buildDecisionSurfaceView(machineLabel = "Betsy"): DecisionSurfaceView {
  const { payload, data_source, load_error } = loadDecisionSurfacePayload();
  const receipts = payload.receipt_center ?? [];
  const latestAction = payload.action_lifecycle ?? null;
  const reality_mode = computeRealityMode(data_source, payload, receipts, latestAction);
  return {
    payload,
    data_source,
    machine_label: machineLabel,
    load_error,
    reality_mode,
    workbench_packets: loadWorkbenchPackets()
  };
}

function loadWorkbenchPackets(): WorkbenchPacket[] {
  const state = readCommandState();
  const receipts = readActionReceipts(50);
  const visibleStatuses = new Set(["ready", "dispatched", "blocked", "escalated"]);

  return state.builds
    .filter((build) => visibleStatuses.has(build.status))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8)
    .map((build) => {
      const receipt = receipts.find((item) => item.buildId === build.id) ?? synthesizeReceiptFromBuild(build);
      return {
        id: build.id,
        title: build.title,
        mission_text: build.missionText,
        cousin: build.cousin,
        machine: build.machine,
        status: build.status,
        outbox_path: build.outboxPath,
        outbox_filename: build.outboxFilename,
        blocker: build.blocker,
        updated_at: build.updatedAt,
        receipt: receipt
          ? {
              id: receipt.id,
              state: receipt.state,
              at: receipt.at,
              written_to: receipt.writtenTo,
              next_state: receipt.nextState
            }
          : null
      };
    });
}
