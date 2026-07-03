"use client";

import { useCallback, useEffect, useState } from "react";

import type { ArtifactShelfItem, ArtifactShelfSnapshot } from "./types";

const POLL_MS = 12_000;

export function mergeReceiptDrawerAttention(
  artifacts: ArtifactShelfItem[],
  receiptAttention: number
): ArtifactShelfItem[] {
  if (receiptAttention <= 0) return artifacts;
  return artifacts.map((item) =>
    item.id === "receipt-drawer"
      ? {
          ...item,
          status: `${receiptAttention} need${receiptAttention === 1 ? "s" : ""} your eyes`
        }
      : item
  );
}

export function useArtifactShelf(receiptAttention = 0) {
  const [snapshot, setSnapshot] = useState<ArtifactShelfSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/soledash/v1/artifact-shelf", { cache: "no-store" });
      const data = (await res.json()) as { ok?: boolean; shelf?: ArtifactShelfSnapshot };
      if (data.ok && data.shelf) setSnapshot(data.shelf);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const artifacts = mergeReceiptDrawerAttention(snapshot?.artifacts ?? [], receiptAttention);

  return { artifacts, loading, loadedAt: snapshot?.loaded_at ?? null, reload: load };
}
