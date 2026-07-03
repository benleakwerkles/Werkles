"use client";

import { PermissionSwatterScoreboard } from "@/components/soledash/permission-swatter-scoreboard";
import { usePermissionSwatterScoreboard } from "@/lib/soledash/permission-swatter/use-scoreboard";

function kindLabel(kind: string): string {
  if (kind === "approval_suppressed") return "Suppressed";
  if (kind === "permission_swatted") return "Swatted";
  return kind.replace(/_/g, " ");
}

export function PermissionSwatterReceiptLog() {
  const { entries, loading, reload } = usePermissionSwatterScoreboard();
  const latestSwats = entries.slice(0, 5);

  return (
    <section className="sd-swatter-log" aria-label="Swatter receipt log">
      <PermissionSwatterScoreboard />
      <div className="sd-swatter-log__head">
        <h3 className="sd-swatter-log__title">Last 5 Swats</h3>
        <button type="button" className="sd-swatter-log__refresh" disabled={loading} onClick={() => void reload()}>
          {loading ? "Refreshing…" : "Refresh log"}
        </button>
      </div>
      {loading && latestSwats.length === 0 ? (
        <p className="sd-swatter-log__empty">Loading swatter receipts…</p>
      ) : latestSwats.length === 0 ? (
        <p className="sd-swatter-log__empty">No swatter receipts yet — counter stays at zero.</p>
      ) : (
        <ol className="sd-swatter-log__list">
          {latestSwats.map((entry) => (
            <li key={entry.id} className="sd-swatter-log__entry">
              <div className="sd-swatter-log__entry-head">
                <span className="sd-swatter-log__badges">
                  <span className={`sd-swatter-log__kind sd-swatter-log__kind--${entry.kind}`}>
                    {kindLabel(entry.kind)}
                  </span>
                  {entry.correction.corrected ? (
                    <span className="sd-swatter-log__correction">Correction</span>
                  ) : null}
                </span>
                <time className="sd-swatter-log__time" dateTime={entry.timestamp}>
                  {new Date(entry.timestamp).toLocaleString()}
                </time>
              </div>
              <p className="sd-swatter-log__label">{entry.label}</p>
              <p className="sd-swatter-log__detail">
                <strong>Reason:</strong> {entry.detail}
              </p>
              {entry.correction.corrected ? (
                <p className="sd-swatter-log__correction-note">
                  False swat corrected{entry.correction.reason ? `: ${entry.correction.reason}` : "."}
                </p>
              ) : null}
              <p className="sd-swatter-log__path">
                <code>{entry.source_file}</code>
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
