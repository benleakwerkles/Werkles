"use client";

import { useCallback, useEffect, useState } from "react";

import {
  HEALTH_EMOJI,
  HEALTH_LABEL,
  MACHINE_WALL_ORDER,
  type MachineHealthCard
} from "@/lib/soledash/machine-wall/types";

import type { AgentInventoryRoster } from "./types";

const POLL_MS = 8000;

function previewFallbackHealth(): MachineHealthCard[] {
  return MACHINE_WALL_ORDER.map((id) => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    level: "quarantine",
    levelLabel: HEALTH_LABEL.quarantine,
    emoji: HEALTH_EMOJI.quarantine,
    machineStatus: "unknown",
    remoteStatus: "unknown",
    reason: "Machine Wall API unavailable - preview fallback, not a blank wall",
    lastHealthy: "Unknown",
    capabilities: "Fallback display only - live machine inventory not wired",
    activeCousins: "None reported",
    currentTask: "NOT WIRED"
  }));
}

export function useAgentInventory() {
  const [roster, setRoster] = useState<AgentInventoryRoster | null>(null);
  const [machineHealth, setMachineHealth] = useState<MachineHealthCard[] | null>(() => previewFallbackHealth());
  const [loading, setLoading] = useState(true);
  const [fleetError, setFleetError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/soledash/v1/agent-inventory", { cache: "no-store" });
      const data = (await res.json()) as {
        ok?: boolean;
        roster?: AgentInventoryRoster;
        machineWall?: { machines?: MachineHealthCard[] };
      };
      if (!res.ok || data.ok === false) {
        setFleetError("Machine Wall API unavailable");
        setMachineHealth(previewFallbackHealth());
        return;
      }
      setFleetError(null);
      if (data.roster) setRoster(data.roster);
      if (data.machineWall?.machines) setMachineHealth(data.machineWall.machines);
    } catch (err) {
      setFleetError(err instanceof Error ? err.message : "Machine Wall API unavailable");
      setMachineHealth(previewFallbackHealth());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  return { roster, machineHealth, loading, fleetError, reload: load };
}
