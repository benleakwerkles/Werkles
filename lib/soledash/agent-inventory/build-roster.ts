import "server-only";

import type { FleetStateMachineEntry } from "@/protocol/index";

import { loadFleetState } from "@/lib/soledash/megawork-home/load-fleet-state";
import type { NextStepOwner } from "@/lib/soledash/next-step/types";

import type { AgentInventoryRoster, AgentRosterEntry, AgentRosterGroup, AgentRosterGroupId } from "./types";

const GROUP_ORDER: AgentRosterGroupId[] = ["betsy", "doss", "sally", "spanzee", "duck"];

const GROUP_LABELS: Record<AgentRosterGroupId, string> = {
  betsy: "Betsy",
  doss: "Doss",
  sally: "Sally",
  spanzee: "Spanzee",
  duck: "Duck"
};

const AEYE_PATTERNS: { pattern: RegExp; aeyeId: NextStepOwner; label: string }[] = [
  { pattern: /\bmaker\b/i, aeyeId: "MAKER", label: "Maker" },
  { pattern: /\bdink\b/i, aeyeId: "DINK", label: "Dink" },
  { pattern: /\bpetra\b/i, aeyeId: "PETRA", label: "Petra" },
  { pattern: /\bender\b/i, aeyeId: "ENDER", label: "Ender" },
  { pattern: /\bbean\b/i, aeyeId: "BEAN", label: "Bean" },
  { pattern: /\bben\b/i, aeyeId: "BEN", label: "Ben" }
];

function statusSlug(status: string): string {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function parseAeyes(activeCousins: string): { aeyeId: NextStepOwner; label: string }[] {
  if (!activeCousins || activeCousins.toUpperCase() === "UNKNOWN") {
    return [{ aeyeId: "DINK", label: "Dink" }];
  }

  const hits = AEYE_PATTERNS.filter(({ pattern }) => pattern.test(activeCousins));
  if (hits.length > 0) {
    const seen = new Set<NextStepOwner>();
    return hits.filter((h) => {
      if (seen.has(h.aeyeId)) return false;
      seen.add(h.aeyeId);
      return true;
    });
  }

  const token = activeCousins.split(/[@/|,]/)[0]?.trim() || "Operator";
  return [{ aeyeId: "DINK", label: token }];
}

function taskLabel(machine: FleetStateMachineEntry): string {
  if (machine.current_task && machine.current_task !== "UNKNOWN") return machine.current_task;
  if (machine.active_cousins && machine.active_cousins !== "UNKNOWN") return machine.active_cousins;
  return "No active task reported";
}

function entryFromMachine(
  machine: FleetStateMachineEntry,
  aeye: { aeyeId: NextStepOwner; label: string }
): AgentRosterEntry {
  const groupId = machine.id as AgentRosterGroupId;
  const machineLabel = machine.display_name !== "UNKNOWN" ? machine.display_name : GROUP_LABELS[groupId];
  const blocked = Boolean(machine.blocker && machine.blocker !== "UNKNOWN");
  const unknownMachine = machine.status.toUpperCase() === "UNKNOWN" && groupId === "spanzee";

  return {
    id: `${groupId}:${aeye.aeyeId.toLowerCase()}`,
    aeye: aeye.label,
    aeyeId: aeye.aeyeId,
    machine: machineLabel,
    machineGroup: groupId,
    status: blocked ? "BLOCKED" : machine.status,
    statusSlug: statusSlug(blocked ? "BLOCKED" : machine.status),
    currentTask: taskLabel(machine),
    selectable: !unknownMachine,
    blockReason: blocked ? machine.blocker : null
  };
}

function buildFleetGroup(machine: FleetStateMachineEntry): AgentRosterGroup {
  const groupId = machine.id as AgentRosterGroupId;
  const aeyes = parseAeyes(machine.active_cousins);
  return {
    id: groupId,
    label: GROUP_LABELS[groupId],
    entries: aeyes.map((aeye) => entryFromMachine(machine, aeye))
  };
}

function placeholderGroup(id: AgentRosterGroupId): AgentRosterGroup {
  return {
    id,
    label: GROUP_LABELS[id],
    entries: [
      {
        id: `${id}:dink`,
        aeye: "Dink",
        aeyeId: "DINK",
        machine: GROUP_LABELS[id],
        machineGroup: id,
        status: "UNKNOWN",
        statusSlug: "unknown",
        currentTask: "FLEET_STATE missing for this machine",
        selectable: false,
        blockReason: "No live fleet feed"
      }
    ]
  };
}

function buildDuckGroup(): AgentRosterGroup {
  const tasks: Record<NextStepOwner, string> = {
    BEN: "Mobile operator — approve, receipts, gates",
    DINK: "Duck command tab — frontier + chat",
    MAKER: "Relay cards + outbox on phone",
    PETRA: "Receipt review + comptroller lane",
    ENDER: "Human reality + site cleanup",
    BEAN: "Audit / kill test from field"
  };

  const duckAeyes: NextStepOwner[] = ["BEN", "DINK", "MAKER", "PETRA", "ENDER", "BEAN"];
  const labels: Record<NextStepOwner, string> = {
    BEN: "Ben",
    DINK: "Dink",
    MAKER: "Maker",
    PETRA: "Petra",
    ENDER: "Ender",
    BEAN: "Bean"
  };

  return {
    id: "duck",
    label: "Duck",
    entries: duckAeyes.map((aeyeId) => ({
      id: `duck:${aeyeId.toLowerCase()}`,
      aeye: labels[aeyeId],
      aeyeId,
      machine: "Duck",
      machineGroup: "duck" as const,
      status: "LIVE",
      statusSlug: "live",
      currentTask: tasks[aeyeId],
      selectable: true,
      blockReason: null
    }))
  };
}

export function buildAgentInventoryRoster(): AgentInventoryRoster {
  const fleet = loadFleetState();
  const byId = new Map<AgentRosterGroupId, AgentRosterGroup>();

  if (fleet.ok) {
    for (const machine of fleet.file.machines) {
      if (GROUP_ORDER.includes(machine.id as AgentRosterGroupId)) {
        byId.set(machine.id as AgentRosterGroupId, buildFleetGroup(machine));
      }
    }
  }

  const groups: AgentRosterGroup[] = [];
  for (const id of GROUP_ORDER) {
    if (id === "duck") {
      groups.push(buildDuckGroup());
      continue;
    }
    groups.push(byId.get(id) ?? placeholderGroup(id));
  }

  return {
    groups,
    generated_at: new Date().toISOString(),
    fleet_state_loaded: fleet.ok,
    source_path: fleet.ok ? fleet.source_path : null
  };
}
