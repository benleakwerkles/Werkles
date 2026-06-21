import type { ReceiptCenterEntry } from "@/protocol/index";

import type { OptionLifecycleState, OptionVerb } from "./types";

export function lifecycleLabel(state: OptionLifecycleState): string {
  switch (state) {
    case "proposed":
      return "Proposed";
    case "fired":
      return "Fired";
    case "working":
      return "Working";
    case "blocked":
      return "Blocked";
    case "returned":
      return "Returned";
    case "exploded":
      return "Exploded";
    case "escaped":
      return "Escaped";
    default:
      return state;
  }
}

export function lifecycleFromVerbResult(
  verb: OptionVerb,
  ok: boolean,
  tone: "ok" | "warn" | "bad"
): OptionLifecycleState {
  if (!ok || tone === "bad") return "blocked";
  if (verb === "hold") return "proposed";
  if (verb === "kill_test") return tone === "warn" ? "working" : "exploded";
  if (verb === "nay") return "escaped";
  if (verb === "make_frontier" || verb === "yea") return tone === "warn" ? "fired" : "working";
  if (verb === "dispatch" || verb === "needs_research" || verb === "human_reality") {
    return tone === "warn" ? "working" : "returned";
  }
  return "fired";
}

export function lifecycleFromReceipt(
  receipt: ReceiptCenterEntry,
  verb: OptionVerb | null
): OptionLifecycleState {
  const status = receipt.status.toLowerCase();
  if (status.includes("fail") || status.includes("block")) return "blocked";
  if (verb === "kill_test" && status.includes("resolv")) return "exploded";
  if (verb === "nay") return "escaped";
  if (status.includes("work") || status.includes("sent") || status.includes("queue")) return "working";
  if (status.includes("resolv") || status.includes("done")) return "returned";
  return "working";
}

export function receiptMatchesOption(receipt: ReceiptCenterEntry, optionCode: string, optionTitle: string): boolean {
  const hay = `${receipt.target} ${receipt.action_id ?? ""}`.toLowerCase();
  return hay.includes(optionCode.toLowerCase()) || hay.includes(optionTitle.slice(0, 24).toLowerCase());
}
