function coalesce(...values: Array<string | null | undefined>): string {
  for (const v of values) {
    if (v && v.trim()) return v.trim();
  }
  return "—";
}

export function splitOwnerMachine(
  ownerRaw: string | null | undefined,
  fallbackMachine: string
): { owner: string; machine: string } {
  const raw = ownerRaw?.trim();
  if (!raw) return { owner: "—", machine: fallbackMachine };
  const parts = raw.split("@").map((part) => part.trim());
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return { owner: parts[0], machine: parts[1] };
  }
  return { owner: raw, machine: fallbackMachine };
}

export function projectFromText(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    if (!value) continue;
    const match = value.match(/\bP\d+-A\d+\b/i);
    if (match) return match[0].toUpperCase();
  }
  return "Werkles";
}

export function areaLabel(kind: string): string {
  return kind.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function purposeLine(...values: Array<string | null | undefined>): string {
  const seen = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    const text = value.trim();
    if (!text || text === "—") continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    return text;
  }
  return "—";
}

export function receiptReturnPath(...values: Array<string | null | undefined>): string {
  return coalesce(...values);
}

export type BuildCardContext = {
  machineLabel: string;
  branch: string;
};

export const DEFAULT_CARD_CONTEXT: BuildCardContext = {
  machineLabel: "Betsy",
  branch: "—"
};
