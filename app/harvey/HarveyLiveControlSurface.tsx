"use client";

import HarveyFleetControls from "./HarveyFleetControls";
import HarveyMachineControls from "./HarveyMachineControls";
import { useHarveySnapshotState } from "./HarveyLiveCockpit";

type MachineTarget = { id?: string; name: string; role?: string };

export default function HarveyLiveControlSurface({ machines }: { machines: MachineTarget[] }) {
  const { snapshot, transport } = useHarveySnapshotState();
  const liveMachines = transport === "CURRENT"
    ? snapshot.machines.filter((machine) => machine.connectivity === "LIVE")
    : [];
  const knockCapableMachines = liveMachines.filter((machine) => machine.capabilities.includes("KNOCK")).map((machine) => machine.machine);

  return (
    <>
      <HarveyFleetControls knockCapableMachines={knockCapableMachines} />
      <section style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ color: "#fff4d6" }}>Operator command targets</h2>
        <p style={{ color: "#89928c" }}>Canonical machine names only. Controls follow the current snapshot and fail closed whenever transport or Handeye proof is lost.</p>
        <div style={{ display: "grid", gap: 10 }}>
          {machines.map((machine) => (
            <article key={machine.id ?? machine.name} style={{ display: "grid", gridTemplateColumns: "minmax(min(130px,100%),.7fr) minmax(0,2fr)", gap: 16, padding: 16, border: "1px solid #343a36", borderRadius: 10, background: "#121619" }}>
              <div><strong style={{ color: "#fff4d6", fontSize: 20, fontWeight: 900 }}>{machine.name}</strong></div>
              <div>
                <span>{machine.role ?? "Candidate Aeye host"}</span>
                <HarveyMachineControls
                  machine={machine.name}
                  enabled={liveMachines.some((live) => live.machine === machine.name)}
                  capabilities={liveMachines.find((live) => live.machine === machine.name)?.capabilities ?? []}
                  workstreamId={machine.name === "Doss" ? "harvey-command" : undefined}
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
