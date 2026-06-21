import type { RelayCardView } from "./types";

export function relayConfidence(card: RelayCardView): string {
  if (!card.routeConnected) return "low — route not connected";
  if (card.state === "RECEIPT RETURNED" && card.live) return "high — receipt returned";
  if (card.state === "BLOCKED" || card.state === "EXPLODED") return "low — blocked or failed";
  if (card.state === "WORKING" || card.state === "SENT" || card.state === "FIRED") {
    return "medium — in flight";
  }
  if (card.state === "READY") {
    return card.live ? "medium — ready to approve" : "low — unwired route";
  }
  return "unknown";
}

export function relayOwner(card: { cousin: RelayCardView["cousin"]; targetAgent: string }): string {
  return card.cousin ?? card.targetAgent;
}
