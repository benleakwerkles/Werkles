import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { FleetMachineId, FleetStateFile, FleetStateMachineEntry } from "@/protocol/index";

const ROOT = process.cwd();

/** Repo-local transport file (primary on Betsy) */
const REPO_FLEET_FILE = path.join(ROOT, "foreman", "soledash", "FLEET_STATE.json");

/** Dink handoff path from Petra mission */
const DOSS_HANDOFF_FLEET_FILE =
  "C:\\Users\\Ben Leak\\Documents\\Codex\\2026-06-15\\to-dink-on-doss-from-petra\\foreman\\soledash\\FLEET_STATE.json";

export type FleetStateLoadResult =
  | { ok: true; file: FleetStateFile; source_path: string }
  | { ok: false; error: string; tried: string[] };

function readFleetFile(filePath: string): FleetStateFile | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as FleetStateFile;
    if (!raw || !Array.isArray(raw.machines)) return null;
    return raw;
  } catch {
    return null;
  }
}

function normalizeEntry(raw: Partial<FleetStateMachineEntry> & { id: FleetMachineId }): FleetStateMachineEntry {
  const lit = (value: unknown): string => {
    if (value === null || value === undefined) return "UNKNOWN";
    const text = String(value).trim();
    return text.length ? text : "UNKNOWN";
  };

  const touch = raw.needs_operator_touch;
  const needsOperatorTouch =
    touch === null || touch === undefined
      ? "UNKNOWN"
      : typeof touch === "boolean"
        ? touch
          ? "true"
          : "false"
        : String(touch).trim() || "UNKNOWN";

  return {
    id: raw.id,
    display_name: lit(raw.display_name),
    hostname: lit(raw.hostname),
    status: lit(raw.status),
    evidence_status: lit(raw.evidence_status),
    active_cousins: lit(raw.active_cousins),
    current_task: raw.current_task?.trim() ? raw.current_task.trim() : null,
    latest_receipt_path: raw.latest_receipt_path?.trim() ? raw.latest_receipt_path.trim() : null,
    blocker: raw.blocker?.trim() ? raw.blocker.trim() : null,
    remote_path_status: lit(raw.remote_path_status),
    workstation_uniformity_status: lit(raw.workstation_uniformity_status),
    needs_operator_touch: needsOperatorTouch
  };
}

export function loadFleetState(): FleetStateLoadResult {
  const tried: string[] = [];
  const candidates = [REPO_FLEET_FILE, DOSS_HANDOFF_FLEET_FILE];

  for (const filePath of candidates) {
    tried.push(filePath);
    const parsed = readFleetFile(filePath);
    if (!parsed) continue;

    const machines = parsed.machines
      .filter((m) =>
        Boolean(m?.id && ["betsy", "doss", "sally", "spanzee"].includes(m.id))
      )
      .map(normalizeEntry);

    if (machines.length === 0) {
      return { ok: false, error: "FLEET_STATE.json has no valid machines array.", tried };
    }

    return {
      ok: true,
      file: { ...parsed, machines },
      source_path: filePath
    };
  }

  return {
    ok: false,
    error: "FLEET_STATE.json not found — peer fleet shows UNKNOWN until Dink file is present.",
    tried
  };
}

export function fleetStateFileExists(): boolean {
  return loadFleetState().ok;
}
