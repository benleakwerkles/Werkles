"use client";

import type { ReactNode } from "react";

export function AdvancedDetails({
  summary = "Advanced Details",
  className,
  children
}: {
  summary?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <details className={`sd-advanced ${className ?? ""}`.trim()}>
      <summary className="sd-advanced__summary">{summary}</summary>
      <div className="sd-advanced__body">{children}</div>
    </details>
  );
}
