import type { ActionLifecyclePhase, ReceiptCenterStatus } from "@/protocol/index";

import type { GuillotineStatus } from "./types";

export function receiptStatusToGuillotine(status: ReceiptCenterStatus): GuillotineStatus {
  switch (status) {
    case "drafted":
    case "queued":
      return "Queued";
    case "sent":
    case "received":
    case "working":
      return "Working";
    case "resolved":
      return "Returned";
    case "failed":
      return "Closed";
    default:
      return "Working";
  }
}

export function lifecyclePhaseToGuillotine(phase: ActionLifecyclePhase): GuillotineStatus | null {
  switch (phase) {
    case "idle":
      return null;
    case "clicked":
    case "queued":
      return "Queued";
    case "sent":
    case "received":
    case "working":
      return "Working";
    case "resolved":
      return "Returned";
    case "failed":
      return "Closed";
    default:
      return "Working";
  }
}

export function relayStateToGuillotine(state: string): GuillotineStatus | null {
  switch (state) {
    case "READY":
      return null;
    case "FIRED":
    case "SENT":
    case "WORKING":
      return "Working";
    case "BLOCKED":
    case "EXPLODED":
      return "Blocked";
    case "RECEIPT RETURNED":
      return "Returned";
    default:
      return null;
  }
}

/** Legacy slug helper — prefer operatorStatusClass. */
export function statusClass(status: string): string {
  return status
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/by-dependency/g, "blocked");
}
