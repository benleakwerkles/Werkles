"use client";

import { useCallback, useEffect, useState } from "react";

import type { PetraStatusSnapshot } from "@/lib/soledash/petra-status/types";

const POLL_MS = 12_000;

export function usePetraStatus() {
  const [status, setStatus] = useState<PetraStatusSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/soledash/v1/petra-status", { cache: "no-store" });
      const data = (await res.json()) as { ok?: boolean; status?: PetraStatusSnapshot };
      if (res.ok && data.ok && data.status) {
        setStatus(data.status);
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

  return { status, loading, reload };
}
