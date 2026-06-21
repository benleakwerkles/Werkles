"use client";

import { useState } from "react";

import type { RelayResultTranslation } from "@/lib/soledash/automatica-relay/artifact-types";

export function RelayResultPanel({
  translation,
  onOpenReceipt,
  canOpenReceipt,
  compact
}: {
  translation: RelayResultTranslation;
  onOpenReceipt?: () => void;
  canOpenReceipt?: boolean;
  compact?: boolean;
}) {
  const [rawOpen, setRawOpen] = useState(false);

  return (
    <section
      className={`sd-relay-result ${compact ? "sd-relay-result--compact" : ""}`}
      aria-label="Result summary"
    >
      <p className="sd-relay-result__eyebrow">Result</p>
      <dl className="sd-relay-result__plain">
        <div>
          <dt>What happened</dt>
          <dd>{translation.whatHappened}</dd>
        </div>
        <div>
          <dt>Why it matters</dt>
          <dd>{translation.whyItMatters}</dd>
        </div>
        <div>
          <dt>What action is needed</dt>
          <dd>{translation.actionNeeded}</dd>
        </div>
      </dl>

      {translation.rawLines.length > 0 ? (
        <div className="sd-relay-result__raw-wrap">
          <button
            type="button"
            className="sd-relay-result__raw-toggle"
            aria-expanded={rawOpen}
            onClick={() => setRawOpen((v) => !v)}
          >
            {rawOpen ? "Hide raw output" : "Show raw output"}
          </button>
          {rawOpen ? (
            <dl className="sd-relay-result__raw">
              {translation.rawLines.map((row) => (
                <div key={row.label} className="sd-relay-result__raw-row">
                  <dt>{row.label}</dt>
                  <dd>
                    <pre className="sd-relay-result__raw-value">{row.value}</pre>
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}

      {canOpenReceipt && onOpenReceipt ? (
        <button type="button" className="sd-relay-result__receipt-btn" onClick={onOpenReceipt}>
          Open receipt JSON
        </button>
      ) : null}
    </section>
  );
}
