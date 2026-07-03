"use client";

import { usePetraStatus } from "@/lib/soledash/petra-status/use-petra-status";

export function PetraStatusPanel() {
  const { status, loading } = usePetraStatus();

  const primary = status?.primary ?? (loading ? "…" : "Petra (Comptroller)");
  const machine = status?.machine ?? (loading ? "…" : "—");
  const lastVerdict = status?.last_verdict ?? (loading ? "Loading…" : "—");
  const lastSpof = status?.last_spof ?? (loading ? "Loading…" : "—");
  const heartbeat = status?.heartbeat ?? (loading ? "Loading…" : "—");

  return (
    <section className="sd-petra-status" aria-label="Petra status" aria-live="polite">
      <dl className="sd-petra-status__grid">
        <div className="sd-petra-status__row">
          <dt>Petra Primary</dt>
          <dd>{primary}</dd>
        </div>
        <div className="sd-petra-status__row">
          <dt>Machine</dt>
          <dd>{machine}</dd>
        </div>
        <div className="sd-petra-status__row">
          <dt>Last Verdict</dt>
          <dd>{lastVerdict}</dd>
        </div>
        <div className="sd-petra-status__row">
          <dt>Last SPOF</dt>
          <dd>{lastSpof}</dd>
        </div>
        <div className="sd-petra-status__row">
          <dt>Heartbeat</dt>
          <dd>{heartbeat}</dd>
        </div>
      </dl>
    </section>
  );
}
