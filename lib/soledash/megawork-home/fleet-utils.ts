import type {
  DecisionSurfaceView,
  FleetMachineCard,
  FleetMachineId,
  FleetStateMachineEntry,
  ReceiptCenterEntry
} from "@/protocol/index";

function latestReceiptSummary(entries: ReceiptCenterEntry[]): {
  target: string | null;
  at: string | null;
} {
  const row = entries[0];
  if (!row) return { target: null, at: null };
  return { target: row.target, at: row.last_update };
}

export function statusToRealityMode(status: string): FleetMachineCard["reality_mode"] {
  const s = status.trim().toUpperCase();
  if (s === "UNKNOWN" || s === "") return "UNKNOWN";
  if (s === "MOCK") return "MOCK";
  if (s.includes("PARTIAL") || s.includes("DEGRAD") || s.includes("WARN")) return "PARTIAL LIVE";
  if (
    s === "LIVE" ||
    s === "ONLINE" ||
    s === "UP" ||
    s === "OK" ||
    s === "GREEN" ||
    s === "HEALTHY" ||
    s === "ACTIVE"
  ) {
    return "LIVE";
  }
  if (s.includes("OFFLINE") || s.includes("DOWN") || s.includes("FAIL") || s.includes("BLOCK")) {
    return "PARTIAL LIVE";
  }
  return "UNKNOWN";
}

export function unknownPeerCard(id: FleetMachineId): FleetMachineCard {
  return {
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    display_name: "UNKNOWN",
    hostname: "UNKNOWN",
    status: "UNKNOWN",
    evidence_status: "UNKNOWN",
    active_cousins: "UNKNOWN",
    current_task: null,
    latest_receipt_path: null,
    blocker: "FLEET_STATE unavailable — no Dink feed on this host",
    remote_path_status: "UNKNOWN",
    workstation_uniformity_status: "UNKNOWN",
    needs_operator_touch: "UNKNOWN",
    active_cousin: "UNKNOWN",
    reality_mode: "UNKNOWN",
    latest_receipt: null,
    latest_receipt_at: null,
    is_local: false,
    fleet_source: "unknown"
  };
}

export function mapFleetStateEntry(entry: FleetStateMachineEntry, isLocal: boolean): FleetMachineCard {
  const receiptPath = entry.latest_receipt_path;
  return {
    id: entry.id,
    label: entry.display_name === "UNKNOWN" ? entry.id.charAt(0).toUpperCase() + entry.id.slice(1) : entry.display_name,
    display_name: entry.display_name,
    hostname: entry.hostname,
    status: entry.status,
    evidence_status: entry.evidence_status,
    active_cousins: entry.active_cousins,
    current_task: entry.current_task,
    latest_receipt_path: receiptPath,
    blocker: entry.blocker,
    remote_path_status: entry.remote_path_status,
    workstation_uniformity_status: entry.workstation_uniformity_status,
    needs_operator_touch: String(entry.needs_operator_touch),
    active_cousin: entry.active_cousins,
    reality_mode: statusToRealityMode(entry.status),
    latest_receipt: receiptPath,
    latest_receipt_at: null,
    is_local: isLocal,
    fleet_source: "fleet_state"
  };
}

export function buildBetsyFleetCard(
  decisionView: DecisionSurfaceView,
  isLocal: boolean,
  fleetStateEntry?: FleetStateMachineEntry | null
): FleetMachineCard {
  const payload = decisionView.payload;
  const receipt = latestReceiptSummary(payload.receipt_center ?? []);

  if (fleetStateEntry) {
    const card = mapFleetStateEntry(fleetStateEntry, isLocal);
    return {
      ...card,
      latest_receipt: receipt.target ?? card.latest_receipt_path,
      latest_receipt_at: receipt.at,
      fleet_source: "betsy_live",
      reality_mode: decisionView.reality_mode ?? card.reality_mode
    };
  }

  return {
    id: "betsy",
    label: "Betsy",
    display_name: "Betsy",
    hostname: "LOCAL_SALLY_WINDOWS",
    status: decisionView.reality_mode ?? "LIVE",
    evidence_status: payload.proposal?.evidence_status?.toString() ?? "UNKNOWN",
    active_cousins: payload.active_owner ?? payload.queue_brain.active_owner ?? "Maker @ Betsy",
    current_task: payload.proposal?.title ?? null,
    latest_receipt_path: receipt.target ? payload.decision_receipt.written_to : null,
    blocker: payload.current_blocker?.headline ?? null,
    remote_path_status: "LOCAL",
    workstation_uniformity_status: "UNKNOWN",
    needs_operator_touch: "false",
    active_cousin: payload.active_owner ?? payload.queue_brain.active_owner ?? "Maker @ Betsy",
    reality_mode: decisionView.reality_mode ?? "MOCK",
    latest_receipt: receipt.target,
    latest_receipt_at: receipt.at,
    is_local: isLocal,
    fleet_source: "betsy_live"
  };
}

export function patchFleetWithDecisionView(
  fleet: FleetMachineCard[],
  decisionView: DecisionSurfaceView
): FleetMachineCard[] {
  const payload = decisionView.payload;
  const receipt = latestReceiptSummary(payload.receipt_center ?? []);

  return fleet.map((machine) => {
    if (machine.id !== "betsy") return machine;

    return {
      ...machine,
      latest_receipt: receipt.target ?? machine.latest_receipt,
      latest_receipt_at: receipt.at ?? machine.latest_receipt_at,
      latest_receipt_path:
        machine.latest_receipt_path ??
        payload.decision_receipt.written_to ??
        null,
      blocker: payload.current_blocker?.headline ?? machine.blocker,
      current_task: payload.proposal?.title ?? machine.current_task,
      reality_mode:
        machine.fleet_source === "fleet_state"
          ? machine.reality_mode
          : (decisionView.reality_mode ?? machine.reality_mode),
      status:
        machine.fleet_source === "fleet_state"
          ? machine.status
          : (decisionView.reality_mode ?? machine.status),
      evidence_status:
        payload.proposal?.evidence_status?.toString() ?? machine.evidence_status,
      active_cousins:
        payload.active_owner ?? payload.queue_brain.active_owner ?? machine.active_cousins,
      active_cousin:
        payload.active_owner ?? payload.queue_brain.active_owner ?? machine.active_cousin
    };
  });
}
