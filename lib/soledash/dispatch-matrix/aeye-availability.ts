import fs from "node:fs";
import path from "node:path";

import type { AeyeAvailability, AeyeId, AeyeResourceView } from "./types";

const ROOT = process.cwd();
const FLEET_STATE_PATH = path.join(ROOT, "foreman", "soledash", "FLEET_STATE.json");

const AEYE_LABELS: Record<AeyeId, string> = {
  MAKER: "Maker",
  DINK: "Dink",
  ENDER: "Ender",
  BEAN: "Bean",
  THUFIR: "Thufir",
  SKYBRO: "Skybro",
  PETRA: "Petra"
};

const ALL_AEYES: AeyeId[] = ["MAKER", "DINK", "ENDER", "BEAN", "THUFIR", "SKYBRO", "PETRA"];

type FleetMachine = {
  id?: string;
  display_name?: string;
  status?: string;
  active_cousins?: string;
  current_task?: string | null;
  blocker?: string | null;
};

function cousinMentionsAeye(text: string, aeye: AeyeId): boolean {
  const lower = text.toLowerCase();
  switch (aeye) {
    case "MAKER":
      return lower.includes("maker");
    case "DINK":
      return lower.includes("dink");
    case "ENDER":
      return lower.includes("ender");
    case "BEAN":
      return lower.includes("bean");
    case "THUFIR":
      return lower.includes("thufir");
    case "SKYBRO":
      return lower.includes("skybro");
    case "PETRA":
      return lower.includes("petra");
    default:
      return false;
  }
}

function availabilityFromStatus(status: string | undefined): AeyeAvailability {
  const s = (status ?? "").toUpperCase();
  if (s === "LIVE" || s === "GREEN" || s === "OK") return "available";
  if (s.includes("PARTIAL")) return "partial";
  if (s === "UNKNOWN" || !s) return "unknown";
  if (s.includes("BLOCK") || s === "RED") return "busy";
  return "unknown";
}

export function loadAeyeResources(): { resources: AeyeResourceView[]; fleetStateLoaded: boolean } {
  const pool = new Map<AeyeId, AeyeResourceView>();

  for (const id of ALL_AEYES) {
    pool.set(id, {
      id,
      label: AEYE_LABELS[id],
      availability: "unknown",
      busy_on: null,
      source: "default"
    });
  }

  let fleetStateLoaded = false;
  try {
    const raw = JSON.parse(fs.readFileSync(FLEET_STATE_PATH, "utf8")) as { machines?: FleetMachine[] };
    fleetStateLoaded = true;

    for (const machine of raw.machines ?? []) {
      const cousins = machine.active_cousins ?? "";
      const task = machine.current_task ?? machine.display_name ?? machine.id ?? "fleet task";
      const machineStatus = machine.status;

      for (const aeye of ALL_AEYES) {
        if (!cousinMentionsAeye(cousins, aeye)) continue;
        const cur = pool.get(aeye)!;
        const busyOn = task && task !== "UNKNOWN" ? `${task} (${machine.display_name ?? machine.id})` : cousins;
        pool.set(aeye, {
          ...cur,
          availability: machine.blocker ? "busy" : availabilityFromStatus(machineStatus) === "available" ? "busy" : "partial",
          busy_on: busyOn,
          source: "FLEET_STATE"
        });
      }
    }
  } catch {
    fleetStateLoaded = false;
  }

  // Active frontier claims from cockpit when fleet sparse
  const maker = pool.get("MAKER")!;
  if (maker.availability === "unknown") {
    pool.set("MAKER", {
      ...maker,
      availability: "busy",
      busy_on: "Workstation Uniformization (Betsy)",
      source: "frontier inference"
    });
  }

  const dink = pool.get("DINK")!;
  if (dink.availability === "unknown" || dink.availability === "partial") {
    pool.set("DINK", {
      ...dink,
      availability: dink.busy_on ? "partial" : "busy",
      busy_on: dink.busy_on ?? "Doss Stability Investigation + focus-theft queue",
      source: dink.source === "default" ? "frontier inference" : dink.source
    });
  }

  for (const id of ALL_AEYES) {
    const cur = pool.get(id)!;
    if (cur.availability === "unknown" && !cur.busy_on) {
      pool.set(id, { ...cur, availability: "available", source: "no assignment signal" });
    }
  }

  return { resources: ALL_AEYES.map((id) => pool.get(id)!), fleetStateLoaded };
}

export function aeyeIsFree(resource: AeyeResourceView): boolean {
  return resource.availability === "available";
}

export function aeyeBlocksDispatch(resource: AeyeResourceView): boolean {
  return resource.availability === "busy" || resource.availability === "partial";
}
