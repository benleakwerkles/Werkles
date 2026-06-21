"use client";

import { useMemo, useState } from "react";

import {
  classifyGdCommand,
  formatGdCommandVerdict,
  type GdClassificationResult
} from "@/lib/gd-command-console";

const PLACEHOLDER = `State your intent in plain language. GD classifies the topic and routes crew by role — you do not pick cousins.

Examples:
• Review homepage visual narrative — four beats, no deploy
• Thread refresh for a new Cursor session
• Import rent roll and check capital allocation posture
• Hostile trust audit on membership flow
• Wire documentary nav icons locally, typecheck only`;

export function GdCommandConsoleClient() {
  const [intent, setIntent] = useState("");
  const [result, setResult] = useState<GdClassificationResult | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const formatted = useMemo(() => (result ? formatGdCommandVerdict(result) : ""), [result]);

  function handleRoute() {
    setResult(classifyGdCommand(intent));
    setCopyStatus(null);
  }

  async function handleCopyBrief() {
    if (!formatted) return;
    try {
      await navigator.clipboard.writeText(formatted);
      setCopyStatus("Copied governor brief.");
    } catch {
      setCopyStatus("Copy failed — select output manually.");
    }
  }

  return (
    <div className="gd-console">
      <header className="gd-console__header">
        <p className="eyebrow">GD Command Console</p>
        <h1>Intent governor</h1>
        <p className="gd-console__lede">
          You state the outcome. GD decides the mission class and routes cousins by seat — no paste mule, no crew
          picker. Preview only: deterministic keywords, draft packets, no external AI, no persistence.
        </p>
      </header>

      <div className="gd-console__grid">
        <section className="gd-console__input panel">
          <label htmlFor="gd-intent-input" className="gd-console__label">
            What do you want to do?
          </label>
          <textarea
            id="gd-intent-input"
            className="gd-console__textarea"
            rows={10}
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder={PLACEHOLDER}
          />
          <div className="gd-console__actions">
            <button className="button button-dark" type="button" onClick={handleRoute}>
              Route intent
            </button>
            <button
              className="button button-outline"
              type="button"
              onClick={handleCopyBrief}
              disabled={!formatted}
            >
              Copy governor brief
            </button>
          </div>
          {copyStatus ? (
            <p className="status-line" role="status">
              {copyStatus}
            </p>
          ) : null}
        </section>

        <section className="gd-console__output panel" aria-live="polite">
          <h2 className="gd-console__output-title">Governor routing</h2>
          {!result ? (
            <p className="gd-console__placeholder">
              Submit intent to see topic classification, auto-routed crew, gates, and draft packet.
            </p>
          ) : (
            <>
              <dl className="gd-console__meta">
                <div>
                  <dt>Verdict</dt>
                  <dd className={`gd-console__verdict gd-console__verdict--${result.verdict.toLowerCase()}`}>
                    {result.verdict.replace(/_/g, " ")}
                  </dd>
                </div>
                <div>
                  <dt>Topic</dt>
                  <dd>
                    <code>{result.missionClass}</code>
                    <span className="gd-console__meta-sub">{result.missionLabel}</span>
                  </dd>
                </div>
                <div className="gd-console__meta-wide">
                  <dt>About</dt>
                  <dd>{result.missionDescription}</dd>
                </div>
                <div className="gd-console__meta-wide">
                  <dt>Auto-routed crew</dt>
                  <dd>
                    {result.routedCrew.length ? (
                      <ul className="gd-console__crew">
                        {result.routedCrew.map((cousin) => (
                          <li key={cousin.id} className="gd-console__crew-item">
                            <span className="gd-console__crew-name">{cousin.label}</span>
                            <span className="gd-console__crew-seat">
                              {cousin.seat} · {cousin.platform}
                            </span>
                            {cousin.lens ? <span className="gd-console__crew-lens">{cousin.lens}</span> : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span>Cockpit direct — GD handles without cousin packets</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Synthesis lead</dt>
                  <dd>{result.synthesisLead ? (COUSIN_META_LABEL[result.synthesisLead] ?? result.synthesisLead) : "—"}</dd>
                </div>
                <div>
                  <dt>Dispatch class</dt>
                  <dd>
                    <code>{result.dispatchClass}</code>
                  </dd>
                </div>
                <div>
                  <dt>Risk</dt>
                  <dd className={`gd-console__risk gd-console__risk--${result.risk.toLowerCase()}`}>{result.risk}</dd>
                </div>
                <div>
                  <dt>Human gate</dt>
                  <dd>
                    {result.humanGate ? (
                      <>
                        <strong>{result.humanGateLevel}</strong>
                        <span className="gd-console__meta-sub">{result.humanGateNote}</span>
                      </>
                    ) : (
                      "None for this mission class"
                    )}
                  </dd>
                </div>
                <div className="gd-console__meta-wide">
                  <dt>Hard stops</dt>
                  <dd>
                    <ul className="gd-console__stops">
                      {result.hardStops.map((stop) => (
                        <li key={stop}>{stop}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>

              <h3 className="gd-console__packet-title">Draft packet (reference only)</h3>
              <pre className="gd-console__packet">{result.generatedPacket}</pre>

              <p className="gd-console__next">
                <strong>Governor next step:</strong> {result.nextAction}
              </p>

              <details className="gd-console__debug">
                <summary>Classifier debug</summary>
                <code>{result.matchedRules.join(", ")}</code>
              </details>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

const COUSIN_META_LABEL: Record<string, string> = {
  PETRA: "Petra",
  SKYBRO: "Skybro",
  ENDER: "Ender",
  BEAN: "Bean",
  COMPUTER: "Computer",
  MAKER: "Maker"
};
