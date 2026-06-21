"use client";

import { useCallback, useEffect, useState } from "react";

import type { SwatterReceiptLogEntry } from "@/lib/soledash/permission-swatter/load-receipt-log";
import type { PermissionSwatterScoreboard } from "@/lib/soledash/permission-swatter/load-scoreboard";

const POLL_MS = 8000;

export function usePermissionSwatterScoreboard() {
  const [scoreboard, setScoreboard] = useState<PermissionSwatterScoreboard | null>(null);
  const [entries, setEntries] = useState<SwatterReceiptLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/soledash/v1/permission-swatter/scoreboard", { cache: "no-store" });
      const data = (await res.json()) as {
        ok?: boolean;
        scoreboard?: PermissionSwatterScoreboard;
        entries?: SwatterReceiptLogEntry[];
      };
      if (res.ok && data.ok && data.scoreboard) {
        setScoreboard(data.scoreboard);
        setEntries(Array.isArray(data.entries) ? data.entries : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [reload]);

  return { scoreboard, entries, loading, reload };
}
