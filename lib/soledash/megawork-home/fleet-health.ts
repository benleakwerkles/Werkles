/** SoleDash fleet health — four states only. */
export type FleetHealth = "GREEN" | "YELLOW" | "RED" | "UNKNOWN";

export function normalizeFleetHealth(raw: string): FleetHealth {
  const s = raw.trim().toUpperCase();
  if (!s || s === "UNKNOWN") return "UNKNOWN";

  if (
    s === "GREEN" ||
    s === "LIVE" ||
    s === "ONLINE" ||
    s === "OK" ||
    s === "HEALTHY" ||
    s === "ACTIVE" ||
    s === "UP" ||
    s === "READY"
  ) {
    return "GREEN";
  }

  if (
    s === "RED" ||
    s.includes("BLOCK") ||
    s.includes("OFFLINE") ||
    s.includes("DOWN") ||
    s.includes("FAIL") ||
    s.includes("UNREACHABLE")
  ) {
    return "RED";
  }

  if (
    s === "YELLOW" ||
    s.includes("PARTIAL") ||
    s.includes("DEGRAD") ||
    s.includes("WARN") ||
    s.includes("ATTENTION") ||
    s === "MOCK"
  ) {
    return "YELLOW";
  }

  return "UNKNOWN";
}

export function fleetHealthSlug(health: FleetHealth): string {
  return health.toLowerCase();
}

export function fleetHealthLabel(health: FleetHealth): string {
  switch (health) {
    case "GREEN":
      return "ready";
    case "YELLOW":
      return "needs attention";
    case "RED":
      return "blocked";
    default:
      return "not enough signal";
  }
}
