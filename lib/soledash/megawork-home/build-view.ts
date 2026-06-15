import type { MegaWorkHomeView } from "@/protocol/index";

import "server-only";

import { buildDecisionSurfaceView } from "@/lib/soledash/decision-surface/load-contract";

import { buildFleetCards } from "./fleet-cards";

export const MEGAWORK_CURRENT_MISSION = "Werkles MegaWork Tweakscape Uniformity";

export type FleetMachineId = import("@/protocol/index").FleetMachineId;

export function resolveLocalFleetMachine(machineLabel: string): FleetMachineId {
  const lower = machineLabel.toLowerCase();
  if (lower.includes("doss")) return "doss";
  if (lower.includes("sally")) return "sally";
  if (lower.includes("spanzee")) return "spanzee";
  return "betsy";
}

export function buildMegaWorkHomeView(machineLabel = "Betsy"): MegaWorkHomeView {
  const decisionView = buildDecisionSurfaceView(machineLabel);
  const activeMachine = resolveLocalFleetMachine(machineLabel);
  const { fleet } = buildFleetCards(decisionView, activeMachine);

  return {
    current_mission: MEGAWORK_CURRENT_MISSION,
    active_machine: activeMachine,
    fleet,
    decisionView
  };
}

export function buildHomeFleet(machineLabel = "Betsy") {
  const decisionView = buildDecisionSurfaceView(machineLabel);
  const activeMachine = resolveLocalFleetMachine(machineLabel);
  return buildFleetCards(decisionView, activeMachine);
}
