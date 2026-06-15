"use client";

import { useCallback, useState } from "react";

import type { LiveFireApiResult, LiveFirePhase, LiveFirePhaseEntry } from "@/lib/soledash/petra-empty-link/types";

const PHASE_ORDER: LiveFirePhase[] = [
  "packet_created",
  "send_attempted",
  "awaiting_response",
  "receipt_returned",
  "failed"
];

function phaseLabel(phase: LiveFirePhase): string {
  switch (phase) {
    case "packet_created":
      return "Packet created";
    case "send_attempted":
      return "Send attempted";
    case "awaiting_response":
      return "Awaiting response";
    case "receipt_returned":
      return "Receipt returned";
    case "failed":
      return "Failed";
  }
}

function failureClassLabel(code: string | null): string {
  if (!code) return "—";
  return code.replace(/_/g, " ");
}

export function PetraEmptyLinkFire({
  busy,
  onRefresh
}: {
  busy: boolean;
  onRefresh: () => Promise<void> | void;
}) {
  const [firing, setFiring] = useState(false);
  const [phases, setPhases] = useState<LiveFirePhaseEntry[]>([]);
  const [result, setResult] = useState<LiveFireApiResult | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [uiMismatch, setUiMismatch] = useState<string | null>(null);

  const run = useCallback(async () => {
    setFiring(true);
    setResult(null);
    setFetchError(null);
    setUiMismatch(null);
    setPhases([
      { phase: "packet_created", at: new Date().toISOString(), detail: "Creating packet…" }
    ]);

    try {
      setPhases((prev) => [
        ...prev.filter((p) => p.phase !== "packet_created"),
        { phase: "packet_created", at: new Date().toISOString(), detail: "Packet created locally" },
        { phase: "send_attempted", at: new Date().toISOString(), detail: "Calling live-fire route…" },
        { phase: "awaiting_response", at: new Date().toISOString(), detail: "Waiting for outbound link…" }
      ]);

      const res = await fetch("/api/soledash/v1/petra-empty-link-live-fire", { method: "POST" });
      const data = (await res.json()) as LiveFireApiResult & { error?: string; failure_class?: string };

      if (data.receipt?.phases?.length) {
        setPhases(data.receipt.phases);
      }

      setResult(data);

      if (data.ui_should_refresh) {
        await onRefresh();
      }

      if (data.receipt_path && data.receipt) {
        const verify = await fetch(`/api/soledash/v1/petra-empty-link-live-fire/verify?action_id=${encodeURIComponent(data.receipt.action_id)}`);
        if (verify.ok) {
          const v = (await verify.json()) as { in_receipt_center: boolean };
          if (!v.in_receipt_center) {
            setUiMismatch("receipt_exists_but_ui_did_not_refresh");
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Live fire request failed";
      setPhases((prev) => [
        ...prev,
        { phase: "failed", at: new Date().toISOString(), detail: msg }
      ]);
      setResult(null);
      setFetchError(msg);
      setUiMismatch("browser_cannot_reach_endpoint");
    } finally {
      setFiring(false);
    }
  }, [onRefresh]);

  const terminalPhase = phases.some((p) => p.phase === "receipt_returned")
    ? "receipt_returned"
    : phases.some((p) => p.phase === "failed")
      ? "failed"
      : firing
        ? "awaiting_response"
        : null;

  const displayFailureClass =
    uiMismatch ?? result?.failure_class ?? (result && !result.ok ? "failed" : null);

  return (
    <div className="sd-live-fire" aria-label="Petra empty link live fire test">
      <button
        type="button"
        className="sd-live-fire__btn"
        disabled={busy || firing}
        onClick={() => void run()}
      >
        {firing ? "LIVE FIRE…" : "LIVE FIRE: PETRA EMPTY LINK"}
      </button>

      {(phases.length > 0 || result || fetchError) && (
        <div className={`sd-live-fire__panel ${result?.ok ? "sd-live-fire__panel--ok" : result ? "sd-live-fire__panel--bad" : ""}`}>
          <ol className="sd-live-fire__phases">
            {PHASE_ORDER.filter((p) => p !== "failed" || phases.some((x) => x.phase === "failed")).map(
              (phase) => {
                const entry = phases.find((p) => p.phase === phase);
                const idx = PHASE_ORDER.indexOf(phase);
                const terminalIdx = terminalPhase ? PHASE_ORDER.indexOf(terminalPhase) : -1;
                const done = entry && (terminalIdx >= idx || phase === terminalPhase);
                const active = firing && !entry && phase === "awaiting_response";
                return (
                  <li
                    key={phase}
                    className={`sd-live-fire__phase ${done ? "sd-live-fire__phase--done" : ""} ${active ? "sd-live-fire__phase--active" : ""}`}
                  >
                    <span className="sd-live-fire__phase-name">{phaseLabel(phase)}</span>
                    {entry ? <span className="sd-live-fire__phase-detail">{entry.detail}</span> : null}
                  </li>
                );
              }
            )}
          </ol>

          {result ? (
            <div className="sd-live-fire__outcome">
              {result.ok ? (
                <p className="sd-live-fire__verdict sd-live-fire__verdict--ok">
                  Receipt returned · {result.receipt_path}
                </p>
              ) : (
                <p className="sd-live-fire__verdict sd-live-fire__verdict--bad">
                  {displayFailureClass
                    ? `Failure class: ${failureClassLabel(displayFailureClass)}`
                    : "Failed"}
                  {result.error ? ` — ${result.error}` : ""}
                </p>
              )}
              {result.receipt ? (
                <>
                  <p className="sd-live-fire__meta">
                    Packet <code>{result.receipt.packet_id}</code> · outbound{" "}
                    <code>{result.receipt.outbound_path}</code>
                    {result.receipt.outbound_url ? (
                      <>
                        {" "}
                        · URL <code>{result.receipt.outbound_url}</code>
                      </>
                    ) : null}
                  </p>
                  <p className="sd-live-fire__next">{result.receipt.next_missing_integration}</p>
                </>
              ) : null}
            </div>
          ) : fetchError ? (
            <p className="sd-live-fire__verdict sd-live-fire__verdict--bad">
              Failure class: browser cannot reach endpoint — {fetchError}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
