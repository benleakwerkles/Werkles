import type { ReceiptCenterEntry } from "@/protocol/index";

import type { OptionLifecycleState, OptionVerb } from "./types";

export function lifecycleLabel(state: OptionLifecycleState): string {
  switch (state) {
    case "proposed":
      return "Proposed";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "needs_research":
      return "Needs research";
    case "kill_test":
      return "Kill test";
    case "fired":
      return "Fired";
    case "working":
      return "Working";
    case "blocked":
      return "Blocked";
    case "receipt_returned":
      return "Receipt returned";
    case "exploded":
      return "Exploded";
    case "parked":
      return "Parked";
    default:
      return state;
  }
}

/** Terminal states leave the active deck and appear in history only */
export function isTerminalDeckState(state: OptionLifecycleState): boolean {
  return (
    state === "rejected" ||
    state === "exploded" ||
    state === "receipt_returned" ||
    state === "parked"
  );
}

export function lifecycleFromVerbResult(
  verb: OptionVerb,
  ok: boolean,
  tone: "ok" | "warn" | "bad"
): OptionLifecycleState {
  if (!ok || tone === "bad") {
    if (verb === "nay") return "rejected";
    return "blocked";
  }
  if (verb === "hold") return "proposed";
  if (verb === "nay") return "rejected";
  if (verb === "kill_test") return tone === "warn" ? "kill_test" : "exploded";
  if (verb === "needs_research") return "needs_research";
  if (verb === "human_reality") return "working";
  if (verb === "yea") return tone === "warn" ? "fired" : "approved";
  if (verb === "make_frontier") return tone === "warn" ? "fired" : "working";
  if (verb === "dispatch") return tone === "warn" ? "working" : "receipt_returned";
  return "fired";
}

export function lifecycleFromReceipt(
  receipt: ReceiptCenterEntry,
  verb: OptionVerb | null
): OptionLifecycleState {
  const status = receipt.status.toLowerCase();
  if (status.includes("fail") || status.includes("block")) return "blocked";
  if (verb === "nay") return "rejected";
  if (verb === "kill_test" && status.includes("resolv")) return "exploded";
  if (status.includes("work") || status.includes("sent") || status.includes("queue")) return "working";
  if (status.includes("resolv") || status.includes("done")) return "receipt_returned";
  return "working";
}

export function receiptMatchesOption(receipt: ReceiptCenterEntry, optionCode: string, optionTitle: string): boolean {
  const hay = `${receipt.target} ${receipt.action_id ?? ""}`.toLowerCase();
  return hay.includes(optionCode.toLowerCase()) || hay.includes(optionTitle.slice(0, 24).toLowerCase());
}

export function cardTypeLabel(cardType: import("./types").DeckCardType): string {
  switch (cardType) {
    case "intent_proposal":
      return "Intent proposal";
    case "relay_task":
      return "Relay task";
    case "human_gate":
      return "Human gate";
    case "receipt":
      return "Receipt";
    case "blocker":
      return "Blocker";
    case "contradiction_warning":
      return "Contradiction warning";
    case "resource_conflict":
      return "Resource conflict";
    case "focus_theft_incident":
      return "Focus theft incident";
    default:
      return cardType;
  }
}
