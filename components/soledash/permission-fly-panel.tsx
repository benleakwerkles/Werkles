"use client";

import { useCallback, useEffect, useState } from "react";

import { PERMISSION_FLY_PRESETS } from "@/lib/soledash/permission-fly/presets";
import type { PermissionFlyPanel, PermissionFlyReceipt } from "@/lib/soledash/permission-fly/types";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm} UTC`;
  } catch {
    return iso;
  }
}

function formatReceiptReadable(receipt: PermissionFlyReceipt): { label: string; value: string }[] {
  return [
    { label: "Receipt ID", value: receipt.receipt_id },
    { label: "Action", value: receipt.action.replace(/_/g, " ") },
    { label: "Timestamp", value: receipt.timestamp },
    { label: "Source", value: receipt.source },
    { label: "Count", value: String(receipt.count) },
    { label: "Last occurrence", value: receipt.last_occurrence },
    { label: "Severity", value: receipt.severity },
    { label: "Classification", value: receipt.classification.replace(/_/g, " ") },
    { label: "Detail", value: receipt.detail ?? "—" },
    { label: "Receipt path", value: receipt.receipt_path },
    ...(receipt.dink_outbox_path ? [{ label: "Dink outbox", value: receipt.dink_outbox_path }] : [])
  ];
}

export function PermissionFlyPanel({ onRefresh }: { onRefresh?: () => void | Promise<void> }) {
  const [panel, setPanel] = useState<PermissionFlyPanel | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [receiptModal, setReceiptModal] = useState<PermissionFlyReceipt | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/soledash/v1/permission-fly", { cache: "no-store" });
    const data = await res.json();
    if (data.panel) setPanel(data.panel as PermissionFlyPanel);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(
    action: "report" | "send_to_dink" | "pre_approve" | "keep_asking",
    opts?: { preset_id?: string; fly_id?: string }
  ) {
    setBusy(true);
    setStatusLine(null);
    try {
      const res = await fetch("/api/soledash/v1/permission-fly/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...opts, fly_id: opts?.fly_id ?? panel?.active?.id })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusLine(data.error ?? "Action failed");
        return;
      }
      if (data.panel) setPanel(data.panel as PermissionFlyPanel);
      if (data.receipt) {
        const receipt = data.receipt as PermissionFlyReceipt;
        if (action === "report") {
          setStatusLine(`Fly logged · count ${receipt.count} · ${receipt.source}`);
        } else {
          setReceiptModal(receipt);
          setStatusLine(`Receipt · ${receipt.receipt_path}`);
        }
      } else {
        setStatusLine("Done");
      }
      if (onRefresh) await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  async function quickAdd(presetId: string) {
    await runAction("report", { preset_id: presetId });
  }

  async function openLastReceipt() {
    const res = await fetch("/api/soledash/v1/permission-fly/receipt", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.receipt) setReceiptModal(data.receipt as PermissionFlyReceipt);
      return;
    }
    if (panel?.last_receipt) setReceiptModal(panel.last_receipt);
  }

  const active = panel?.active;

  if (loading && !panel) {
    return (
      <section className="sd-pfly" aria-label="Permission flies">
        <p className="sd-pfly__loading">Loading permission flies…</p>
      </section>
    );
  }

  return (
    <section className="sd-pfly" aria-label="Permission flies">
      <div className="sd-pfly__head">
        <p className="sd-pfly__eyebrow">Operator friction · LightTrip</p>
        <h2 className="sd-pfly__title">PERMISSION FLIES</h2>
        <p className="sd-pfly__hint">One tap to report — disposition with Dink / pre-approve / keep asking.</p>
      </div>

      <div className="sd-pfly__quick" aria-label="Quick add">
        {PERMISSION_FLY_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="sd-pfly__quick-btn"
            disabled={busy}
            onClick={() => void quickAdd(preset.id)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <dl className="sd-pfly__fields">
        <div>
          <dt>Source</dt>
          <dd>{active?.source ?? "—"}</dd>
        </div>
        <div>
          <dt>Count</dt>
          <dd>{active?.count ?? "—"}</dd>
        </div>
        <div>
          <dt>Last occurrence</dt>
          <dd>{active ? formatTime(active.last_occurrence) : "—"}</dd>
        </div>
        <div>
          <dt>Severity</dt>
          <dd>{active?.severity ?? "—"}</dd>
        </div>
        <div>
          <dt>Classification</dt>
          <dd className={`sd-pfly__class sd-pfly__class--${active?.classification ?? "none"}`}>
            {active?.classification?.replace(/_/g, " ") ?? "—"}
          </dd>
        </div>
      </dl>

      {statusLine ? <p className="sd-pfly__status">{statusLine}</p> : null}

      <div className="sd-pfly__actions">
        <button
          type="button"
          className="sd-pfly__btn sd-pfly__btn--dink"
          disabled={busy || !active}
          onClick={() => void runAction("send_to_dink")}
        >
          {busy ? "…" : "SEND TO DINK"}
        </button>
        <button
          type="button"
          className="sd-pfly__btn sd-pfly__btn--pre"
          disabled={busy || !active}
          onClick={() => void runAction("pre_approve")}
        >
          PRE-APPROVE
        </button>
        <button
          type="button"
          className="sd-pfly__btn sd-pfly__btn--keep"
          disabled={busy || !active}
          onClick={() => void runAction("keep_asking")}
        >
          KEEP ASKING
        </button>
        <button
          type="button"
          className="sd-pfly__btn sd-pfly__btn--receipt"
          disabled={!active && !panel?.last_receipt}
          onClick={() => void openLastReceipt()}
        >
          OPEN RECEIPT
        </button>
      </div>

      {receiptModal ? (
        <div className="auto-relay__modal-backdrop" role="presentation" onClick={() => setReceiptModal(null)}>
          <div
            className="auto-relay__modal sd-pfly__modal"
            role="dialog"
            aria-label="Permission fly receipt"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auto-relay__modal-head">
              <h3>Permission fly receipt</h3>
              <button type="button" onClick={() => setReceiptModal(null)}>
                Close
              </button>
            </div>
            <dl className="auto-relay__receipt-readable">
              {formatReceiptReadable(receiptModal).map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : null}
    </section>
  );
}
