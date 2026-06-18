"use client";

import { useCallback, useEffect, useState } from "react";

import type { PearlAction, PearlStatus, PearlV0 } from "./types";
import { PEARL_STATUSES } from "./types";

export type PearlShelfRow = PearlV0 & { actions: PearlAction[] };

export function usePearlShelf() {
  const [pearls, setPearls] = useState<PearlShelfRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/pearls/v0", { cache: "no-store" });
      const data = (await res.json()) as { ok?: boolean; pearls?: PearlShelfRow[] };
      if (data.ok && data.pearls) setPearls(data.pearls);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = useCallback(
    async (pearlId: string, action: PearlAction) => {
      setBusyId(pearlId);
      setNotice(null);
      try {
        const res = await fetch("/api/pearls/v0", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pearl_id: pearlId, action })
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          pearl?: PearlShelfRow;
          duplicate_draft?: boolean;
        };
        if (!data.ok) {
          setNotice(data.error ?? "Action failed");
          return;
        }
        if (data.pearl) {
          setPearls((prev) => prev.map((row) => (row.pearl_id === pearlId ? data.pearl! : row)));
        } else {
          await load();
        }
      } finally {
        setBusyId(null);
      }
    },
    [load]
  );

  const byStatus = PEARL_STATUSES.reduce(
    (acc, status) => {
      acc[status] = pearls.filter((pearl) => pearl.status === status);
      return acc;
    },
    {} as Record<PearlStatus, PearlShelfRow[]>
  );

  const newCount = byStatus.NEW.length;

  return { pearls, byStatus, loading, busyId, notice, newCount, reload: load, runAction };
}
