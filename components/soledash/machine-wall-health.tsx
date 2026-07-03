"use client";

import type { MachineHealthCard } from "@/lib/soledash/machine-wall/types";

function reachabilityIcon(status: MachineHealthCard["machineStatus"]): string {
  if (status === "reachable") return "🟢";
  if (status === "unreachable") return "🔴";
  return "🟡";
}

function reachabilityLabel(status: MachineHealthCard["machineStatus"]): string {
  if (status === "reachable") return "Reachable";
  if (status === "unreachable") return "Unreachable";
  return "Unknown";
}

function MachineHealthTile({ machine }: { machine: MachineHealthCard }) {
  return (
    <article
      className={`sd-mwall-tile sd-mwall-tile--${machine.level}`}
      tabIndex={0}
      aria-label={`${machine.label}. Machine ${reachabilityLabel(machine.machineStatus)}. Remote ${reachabilityLabel(machine.remoteStatus)}.`}
    >
      <div className="sd-mwall-tile__face">
        <h3 className="sd-mwall-tile__name">{machine.label}</h3>
        <dl className="sd-mwall-tile__status-list">
          <div className={`sd-mwall-tile__status sd-mwall-tile__status--${machine.machineStatus}`}>
            <dt>{reachabilityIcon(machine.machineStatus)} Machine</dt>
            <dd>{reachabilityLabel(machine.machineStatus)}</dd>
          </div>
          <div className={`sd-mwall-tile__status sd-mwall-tile__status--${machine.remoteStatus}`}>
            <dt>{reachabilityIcon(machine.remoteStatus)} Remote</dt>
            <dd>{reachabilityLabel(machine.remoteStatus)}</dd>
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
      <p className="sd-mwall-health__lead">Reachable, Unreachable, or Unknown.</p>
      <div className="sd-mwall-health__grid">
        {machines.map((machine) => (
          <MachineHealthTile key={machine.id} machine={machine} />
        ))}
      </div>
    </section>
  );
}
