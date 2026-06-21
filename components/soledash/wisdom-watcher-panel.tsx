"use client";

import { useCallback, useEffect, useState } from "react";

import type { WisdomRisk, WisdomWatchPanel } from "@/lib/soledash/wisdom-watcher/types";

function severityClass(s: string): string {
  return s.toLowerCase();
}

function RiskRow({
  risk,
  onResolve,
  busy
}: {
  risk: WisdomRisk;
  onResolve: () => void;
  busy: boolean;
}) {
  return (
    <article className={`sd-wisdom__risk sd-wisdom__risk--${severityClass(risk.severity)}`}>
      <div className="sd-wisdom__risk-head">
        <span className={`sd-wisdom__severity sd-wisdom__severity--${severityClass(risk.severity)}`}>
          {risk.severity}
        </span>
        <button type="button" className="sd-wisdom__resolve-one" disabled={busy} onClick={onResolve}>
          Resolve
        </button>
      </div>
      <p className="sd-wisdom__summary">{risk.summary}</p>
      <dl className="sd-wisdom__risk-meta">
        <div>
          <dt>Source doctrine</dt>
          <dd>{risk.source_doctrine}</dd>
        </div>
        <div>
          <dt>Conflicting task</dt>
          <dd>{risk.conflicting_task}</dd>
        </div>
        <div>
          <dt>Recommended correction</dt>
          <dd>{risk.recommended_correction}</dd>
        </div>
      </dl>
    </article>
  );
}

export function WisdomWatcherPanel({ onRefresh }: { onRefresh?: () => void | Promise<void> }) {
  const [panel, setPanel] = useState<WisdomWatchPanel | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMd, setReportMd] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/soledash/v1/wisdom-watcher", { cache: "no-store" });
    const data = await res.json();
    if (data.panel) setPanel(data.panel as WisdomWatchPanel);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(action: string, riskId?: string) {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/soledash/v1/wisdom-watcher/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, risk_id: riskId })
      });
      const data = await res.json();
      setStatus(data.result?.detail ?? data.error ?? "Done");
      await load();
      if (onRefresh) await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  async function openReport() {
    const res = await fetch("/api/soledash/v1/wisdom-watcher/report", { cache: "no-store" });
    const data = await res.json();
    if (data.markdown) {
      setReportMd(data.markdown as string);
      setReportOpen(true);
    }
  }

  if (loading && !panel) {
    return (
      <section className="sd-wisdom" aria-label="Wisdom Watcher">
        <p className="sd-wisdom__loading">Loading Wisdom Watch…</p>
      </section>
    );
  }

  if (!panel) return null;

  return (
    <section className="sd-wisdom" aria-label="Wisdom Watcher">
      <div className="sd-wisdom__head">
        <div>
          <p className="sd-wisdom__eyebrow">Speaker · doctrine conflict scan</p>
          <h2 className="sd-wisdom__title">Wisdom Watcher</h2>
          <p className="sd-wisdom__report-title">{panel.report.title}</p>
          <p className="sd-wisdom__hint">
            Top {panel.top_risks.length} conflicts affecting current work — not a 25-nugget dump.
          </p>
        </div>
        <time className="sd-wisdom__time" dateTime={panel.report.generated_at}>
          {panel.report.generated_at.slice(0, 19).replace("T", " ")} UTC
        </time>
      </div>

      {panel.parked ? (
        <p className="sd-wisdom__parked" role="status">
          Parked: {panel.parked_reason ?? "Operator parked this panel"}
        </p>
      ) : null}

      {panel.top_risks.length === 0 ? (
        <p className="sd-wisdom__empty">No active doctrine conflicts — or all marked resolved.</p>
      ) : (
        <div className="sd-wisdom__risks">
          {panel.top_risks.map((risk) => (
            <RiskRow
              key={risk.id}
              risk={risk}
              busy={busy}
              onResolve={() => void runAction("mark_resolved", risk.id)}
            />
          ))}
        </div>
      )}

      {status ? <p className="sd-wisdom__status">{status}</p> : null}

      <div className="sd-wisdom__actions">
        <button type="button" className="sd-wisdom__btn sd-wisdom__btn--report" disabled={busy} onClick={() => void openReport()}>
          OPEN REPORT
        </button>
        <button type="button" className="sd-wisdom__btn sd-wisdom__btn--petra" disabled={busy || panel.parked} onClick={() => void runAction("send_petra")}>
          SEND TO PETRA
        </button>
        <button type="button" className="sd-wisdom__btn sd-wisdom__btn--bean" disabled={busy || panel.parked} onClick={() => void runAction("send_bean")}>
          SEND TO BEAN
        </button>
        <button
          type="button"
          className="sd-wisdom__btn sd-wisdom__btn--resolved"
          disabled={busy || panel.parked || panel.top_risks.length === 0}
          onClick={() => panel.top_risks[0] && void runAction("mark_resolved", panel.top_risks[0].id)}
        >
          MARK RESOLVED
        </button>
        <button type="button" className="sd-wisdom__btn sd-wisdom__btn--park" disabled={busy} onClick={() => void runAction("park")}>
          PARK THIS
        </button>
      </div>

      {reportOpen && reportMd ? (
        <div className="auto-relay__modal-backdrop" role="presentation" onClick={() => setReportOpen(false)}>
          <div
            className="auto-relay__modal sd-wisdom__modal"
            role="dialog"
            aria-label="Wisdom Watch report"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auto-relay__modal-head">
              <h3>Wisdom Watch report</h3>
              <button type="button" onClick={() => setReportOpen(false)}>
                Close
              </button>
            </div>
            <pre className="sd-wisdom__report-body">{reportMd}</pre>
          </div>
        </div>
      ) : null}
    </section>
  );
}
