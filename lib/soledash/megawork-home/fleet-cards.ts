import type { DecisionSurfaceView, FleetMachineCard, FleetMachineId } from "@/protocol/index";

import "server-only";

import { loadFleetState } from "./load-fleet-state";
import { buildBetsyFleetCard, mapFleetStateEntry, unknownPeerCard } from "./fleet-utils";

export function buildFleetCards(
  decisionView: DecisionSurfaceView,
  localMachine: FleetMachineId
): { fleet: FleetMachineCard[]; fleet_state_loaded: boolean; fleet_state_path: string | null } {
  const loaded = loadFleetState();
  const machines = loaded.ok ? loaded.file.machines : [];

  const betsy = buildBetsyFleetCard(
    decisionView,
    localMachine === "betsy",
    machines.find((m) => m.id === "betsy") ?? null
  );

  const fleet: FleetMachineCard[] = (["betsy", "doss", "sally", "spanzee"] as FleetMachineId[]).map(
    (id) => {
      if (id === "betsy") return betsy;
      const entry = machines.find((m) => m.id === id);
      if (entry) return mapFleetStateEntry(entry, id === localMachine);
      return unknownPeerCard(id);
    }
  );

  return {
    fleet,
    fleet_state_loaded: loaded.ok,
    fleet_state_path: loaded.ok ? loaded.source_path : null
  };
}
