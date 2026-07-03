"use client";

import { useCallback, useEffect, useState } from "react";

import type { PearlAction, PearlShelfStore, PearlStatus, PearlV0 } from "./types";
import { PEARL_STATUSES } from "./types";

export type PearlShelfRow = PearlV0 & { actions: PearlAction[] };

export function usePearlShelf() {
  const [pearls, setPearls] = useState<PearlShelfRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [storePath, setStorePath] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const res = await fetch("/api/pearls/v0", { cache: "no-store" });
      const data = (await res.json()) as {
        ok?: boolean;
        pearls?: PearlShelfRow[];
        path?: string;
        shelf?: PearlShelfStore;
        error?: string;
      };
      if (data.ok && data.pearls) {
        setPearls(data.pearls);
        setStorePath(data.path ?? null);
      } else {
        setLoadError(data.error ?? "Pearl shelf load failed");
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Pearl shelf load failed");
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
  const statusCounts = PEARL_STATUSES.reduce(
    (acc, status) => {
      acc[status] = byStatus[status].length;
      return acc;
    },
    {} as Record<PearlStatus, number>
  );
  const totalCount = pearls.length;

  return { pearls, byStatus, statusCounts, totalCount, loading, busyId, notice, loadError, storePath, newCount, reload: load, runAction };
}
