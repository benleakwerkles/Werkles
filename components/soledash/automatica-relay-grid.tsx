"use client";

import { useState } from "react";

import { IntentRouterPanel } from "@/components/soledash/intent-router-panel";
import { RelayCardSurface } from "@/components/soledash/relay-card-surface";
import { useRelayCards } from "@/lib/soledash/automatica-relay/use-relay-cards";
import type { RelayCardView } from "@/lib/soledash/automatica-relay/types";

export function AutomaticaRelayGrid({ onRefresh }: { onRefresh?: () => void | Promise<void> }) {
  const { cards, loading, busyId, runAction, fetchReceipt } = useRelayCards(onRefresh);
  const [receiptModal, setReceiptModal] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleAction(cardId: string, action: Parameters<typeof runAction>[1], cousin?: string) {
    setStatus(null);
    const result = await runAction(cardId, action, cousin);
    setStatus(result.detail);
  }

  async function handleOpenReceipt(card: RelayCardView) {
    if (!card.packetId) return;
    const receipt = await fetchReceipt(card.packetId);
    if (receipt) setReceiptModal(receipt);
  }

  return (
    <>
      <IntentRouterPanel onRefresh={onRefresh} />

      {status ? <p className="sd-relay-surface__status">{status}</p> : null}
      <RelayCardSurface
        cards={cards}
        loading={loading}
        busy={busyId !== null}
        onAction={handleAction}
        onOpenReceipt={(card) => void handleOpenReceipt(card)}
        receiptModal={receiptModal}
        onCloseReceipt={() => setReceiptModal(null)}
      />
    </>
  );
}
