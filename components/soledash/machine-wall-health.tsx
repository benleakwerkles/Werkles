"use client";

import type { MachineHealthCard } from "@/lib/soledash/machine-wall/types";

function MachineHealthTile({ machine }: { machine: MachineHealthCard }) {
  return (
    <article
      className={`sd-mwall-tile sd-mwall-tile--${machine.level}`}
      tabIndex={0}
      aria-label={`${machine.label} ${machine.levelLabel}`}
    >
      <div className="sd-mwall-tile__face">
        <span className="sd-mwall-tile__badge" aria-hidden="true">
          {machine.emoji} {machine.levelLabel}
        </span>
        <h3 className="sd-mwall-tile__name">{machine.label}</h3>
        <p className="sd-mwall-tile__cousins">{machine.activeCousins}</p>
      </div>

      <div className="sd-mwall-tile__hover" role="tooltip">
        <p className="sd-mwall-tile__hover-title">
          {machine.emoji} {machine.label} · {machine.levelLabel}
        </p>
        <dl className="sd-mwall-tile__hover-facts">
          <div>
            <dt>Reason</dt>
            <dd>{machine.reason}</dd>
          </div>
          <div>
            <dt>Last healthy</dt>
            <dd>{machine.lastHealthy}</dd>
          </div>
          <div>
            <dt>Capabilities still available</dt>
            <dd>{machine.capabilities}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export function MachineWallHealth({
  machines,
  loading
}: {
  machines: MachineHealthCard[] | null;
  loading: boolean;
}) {
  if (loading && !machines) {
    return <p className="sd-mwall-health__empty">Reading fleet health…</p>;
  }

  if (!machines || machines.length === 0) {
    return <p className="sd-mwall-health__empty">Fleet health unavailable — refresh SoleDash.</p>;
  }

  return (
    <section className="sd-mwall-health" aria-label="Machine wall health">
      <p className="sd-mwall-health__lead">Hover a machine — reason, last healthy, and what still works.</p>
      <div className="sd-mwall-health__grid">
        {machines.map((machine) => (
          <MachineHealthTile key={machine.id} machine={machine} />
        ))}
      </div>
    </section>
  );
}
