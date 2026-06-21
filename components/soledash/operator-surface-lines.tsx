"use client";

import type { ReactNode } from "react";

export function OperatorSurfaceLines({
  intent,
  status,
  receipt
}: {
  intent: ReactNode;
  status: ReactNode;
  receipt: ReactNode;
}) {
  return (
    <dl className="sd-op-surface">
      <div className="sd-op-surface__row">
        <dt>Intent</dt>
        <dd>{intent}</dd>
      </div>
      <div className="sd-op-surface__row">
        <dt>Status</dt>
        <dd>{status}</dd>
      </div>
      <div className="sd-op-surface__row">
        <dt>Receipt</dt>
        <dd>{receipt}</dd>
      </div>
    </dl>
  );
}
