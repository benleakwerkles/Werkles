export type MachineHealthLevel = "green" | "watch" | "degraded" | "stop" | "quarantine";
export type MachineReachability = "reachable" | "unreachable" | "unknown";

export type MachineHealthCard = {
  id: "betsy" | "doss" | "sally" | "spanzee";
  label: string;
  level: MachineHealthLevel;
  levelLabel: string;
  emoji: string;
  machineStatus: MachineReachability;
  remoteStatus: MachineReachability;
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
  const unknownRemote = machines.filter((machine) => machine.remoteStatus === "unknown").length;
  const unreachable = machines.filter(
    (machine) => machine.machineStatus === "unreachable" || machine.remoteStatus === "unreachable"
  ).length;

  if (unreachable > 0) return `${unreachable} unreachable`;
  if (unknownRemote > 0) return `${unknownRemote} unknown`;
  return "All reachable";
}
