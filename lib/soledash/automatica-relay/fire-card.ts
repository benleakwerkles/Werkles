import "server-only";

import { cardById, RELAY_CARDS } from "./cards";
import { completionArtifactsForCard, enrichRelayCardView, evaluateArtifactGate } from "./artifacts";
import { relayConfidence, relayOwner } from "./confidence";
import { readRouteOverride } from "./route-overrides";
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

function toView(
  effective: NonNullable<ReturnType<typeof cardById>>,
  run: ReturnType<typeof latestRunForCard>
): RelayCardView {
  const view = resolveCardState(effective, run);
  const merged = { ...effective, ...view } as RelayCardView;
  merged.owner = relayOwner(merged);
  merged.confidence = relayConfidence(merged);
  return enrichRelayCardView(merged, run.receipt);
}

export function listRelayCards(): RelayCardView[] {
  return RELAY_CARDS.map((def) => {
    const override = readRouteOverride(def.id);
    const effective = override ? { ...def, cousin: override.cousin } : def;
    const run = latestRunForCard(def.id);
    return toView(effective, run);
  });
}

export async function fireRelayCard(cardId: string): Promise<RelayFireResult | { ok: false; error: string }> {
  const base = cardById(cardId);
  if (!base) {
    return { ok: false, error: `Unknown relay card: ${cardId}` };
  }
  const override = readRouteOverride(cardId);
  const card = override ? { ...base, cousin: override.cousin } : base;

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
    ARTIFACT_REQUIRED: card.ARTIFACT_REQUIRED,
    status: "FIRED",
    mission_text: card.missionText
  };

  const packetPath = writePacket(packet);
  updatePacket(packetId, { status: "SENT" });

  const route = await executeCardRoute(card, packet);

  const baseReceipt: RelayReceipt = {
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
    next_missing_integration: route.nextMissing,
    ARTIFACT_REQUIRED: card.ARTIFACT_REQUIRED,
    artifact_gate: evaluateArtifactGate(card, null),
    artifacts: []
  };

  const completionArtifacts = completionArtifactsForCard(card, baseReceipt);
  const artifactGate = evaluateArtifactGate(card, { ...baseReceipt, artifacts: completionArtifacts });
  const missingRequiredArtifact =
    route.state === "RECEIPT RETURNED" && card.ARTIFACT_REQUIRED && !artifactGate.passed;

  const receipt: RelayReceipt = {
    ...baseReceipt,
    status: missingRequiredArtifact ? "BLOCKED" : route.state,
    success: missingRequiredArtifact ? false : route.success,
    blocker: missingRequiredArtifact ? artifactGate.blocker : route.blocker,
    next_action: missingRequiredArtifact
      ? "Attach screenshot, screen recording, URL, commit hash, receipt file, diff, or generated report"
      : route.nextAction,
    next_missing_integration: missingRequiredArtifact
      ? "Artifact delivery pipeline requires tangible proof before RECEIPT RETURNED"
      : route.nextMissing,
    artifact_gate: artifactGate,
    artifacts: completionArtifacts
  };

  const finalPacketStatus = receipt.status;
  updatePacket(packetId, { status: finalPacketStatus });

  const receiptPath = writeRelayReceipt({ ...receipt, receipt_path: "" });
  receipt.receipt_path = receiptPath;
  writeRelayReceipt(receipt);

  const run = latestRunForCard(card.id);
  const viewCard = toView(card, run);

  return {
    ok: route.success,
    card: viewCard,
    packet: { ...packet, status: finalPacketStatus },
    receipt
  };
}

export { readRelayReceipt };
