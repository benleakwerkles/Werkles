"use client";

import { useCallback, useEffect, useState } from "react";

import { FOCUS_THEFT_PRESETS } from "@/lib/soledash/focus-theft/presets";
import type { FocusTheftReceipt, FocusTheftSeverity } from "@/lib/soledash/focus-theft/types";

function formatReceiptReadable(receipt: FocusTheftReceipt): { label: string; value: string }[] {
  return [
    { label: "Incident ID", value: receipt.incident_id },
    { label: "Timestamp", value: receipt.timestamp },
    { label: "Source app", value: receipt.source_app },
    { label: "Notification", value: receipt.notification_text },
    { label: "What Ben was doing", value: receipt.what_ben_was_doing || "—" },
    { label: "Severity", value: receipt.severity },
    { label: "Repeat offender", value: receipt.repeat_offender ? "YES" : "no" },
    { label: "Reported to", value: receipt.reported_to },
    { label: "Receipt path", value: receipt.receipt_path },
    ...(receipt.dink_outbox_path ? [{ label: "Dink outbox", value: receipt.dink_outbox_path }] : [])
  ];
}

const DEFAULT_PRESET = FOCUS_THEFT_PRESETS[0];

export function FocusTheftReportCard({ onRefresh }: { onRefresh?: () => void | Promise<void> }) {
  const [sourceApp, setSourceApp] = useState(DEFAULT_PRESET.source_app);
  const [notificationText, setNotificationText] = useState(DEFAULT_PRESET.notification_text);
  const [whatDoing, setWhatDoing] = useState(DEFAULT_PRESET.what_ben_was_doing);
  const [severity, setSeverity] = useState<FocusTheftSeverity>(DEFAULT_PRESET.severity);
  const [timestamp] = useState(() => new Date().toISOString());
  const [busy, setBusy] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<FocusTheftReceipt | null>(null);
  const [receiptModal, setReceiptModal] = useState<FocusTheftReceipt | null>(null);
  const [statusLine, setStatusLine] = useState<string | null>(null);

  const loadLast = useCallback(async () => {
    try {
      const res = await fetch("/api/soledash/v1/focus-theft/receipt", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.receipt) setLastReceipt(data.receipt as FocusTheftReceipt);
      }
    } catch {
      /* no receipts yet */
    }
  }, []);

  useEffect(() => {
    void loadLast();
  }, [loadLast]);

  function applyPreset(presetId: string) {
    const preset = FOCUS_THEFT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSourceApp(preset.source_app);
    setNotificationText(preset.notification_text);
    setWhatDoing(preset.what_ben_was_doing);
    setSeverity(preset.severity);
  }

  async function submit(opts: { repeatOffender?: boolean; presetId?: string } = {}) {
    setBusy(true);
    setStatusLine(null);
    try {
      const res = await fetch("/api/soledash/v1/focus-theft/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preset_id: opts.presetId,
          source_app: sourceApp,
          notification_text: notificationText,
          what_ben_was_doing: whatDoing,
          severity,
          repeat_offender: opts.repeatOffender ?? false
        })
      });
      const data = await res.json();
      if (!res.ok || !data.receipt) {
        setStatusLine(data.error ?? "Report failed");
        return;
      }
      const receipt = data.receipt as FocusTheftReceipt;
      setLastReceipt(receipt);
      setReceiptModal(receipt);
      setStatusLine(`Receipt written — ${receipt.receipt_path}`);
      if (onRefresh) await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  async function quickReportPreset(presetId: string) {
    applyPreset(presetId);
    await submit({ presetId });
  }

  return (
    <section className="focus-theft" aria-label="Focus thief report">
      <div className="focus-theft__head">
        <div>
          <p className="focus-theft__eyebrow">Operator incident · LightTrip</p>
          <h2 className="focus-theft__title">FOCUS THIEF REPORT</h2>
          <p className="focus-theft__hint">Report focus-stealing popups — receipt always written locally; Dink outbox when path available.</p>
        </div>
      </div>

      <div className="focus-theft__quick" aria-label="Quick presets">
        {FOCUS_THEFT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="focus-theft__quick-btn"
            disabled={busy}
            onClick={() => void quickReportPreset(preset.id)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <dl className="focus-theft__form">
        <div>
          <dt>Source app</dt>
          <dd>
            <input
              type="text"
              className="focus-theft__input"
              value={sourceApp}
              disabled={busy}
              onChange={(e) => setSourceApp(e.target.value)}
            />
          </dd>
        </div>
        <div>
          <dt>Notification text</dt>
          <dd>
            <input
              type="text"
              className="focus-theft__input"
              value={notificationText}
              disabled={busy}
              onChange={(e) => setNotificationText(e.target.value)}
            />
          </dd>
        </div>
        <div>
          <dt>What Ben was doing</dt>
          <dd>
            <input
              type="text"
              className="focus-theft__input"
              value={whatDoing}
              disabled={busy}
              onChange={(e) => setWhatDoing(e.target.value)}
            />
          </dd>
        </div>
        <div>
          <dt>Timestamp</dt>
          <dd>
            <input type="text" className="focus-theft__input focus-theft__input--readonly" value={timestamp} readOnly />
          </dd>
        </div>
        <div>
          <dt>Severity</dt>
          <dd>
            <select
              className="focus-theft__select"
              value={severity}
              disabled={busy}
              onChange={(e) => setSeverity(e.target.value as FocusTheftSeverity)}
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
          </dd>
        </div>
      </dl>

      {statusLine ? <p className="focus-theft__status">{statusLine}</p> : null}

      <div className="focus-theft__actions">
        <button
          type="button"
          className="focus-theft__btn focus-theft__btn--report"
          disabled={busy || !sourceApp.trim() || !notificationText.trim()}
          onClick={() => void submit()}
        >
          {busy ? "Reporting…" : "REPORT TO DINK"}
        </button>
        <button
          type="button"
          className="focus-theft__btn focus-theft__btn--repeat"
          disabled={busy || !sourceApp.trim() || !notificationText.trim()}
          onClick={() => void submit({ repeatOffender: true })}
        >
          MARK REPEAT OFFENDER
        </button>
        <button
          type="button"
          className="focus-theft__btn focus-theft__btn--receipt"
          disabled={!lastReceipt}
          onClick={() => lastReceipt && setReceiptModal(lastReceipt)}
        >
          OPEN RECEIPT
        </button>
      </div>

      {receiptModal ? (
        <div className="auto-relay__modal-backdrop" role="presentation" onClick={() => setReceiptModal(null)}>
          <div
            className="auto-relay__modal"
            role="dialog"
            aria-label="Focus theft receipt"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auto-relay__modal-head">
              <h3>Focus theft receipt</h3>
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
