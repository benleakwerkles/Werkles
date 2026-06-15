import { cardById, RELAY_CARDS } from "./cards";
import {
  executeCardRoute,
  isRouteConnected,
  latestRunForCard,
  readRelayReceipt,
  resolveCardState,
  updatePacket,
  writePacket,
  writeRelayReceipt
} from "./storage";
import type { RelayCardView, RelayFireResult, RelayPacket, RelayReceipt } from "./types";

export function listRelayCards(): RelayCardView[] {
  return RELAY_CARDS.map((def) => {
    const run = latestRunForCard(def.id);
    const view = resolveCardState(def, run);
    return { ...def, ...view };
  });
}

export async function fireRelayCard(cardId: string): Promise<RelayFireResult | { ok: false; error: string }> {
  const card = cardById(cardId);
  if (!card) {
    return { ok: false, error: `Unknown relay card: ${cardId}` };
  }

  const now = new Date().toISOString();
  const packetId = `auto_${card.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const routeConnected = isRouteConnected(card);

  const packet: RelayPacket = {
    packet_id: packetId,
    timestamp: now,
    card_id: card.id,
    card_name: card.name,
    target: `${card.targetAgent} @ ${card.targetComputer}`,
    task: card.taskType,
    expected_receipt: card.expectedReceipt,
    status: "FIRED",
    mission_text: card.missionText
  };

  const packetPath = writePacket(packet);
  updatePacket(packetId, { status: "SENT" });

  const route = await executeCardRoute(card, packet);

  const finalPacketStatus = route.state === "RECEIPT RETURNED" ? "RECEIPT RETURNED" : route.state;
  updatePacket(packetId, { status: finalPacketStatus });

  const receipt: RelayReceipt = {
    packet_id: packetId,
    card_id: card.id,
    card_name: card.name,
    timestamp: now,
    updated_at: new Date().toISOString(),
    status: route.state,
    success: route.success,
    packet_path: packetPath,
    receipt_path: "",
    outbound_path: route.outboundPath,
    blocker: route.blocker,
    route_connected: routeConnected,
    error: route.error,
    next_action: route.nextAction,
    next_missing_integration: route.nextMissing
  };

  const receiptPath = writeRelayReceipt({ ...receipt, receipt_path: "" });
  receipt.receipt_path = receiptPath;
  writeRelayReceipt(receipt);

  const run = latestRunForCard(card.id);
  const view = resolveCardState(card, run);

  return {
    ok: route.success,
    card: { ...card, ...view },
    packet: { ...packet, status: finalPacketStatus },
    receipt
  };
}

export { readRelayReceipt };
