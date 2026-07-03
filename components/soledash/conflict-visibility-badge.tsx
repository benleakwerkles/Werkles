"use client";

import {
  conflictBadgeLabel,
  type ConflictVisibility
} from "@/lib/soledash/conflict-visibility/types";

export function ConflictVisibilityBadge({ conflict }: { conflict: ConflictVisibility }) {
  const label = conflictBadgeLabel(conflict);
  const slug = conflict.state.toLowerCase().replace(/_/g, "-");

  return (
    <div className={`sd-conflict-badge sd-conflict-badge--${slug}`} aria-label={`Conflict state: ${label}`}>
      <p className="sd-conflict-badge__label">{label}</p>
      {conflict.state === "CLEAR" ? null : (
        <dl className="sd-conflict-badge__facts">
          {conflict.blockingCard ? (
            <div>
              <dt>Blocking card</dt>
              <dd>
                <code>{conflict.blockingCard}</code>
              </dd>
            </div>
          ) : null}
          {conflict.branch ? (
            <div>
              <dt>Branch</dt>
              <dd>{conflict.branch}</dd>
            </div>
          ) : null}
          {conflict.owner ? (
            <div>
              <dt>Owner</dt>
              <dd>{conflict.owner}</dd>
            </div>
          ) : null}
          {conflict.reason ? (
            <div className="sd-conflict-badge__wide">
              <dt>Reason</dt>
              <dd>{conflict.reason}</dd>
            </div>
          ) : null}
        </dl>
      )}
    </div>
  );
}
