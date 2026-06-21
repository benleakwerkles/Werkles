import type { ReceiptCenterStatus } from "@/protocol/index";

import type { GuillotineStatus, OperatorCardStatus } from "./types";

export function guillotineToOperator(status: GuillotineStatus): OperatorCardStatus {
  switch (status) {
    case "Queued":
      return "Ready to Start";
    case "Working":
      return "Now Building";
    case "Human Gate":
      return "Needs Decision";
    case "Blocked":
      return "Blocked by Dependency";
    case "Returned":
    case "Closed":
      return "Receipts";
    default:
      return "Now Building";
  }
}

export function receiptCenterToOperator(status: ReceiptCenterStatus): OperatorCardStatus {
  switch (status) {
    case "drafted":
    case "queued":
      return "Ready to Start";
    case "sent":
    case "received":
    case "working":
      return "Now Building";
    case "resolved":
      return "Receipts";
    case "failed":
      return "Blocked by Dependency";
    default:
      return "Now Building";
  }
}

export function operatorStatusClass(status: OperatorCardStatus): string {
  switch (status) {
    case "Ready to Start":
      return "ready";
    case "Now Building":
      return "building";
    case "Needs Decision":
      return "decision";
    case "Blocked by Dependency":
      return "blocked";
    case "Receipts":
      return "receipts";
    default:
      return "building";
  }
}

export function operatorStatusRank(status: OperatorCardStatus): number {
  switch (status) {
    case "Blocked by Dependency":
      return 0;
    case "Needs Decision":
      return 1;
    case "Now Building":
      return 2;
    case "Ready to Start":
      return 3;
    default:
      return 4;
  }
}
