"use client";

import { useEffect, useState } from "react";

type DriftItem = Record<string, unknown>;

function asDriftItems(value: unknown): DriftItem[] {
  return Array.isArray(value) ? (value as DriftItem[]) : [value as DriftItem];
}

export function DriftLogFooter() {
  const [items, setItems] = useState<DriftItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let disposed = false;

    async function loadDriftLog() {
      try {
        const response = await fetch("/api/tinkerden/drift-log", { cache: "no-store" });
        const payload = await response.json();
        if (!disposed) {
          setItems(asDriftItems(payload));
          setLoaded(true);
        }
      } catch (error) {
        if (!disposed) {
          setItems([
            {
              id: "drift_footer_fetch_blocked",
              timestamp: new Date().toISOString(),
              sensor: "TinkerDenUI",
              severity: "WOUND",
              code: "DRIFT_LOG_FETCH_BLOCKED",
              message: error instanceof Error ? error.message : "Drift Log fetch failed",
              source_path: "/api/tinkerden/drift-log"
            }
          ]);
          setLoaded(true);
        }
      }
    }

    loadDriftLog();
    const interval = window.setInterval(loadDriftLog, 10000);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, []);

  const driftText = loaded ? JSON.stringify(items) : "[]";

  return (
    <footer className="td-drift-footer" data-drift-log-footer data-drift-log-count={items.length} aria-live="polite">
      <span className="td-drift-footer__label">DRIFT LOG</span>
      <div className="td-drift-footer__viewport">
        <code className="td-drift-footer__ticker" data-drift-log-ticker>{driftText}</code>
      </div>
      <style>{`
        .td-bridge {
          padding-bottom: max(64px, env(safe-area-inset-bottom));
        }

        .td-drift-footer {
          position: fixed;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 80;
          display: grid;
          grid-template-columns: max-content minmax(0, 1fr);
          align-items: center;
          gap: 12px;
          min-height: 38px;
          padding: 7px 14px calc(7px + env(safe-area-inset-bottom));
          overflow: hidden;
          border-top: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(18, 18, 19, 0.96);
          color: #ecebea;
          box-shadow: 0 -12px 28px rgba(0, 0, 0, 0.24);
        }

        .td-drift-footer__label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 86px;
          min-height: 24px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #cfcac2;
          font-family: var(--font-geist-mono), Consolas, monospace;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0;
        }

        .td-drift-footer__viewport {
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
        }

        .td-drift-footer__ticker {
          display: inline-block;
          color: #f2eee7;
          font-family: var(--font-geist-mono), Consolas, monospace;
          font-size: 0.72rem;
          line-height: 1.4;
          letter-spacing: 0;
          white-space: nowrap;
          will-change: transform;
        }

        @media (prefers-reduced-motion: no-preference) {
          .td-drift-footer__ticker {
            padding-left: 100%;
            animation: td-drift-scroll 55s linear infinite;
          }
        }

        @keyframes td-drift-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </footer>
  );
}
