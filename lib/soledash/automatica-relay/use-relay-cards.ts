"use client";

import { useCallback, useEffect, useState } from "react";

import type { RelayCardActionKind } from "@/lib/soledash/automatica-relay/card-actions";
import type { RelayCardView } from "@/lib/soledash/automatica-relay/types";

const POLL_MS = 4000;

export function useRelayCards(onRefresh?: () => void | Promise<void>) {
  const [cards, setCards] = useState<RelayCardView[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dirs, setDirs] = useState({ packet_dir: "", receipt_dir: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/soledash/v1/automatica-relay", { cache: "no-store" });
      const data = await res.json();
      if (data.cards) setCards(data.cards);
      if (data.packet_dir) {
        setDirs({ packet_dir: data.packet_dir, receipt_dir: data.receipt_dir });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  async function runAction(
    cardId: string,
    action: RelayCardActionKind,
    cousin?: string
  ): Promise<{ ok: boolean; detail: string }> {
    setBusyId(cardId);
    try {
      const res = await fetch("/api/soledash/v1/automatica-relay/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_id: cardId, action, cousin, note: null })
      });
      const data = await res.json();
      if (data.cards) setCards(data.cards);
      if (onRefresh) await onRefresh();
      return {
        ok: Boolean(data.ok),
        detail: data.result?.detail ?? data.error ?? "Done"
      };
    } finally {
      setBusyId(null);
    }
  }

  async function fetchReceipt(packetId: string): Promise<Record<string, unknown> | null> {
    const res = await fetch(
      `/api/soledash/v1/automatica-relay/receipt?packet_id=${encodeURIComponent(packetId)}`
    );
    const data = await res.json();
    return data.receipt ? (data.receipt as Record<string, unknown>) : null;
  }

  return { cards, loading, busyId, runAction, load, fetchReceipt, dirs };
}
