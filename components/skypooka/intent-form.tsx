"use client";

import { FormEvent, useState } from "react";

import { useSkyPookaRefresh } from "@/components/skypooka/refresh-context";

type AssembleResult = {
  ok: boolean;
  object?: {
    id: string;
    execution_owner: string;
    next_action: string;
    operator_intent: string;
    human_gates: string[];
    unresolved_fields: string[];
  };
  artifact_path?: string;
  error?: string;
};

export default function SkyPookaIntentForm() {
  const { refreshAll } = useSkyPookaRefresh();
  const [intent, setIntent] = useState("");
  const [owner, setOwner] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AssembleResult | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = intent.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/nerdkle/assemble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: trimmed,
          ...(owner.trim() ? { owner: owner.trim() } : {})
        })
      });
      const payload = (await response.json()) as AssembleResult;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Assemble failed");
      }
      setResult(payload);
      setIntent("");
      await refreshAll();
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : "Assemble failed"
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="skypooka-banner">
        Safe mobile intake only. This creates a local Nerdkle operating object and receipt. It does not send packets,
        approve gates, deploy, or spend money.
      </div>

      <form onSubmit={onSubmit} className="skypooka-intent-form">
        <label className="skypooka-label" htmlFor="skypooka-intent">
          Messy intent
        </label>
        <textarea
          id="skypooka-intent"
          className="skypooka-textarea"
          rows={5}
          value={intent}
          placeholder="I want to bring ___ into the world by ___."
          onChange={(event) => setIntent(event.target.value)}
          required
        />

        <label className="skypooka-label" htmlFor="skypooka-owner">
          Execution owner (optional)
        </label>
        <input
          id="skypooka-owner"
          className="skypooka-input"
          value={owner}
          placeholder="Maker, Dink, Skybro…"
          onChange={(event) => setOwner(event.target.value)}
        />

        <button type="submit" className="skypooka-btn skypooka-btn--fire skypooka-btn--full" disabled={busy || !intent.trim()}>
          {busy ? "Assembling…" : "Bring into the world"}
        </button>
      </form>

      {result?.ok && result.object ? (
        <article className="skypooka-card skypooka-card--action">
          <div className="skypooka-focus-label">Object created</div>
          <div className="skypooka-card-name">{result.object.id}</div>
          <div className="skypooka-meta">owner: {result.object.execution_owner}</div>
          <div className="skypooka-meta">{result.object.next_action}</div>
          {result.object.unresolved_fields.length > 0 ? (
            <div className="skypooka-meta skypooka-meta--muted">
              unresolved: {result.object.unresolved_fields.join(", ")}
            </div>
          ) : null}
          {result.object.human_gates.filter((gate) => gate !== "none").length > 0 ? (
            <div className="skypooka-meta skypooka-meta--muted">
              gates: {result.object.human_gates.filter((gate) => gate !== "none").join(", ")}
            </div>
          ) : null}
        </article>
      ) : null}

      {result && !result.ok ? <div className="skypooka-error">{result.error ?? "Assemble failed"}</div> : null}
    </>
  );
}
