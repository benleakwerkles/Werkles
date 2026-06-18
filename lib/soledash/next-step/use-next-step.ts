"use client";

import { useCallback, useEffect, useState } from "react";

import type { NextStepOverride, NextStepOwner } from "./types";

export function useNextStep(onSaved?: () => void | Promise<void>) {
  const [override, setOverride] = useState<NextStepOverride | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/soledash/v1/next-step", { cache: "no-store" });
      const data = await res.json();
      if (data.ok && data.override) setOverride(data.override);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(input: {
    owner: NextStepOwner;
    machine: string;
    note: string | null;
    dispatch: boolean;
  }): Promise<{ ok: boolean; detail: string }> {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/soledash/v1/next-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const detail = data.error ?? "Save failed";
        setStatus(detail);
        return { ok: false, detail };
      }
      setOverride(data.override);
      const detail = data.dispatch?.build?.outboxFilename
        ? `Saved · dispatched → ${data.dispatch.build.outboxFilename}`
        : "Saved next step route";
      setStatus(detail);
      if (onSaved) await onSaved();
      return { ok: true, detail };
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Save failed";
      setStatus(detail);
      return { ok: false, detail };
    } finally {
      setBusy(false);
    }
  }

  return { override, loading, busy, status, setStatus, save, reload: load };
}
