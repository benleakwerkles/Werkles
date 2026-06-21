import fs from "node:fs";
import path from "node:path";

import type { FleetStateMachineEntry } from "@/protocol/index";

import { loadFleetState } from "@/lib/soledash/megawork-home/load-fleet-state";

import {
  HEALTH_EMOJI,
  HEALTH_LABEL,
  MACHINE_WALL_ORDER,
  type MachineHealthCard,
  type MachineHealthLevel
} from "./types";

const ROOT = process.cwd();

function needsOperatorTouch(value: string | boolean): boolean {
  return value === true || value === "true";
}

function isUnknown(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  const text = String(value).trim();
  return !text || text.toUpperCase() === "UNKNOWN";
}

function formatWhen(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  return at.toLocaleString();
}

function receiptMtime(relativePath: string | null): string | null {
  if (!relativePath) return null;
  try {
    const full = path.join(ROOT, relativePath);
    if (!fs.existsSync(full)) return null;
    return formatWhen(fs.statSync(full).mtime.toISOString());
  } catch {
    return null;
  }
}

function computeLevel(machine: FleetStateMachineEntry): MachineHealthLevel {
  const status = machine.status.toUpperCase();
  const evidence = machine.evidence_status.toUpperCase();
  const blocker = machine.blocker?.trim() ?? null;

  if (status === "UNKNOWN" && evidence === "UNKNOWN") return "quarantine";
  if (blocker?.toLowerCase().includes("not instrumented")) return "quarantine";

  if (
    blocker &&
    (needsOperatorTouch(machine.needs_operator_touch) ||
      blocker.toLowerCase().includes("unproven") ||
      blocker.toLowerCase().includes("identity"))
  ) {
    return "stop";
  }

  if (status.includes("PARTIAL") && blocker) return "stop";

  if (status.includes("PARTIAL") || evidence === "HYPOTHESIS") return "degraded";

  if (
    status === "LIVE" &&
    evidence === "OBSERVED" &&
    !blocker &&
    machine.latest_receipt_path &&
    !needsOperatorTouch(machine.needs_operator_touch)
  ) {
    return "green";
  }

  if (status === "LIVE" || status.includes("PARTIAL")) return "watch";

  return "quarantine";
}

function buildReason(machine: FleetStateMachineEntry, level: MachineHealthLevel): string {
  if (machine.blocker?.trim()) return machine.blocker.trim();

  const status = machine.status.toUpperCase();
  const evidence = machine.evidence_status.toUpperCase();

  switch (level) {
    case "green":
      return "Live with observed evidence and a receipt on file";
    case "watch":
      if (!machine.latest_receipt_path) return "Live but receipt path missing in fleet feed";
      if (machine.workstation_uniformity_status === "IN_PROGRESS") {
        return "Uniformization still in progress";
      }
      return "Live — soft drift worth watching";
    case "degraded":
      return `Partial live · evidence ${evidence.toLowerCase()}`;
    case "stop":
      return "Operator touch or identity proof required before dispatch";
    case "quarantine":
      return "Node not instrumented — do not route work here";
    default:
      return `${status} · ${evidence}`;
  }
}

function buildCapabilities(machine: FleetStateMachineEntry, level: MachineHealthLevel): string {
  switch (level) {
    case "green":
      return "Cousin dispatch, safe Wonka proofs, foreman read, SoleDash command";
    case "watch":
      if (machine.id === "sally") {
        return "Mirror forge readback — hold dispatch until receipt path exists";
      }
      return "Read fleet + localhost only — confirm before cousin dispatch";
    case "degraded":
      return "Hypothesis readback only — no trusted auto-dispatch";
    case "stop":
      return "Inventory visible — no trusted dispatch until blocker clears";
    case "quarantine":
      return "None — quarantined until instrumented";
    default:
      return "Unknown";
  }
}

function buildLastHealthy(
  machine: FleetStateMachineEntry,
  level: MachineHealthLevel,
  fleetGeneratedAt: string | null
): string {
  const receiptAt = receiptMtime(machine.latest_receipt_path);
  const fleetAt = formatWhen(fleetGeneratedAt);

  if (level === "green") {
    return receiptAt ? `Receipt ${receiptAt}` : fleetAt ? `Fleet snapshot ${fleetAt}` : "Confirmed recently";
  }

  if (level === "quarantine") return "Never confirmed healthy";

  if (receiptAt) return `Last receipt ${receiptAt}`;

  return fleetAt ? `Not healthy since before ${fleetAt}` : "Unknown — no fleet timestamp";
}

function placeholderMachine(id: MachineHealthCard["id"]): MachineHealthCard {
  return {
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    level: "quarantine",
    levelLabel: HEALTH_LABEL.quarantine,
    emoji: HEALTH_EMOJI.quarantine,
    reason: "FLEET_STATE missing — health unknown",
    lastHealthy: "Never confirmed healthy",
    capabilities: "None until fleet feed loads",
    activeCousins: "UNKNOWN",
    currentTask: null
  };
}

export function buildMachineWallHealth(): {
  machines: MachineHealthCard[];
  fleet_state_loaded: boolean;
  generated_at: string | null;
} {
  const fleet = loadFleetState();
  if (!fleet.ok) {
    return {
      machines: MACHINE_WALL_ORDER.map(placeholderMachine),
      fleet_state_loaded: false,
      generated_at: null
    };
  }

  const byId = new Map(fleet.file.machines.map((machine) => [machine.id, machine]));
  const generatedAt = fleet.file.generated_at ?? null;

  const machines = MACHINE_WALL_ORDER.map((id) => {
    const machine = byId.get(id);
    if (!machine) return placeholderMachine(id);

    const level = computeLevel(machine);
    return {
      id,
      label: machine.display_name !== "UNKNOWN" ? machine.display_name : id.charAt(0).toUpperCase() + id.slice(1),
      level,
      levelLabel: HEALTH_LABEL[level],
      emoji: HEALTH_EMOJI[level],
      reason: buildReason(machine, level),
      lastHealthy: buildLastHealthy(machine, level, generatedAt),
      capabilities: buildCapabilities(machine, level),
      activeCousins: isUnknown(machine.active_cousins) ? "None reported" : machine.active_cousins,
      currentTask: machine.current_task
    };
  });

  return {
    machines,
    fleet_state_loaded: true,
    generated_at: generatedAt
  };
}
