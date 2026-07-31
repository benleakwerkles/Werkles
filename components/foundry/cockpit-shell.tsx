import type { ReactNode } from "react";
import { DraftReviewBadge } from "./draft-review-badge";

type CockpitShellProps = {
  children: ReactNode;
  showDraftBadge?: boolean;
  className?: string;
};

/* Default flipped off 2026-07-31 (Demo stranger-eyes review): the draft badge
   is internal scaffolding and was reaching public DOM on every cockpit page. */
export function CockpitShell({
  children,
  showDraftBadge = false,
  className = ""
}: CockpitShellProps) {
  return (
    <div className={`foundry-cockpit${className ? ` ${className}` : ""}`}>
      {showDraftBadge ? <DraftReviewBadge /> : null}
      {children}
    </div>
  );
}
