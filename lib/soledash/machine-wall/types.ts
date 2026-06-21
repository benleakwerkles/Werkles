export type MachineHealthLevel = "green" | "watch" | "degraded" | "stop" | "quarantine";

export type MachineHealthCard = {
  id: "betsy" | "doss" | "sally" | "spanzee";
  label: string;
  level: MachineHealthLevel;
  levelLabel: string;
  emoji: string;
  reason: string;
  lastHealthy: string;
  capabilities: string;
  activeCousins: string;
  currentTask: string | null;
};

export const MACHINE_WALL_ORDER: MachineHealthCard["id"][] = ["betsy", "doss", "sally", "spanzee"];

export const HEALTH_EMOJI: Record<MachineHealthLevel, string> = {
  green: "🟢",
  watch: "🟡",
  degraded: "🟠",
  stop: "🔴",
  quarantine: "⚫"
};

export const HEALTH_LABEL: Record<MachineHealthLevel, string> = {
  green: "GREEN",
  watch: "WATCH",
  degraded: "DEGRADED",
  stop: "STOP",
  quarantine: "QUARANTINE"
};

export function machineWallTeaser(machines: MachineHealthCard[]): string {
  const counts = new Map<MachineHealthLevel, number>();
  for (const machine of machines) {
    counts.set(machine.level, (counts.get(machine.level) ?? 0) + 1);
  }

  const parts: string[] = [];
  for (const level of ["green", "watch", "degraded", "stop", "quarantine"] as MachineHealthLevel[]) {
    const count = counts.get(level);
    if (count) parts.push(`${HEALTH_EMOJI[level]}${count}`);
  }

  return parts.length ? parts.join(" ") : "Loading fleet…";
}
