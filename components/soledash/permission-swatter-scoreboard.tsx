"use client";

import { usePermissionSwatterScoreboard } from "@/lib/soledash/permission-swatter/use-scoreboard";

export function PermissionSwatterScoreboard() {
  const { scoreboard, loading } = usePermissionSwatterScoreboard();
  const total = scoreboard?.total ?? 0;

  return (
    <div className="sd-wonka-score" aria-label="Permissions swatted scoreboard" aria-live="polite">
      <p className="sd-wonka-score__label">Permissions Swatted:</p>
      <p className="sd-wonka-score__digits" aria-label={`${total} permissions swatted`}>
        {loading && !scoreboard ? "…" : total.toLocaleString()}
      </p>
      {!loading && scoreboard ? (
        <p className="sd-wonka-score__meta">
          {scoreboard.approval_suppressed} suppressed · {scoreboard.permission_swatted} permission flies
        </p>
      ) : (
        <p className="sd-wonka-score__meta">Counting real swatter receipts…</p>
      )}
    </div>
  );
}
