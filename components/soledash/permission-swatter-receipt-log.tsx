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

  return (
    <section className="sd-swatter-log" aria-label="Swatter receipt log">
      <PermissionSwatterScoreboard />
      <div className="sd-swatter-log__head">
        <h3 className="sd-swatter-log__title">Swatter receipt log</h3>
        <button type="button" className="sd-swatter-log__refresh" disabled={loading} onClick={() => void reload()}>
          {loading ? "Refreshing…" : "Refresh log"}
        </button>
      </div>
      {loading && entries.length === 0 ? (
        <p className="sd-swatter-log__empty">Loading swatter receipts…</p>
      ) : entries.length === 0 ? (
        <p className="sd-swatter-log__empty">No swatter receipts yet — counter stays at zero.</p>
      ) : (
        <ol className="sd-swatter-log__list">
          {entries.map((entry) => (
            <li key={entry.id} className="sd-swatter-log__entry">
              <div className="sd-swatter-log__entry-head">
                <span className={`sd-swatter-log__kind sd-swatter-log__kind--${entry.kind}`}>
                  {kindLabel(entry.kind)}
                </span>
                <time className="sd-swatter-log__time" dateTime={entry.timestamp}>
                  {new Date(entry.timestamp).toLocaleString()}
                </time>
              </div>
              <p className="sd-swatter-log__label">{entry.label}</p>
              <p className="sd-swatter-log__detail">{entry.detail}</p>
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
