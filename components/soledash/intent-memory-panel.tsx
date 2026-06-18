"use client";

import { useState } from "react";

import type { CousinId } from "@/lib/soledash/command-surface/types";
import type { IntentMemoryPanel } from "@/lib/soledash/intent-memory/types";

const ROUTE_OPTIONS: { id: CousinId; label: string }[] = [
  { id: "MAKER", label: "Maker" },
  { id: "DINK", label: "Dink" },
  { id: "PETRA", label: "Petra" },
  { id: "BEAN", label: "Bean" },
  { id: "ENDER", label: "Ender" },
  { id: "SKYBRO", label: "Skybro" },
  { id: "COMPUTER", label: "Thufir" }
];

function confidenceClass(c: string): string {
  return c.toLowerCase();
}

export function IntentMemoryPanelView({
  panel,
  busy,
  onPanelChange,
  onDone,
  onRefresh
}: {
  panel: IntentMemoryPanel;
  busy: boolean;
  onPanelChange: (panel: IntentMemoryPanel | null) => void;
  onDone: (detail: string, ok: boolean) => void;
  onRefresh?: () => void | Promise<void>;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [routePick, setRoutePick] = useState<CousinId>(panel.selected_owner.cousin);
  const [status, setStatus] = useState<string | null>(null);

  async function runAction(
    action: "continue" | "edit_route" | "send_petra" | "send_bean" | "park",
    cousin?: CousinId
  ) {
    setStatus(null);
    const res = await fetch("/api/soledash/v1/intent-memory/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        panel,
        cousin: cousin ?? panel.selected_owner.cousin,
        park_reason: action === "park" ? "Operator parked from Intent Memory" : undefined
      })
    });
    const data = await res.json();
    setStatus(data.result?.detail ?? data.error ?? "Done");

    if (data.panel) {
      onPanelChange(data.panel as IntentMemoryPanel);
      setRoutePick((data.panel as IntentMemoryPanel).selected_owner.cousin);
      if (action === "edit_route") setEditOpen(false);
    } else if (data.result?.ok || action === "park") {
      onPanelChange(null);
      onDone(data.result?.detail ?? "Intent handled", Boolean(data.result?.ok ?? action === "park"));
      if (onRefresh) await onRefresh();
    } else {
      onDone(data.result?.detail ?? "Action blocked", false);
    }
  }

  return (
    <section className="sd-intent" aria-label="Intent Memory">
      <div className="sd-intent__head">
        <div>
          <p className="sd-intent__eyebrow">Memory-informed dispatch</p>
          <h2 className="sd-intent__title">Intent Memory</h2>
          <p className="sd-intent__hint">Helpful context before you approve dispatch — not a warning wall.</p>
        </div>
        <span className={`sd-intent__confidence sd-intent__confidence--${confidenceClass(panel.route_confidence)}`}>
          Route confidence · {panel.route_confidence}
        </span>
      </div>

      <div className="sd-intent__interpreted">
        <p className="sd-intent__label">Interpreted command</p>
        <p className="sd-intent__command">{panel.interpreted_command}</p>
        <p className="sd-intent__raw">{panel.raw_command}</p>
      </div>

      {panel.prior_findings.length > 0 ? (
        <div className="sd-intent__findings">
          <p className="sd-intent__label">Relevant context ({panel.prior_findings.length})</p>
          <ul className="sd-intent__finding-list">
            {panel.prior_findings.map((f) => (
              <li key={f.id} className="sd-intent__finding">
                <div className="sd-intent__finding-head">
                  <span className="sd-intent__finding-kind">{f.label}</span>
                  <span className={`sd-intent__finding-confidence sd-intent__finding-confidence--${f.confidence}`}>
                    {f.confidence}
                  </span>
                </div>
                <p className="sd-intent__finding-summary">{f.summary}</p>
                {f.detail ? <p className="sd-intent__finding-detail">{f.detail}</p> : null}
                <dl className="sd-intent__finding-meta">
                  <div>
                    <dt>Source</dt>
                    <dd>{f.source}</dd>
                  </div>
                  <div>
                    <dt>Why it matters now</dt>
                    <dd>{f.why_it_matters_now}</dd>
                  </div>
                  <div>
                    <dt>Recommended caution</dt>
                    <dd>{f.recommended_caution}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="sd-intent__empty">No strong memory matches — route from mission class only.</p>
      )}

      <div className="sd-intent__route">
        <p className="sd-intent__label">Selected owner recommendation</p>
        <p className="sd-intent__owner">
          <strong>{panel.selected_owner.cousin}</strong> @ {panel.selected_owner.machine}
        </p>
        <p className="sd-intent__owner-reason">{panel.selected_owner.reason}</p>
        <p className="sd-intent__confidence-note">{panel.route_confidence_note}</p>
      </div>

      {editOpen ? (
        <div className="sd-intent__edit-route">
          <label className="sd-intent__edit-label">
            Edit route
            <select
              value={routePick}
              disabled={busy}
              onChange={(e) => setRoutePick(e.target.value as CousinId)}
            >
              {ROUTE_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="sd-intent__btn sd-intent__btn--edit-save"
            disabled={busy}
            onClick={() => void runAction("edit_route", routePick)}
          >
            Save route
          </button>
        </div>
      ) : null}

      {status ? <p className="sd-intent__status">{status}</p> : null}

      <div className="sd-intent__actions">
        <button
          type="button"
          className="sd-intent__btn sd-intent__btn--continue"
          disabled={busy}
          onClick={() => void runAction("continue")}
        >
          CONTINUE
        </button>
        <button
          type="button"
          className="sd-intent__btn sd-intent__btn--edit"
          disabled={busy}
          onClick={() => setEditOpen((v) => !v)}
        >
          EDIT ROUTE
        </button>
        <button
          type="button"
          className="sd-intent__btn sd-intent__btn--petra"
          disabled={busy}
          onClick={() => void runAction("send_petra")}
        >
          SEND TO PETRA
        </button>
        <button
          type="button"
          className="sd-intent__btn sd-intent__btn--bean"
          disabled={busy}
          onClick={() => void runAction("send_bean")}
        >
          SEND TO BEAN
        </button>
        <button
          type="button"
          className="sd-intent__btn sd-intent__btn--park"
          disabled={busy}
          onClick={() => void runAction("park")}
        >
          PARK
        </button>
      </div>
    </section>
  );
}
