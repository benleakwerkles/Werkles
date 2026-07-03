"use client";

import { useState } from "react";

import { ShakespeareDecisionCard } from "@/components/soledash/shakespeare-decision-card";
import type { ShakespeareDecisionView } from "@/lib/soledash/shakespeare/types";

export function ShakespeareVerdictPanel({ compact }: { compact?: boolean }) {
  const [intent, setIntent] = useState("");
  const [view, setView] = useState<ShakespeareDecisionView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function classify() {
    const text = intent.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/soledash/v1/shakespeare/verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: text })
      });
      const data = (await res.json()) as { ok?: boolean; view?: ShakespeareDecisionView; error?: string };
      if (!res.ok || !data.ok || !data.view) {
        setError(data.error ?? "Shakespeare classify failed");
        setView(null);
        return;
      }
      setView(data.view);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Shakespeare classify failed");
      setView(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`sd-shake-panel ${compact ? "sd-shake-panel--compact" : ""}`} aria-label="Shakespeare policy path">
      <div className="sd-shake-panel__head">
        <p className="sd-shake-panel__eyebrow">Shakespeare v0</p>
        <h2 className="sd-shake-panel__title">Decision card</h2>
        <p className="sd-shake-panel__hint">Hardcoded rules only — card shows verdict output, no UI policy.</p>
      </div>

      <label className="sd-shake-panel__label" htmlFor="shake-intent">
        Intent
      </label>
      <textarea
        id="shake-intent"
        className="sd-shake-panel__input"
        rows={compact ? 2 : 3}
        placeholder='e.g. "local read workstation note" or "production deploy"'
        value={intent}
        disabled={busy}
        onChange={(e) => setIntent(e.target.value)}
      />
      <button type="button" className="sd-shake-panel__btn" disabled={busy || !intent.trim()} onClick={() => void classify()}>
        {busy ? "Classifying…" : "Classify intent"}
      </button>

      {error ? <p className="sd-shake-panel__error">{error}</p> : null}
      {view ? <ShakespeareDecisionCard view={view} compact={compact} /> : null}
    </section>
  );
}
