import type { NextStepOwner } from "@/lib/soledash/next-step/types";

export type AgentRosterGroupId = "betsy" | "doss" | "sally" | "spanzee" | "duck";

export type AgentRosterEntry = {
  id: string;
  aeye: string;
  aeyeId: NextStepOwner;
  machine: string;
  machineGroup: AgentRosterGroupId;
  status: string;
  statusSlug: string;
  currentTask: string;
  selectable: boolean;
  blockReason: string | null;
};

export type AgentRosterGroup = {
  id: AgentRosterGroupId;
  label: string;
  entries: AgentRosterEntry[];
};

export type AgentInventoryRoster = {
  groups: AgentRosterGroup[];
  generated_at: string;
  fleet_state_loaded: boolean;
  source_path: string | null;
};

const GROUP_LABELS: Record<AgentRosterGroupId, string> = {
  betsy: "Betsy",
  doss: "Doss",
  sally: "Sally",
  spanzee: "Spanzee",
  duck: "Duck"
};

export function rosterEntryId(owner: string, machine: string): string | null {
  const machineKey = machine.trim().toLowerCase();
  const group = (Object.keys(GROUP_LABELS) as AgentRosterGroupId[]).find(
    (g) => g === machineKey || GROUP_LABELS[g].toLowerCase() === machineKey
  );
  if (!group) return null;
  return `${group}:${owner.toLowerCase()}`;
}

export function machineLabelForGroup(machineGroup: string): string {
  if (machineGroup === "duck") return "Duck";
  return machineGroup.charAt(0).toUpperCase() + machineGroup.slice(1);
}
