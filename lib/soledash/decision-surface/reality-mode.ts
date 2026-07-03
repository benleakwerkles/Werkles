import type {
  ActionLifecycle,
  DecisionSurfacePayload,
  DecisionSurfaceView,
  ReceiptCenterEntry
} from "@/protocol/index";

export type RealityMode = "LIVE" | "PARTIAL LIVE" | "MOCK";

export function computeRealityMode(
  dataSource: DecisionSurfaceView["data_source"],
  payload: DecisionSurfacePayload,
  receipts: ReceiptCenterEntry[],
  latestAction: ActionLifecycle | null
): RealityMode {
  if (dataSource === "mock" || payload.mock === true) {
    return "MOCK";
  }

  if (dataSource === "unavailable") {
    return "PARTIAL LIVE";
  }

  const hasSimulated =
    receipts.some((entry) => entry.simulated) ||
    latestAction?.simulated === true ||
    payload.action_lifecycle?.simulated === true;

  if (payload.live_transport && hasSimulated) {
    return "PARTIAL LIVE";
  }

  if (payload.live_transport && dataSource === "dink") {
    return "LIVE";
  }

  return "MOCK";
}

export function realityModeDetail(mode: RealityMode, payload: DecisionSurfacePayload): string {
  switch (mode) {
    case "LIVE":
      return "Dink-owned files drive frontier, queue, receipts, and action rail.";
    case "PARTIAL LIVE":
      return "File-backed transport active — some receipts/actions marked simulated until cousin dispatch.";
    case "MOCK":
      return "Maker mock payload — no live DECISION_SURFACE.json or mock:true in Dink file.";
  }
}
