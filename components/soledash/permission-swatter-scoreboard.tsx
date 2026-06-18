"use client";

import { usePermissionSwatterScoreboard } from "@/lib/soledash/permission-swatter/use-scoreboard";

export function PermissionSwatterScoreboard() {
  const { scoreboard, loading } = usePermissionSwatterScoreboard();
  const display = scoreboard?.display ?? (loading ? "·········" : "000000000");

  return (
    <div className="sd-wonka-score" aria-label="Permissions swatted scoreboard" aria-live="polite">
      <p className="sd-wonka-score__label">Permissions Swatted</p>
      <p className="sd-wonka-score__digits" aria-label={`${scoreboard?.total ?? 0} permissions swatted`}>
        {display}
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
