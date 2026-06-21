import { conflictVerbs, pairResourceConflict } from "./resources";
import type { CompanyOption, ConflictReport, OptionVerb } from "./types";

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function detectPairConflict(
  a: CompanyOption,
  b: CompanyOption,
  salvoVerb?: OptionVerb
): ConflictReport | null {
  if (
    a.cardType === "intent_proposal" &&
    b.cardType === "intent_proposal" &&
    !a.isActiveFrontier &&
    !b.isActiveFrontier
  ) {
    return {
      optionIds: [a.id, b.id],
      kind: "frontier",
      message: `Only one frontier — choosing ${a.code} defers ${b.code}.`
    };
  }

  if (salvoVerb) {
    const hit = pairResourceConflict(a, salvoVerb, b, salvoVerb);
    return hit ? { optionIds: [a.id, b.id], ...hit } : null;
  }

  for (const verbA of conflictVerbs(a)) {
    for (const verbB of conflictVerbs(b)) {
      const hit = pairResourceConflict(a, verbA, b, verbB);
      if (hit) return { optionIds: [a.id, b.id], ...hit };
    }
  }

  return null;
}

export function detectConflicts(options: CompanyOption[], salvoVerb?: OptionVerb): ConflictReport[] {
  const reports: ConflictReport[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < options.length; i++) {
    for (let j = i + 1; j < options.length; j++) {
      const a = options[i];
      const b = options[j];
      const hit = detectPairConflict(a, b, salvoVerb);
      if (!hit) continue;
      const key = pairKey(hit.optionIds[0], hit.optionIds[1]);
      if (seen.has(key)) continue;
      seen.add(key);
      reports.push(hit);
    }
  }

  return reports;
}

export function attachConflicts(options: CompanyOption[]): CompanyOption[] {
  const reports = detectConflicts(options);
  const byOption = new Map<string, { ids: string[]; hints: string[] }>();

  for (const r of reports) {
    for (const id of r.optionIds) {
      const cur = byOption.get(id) ?? { ids: [], hints: [] };
      const other = r.optionIds.find((x) => x !== id)!;
      if (!cur.ids.includes(other)) cur.ids.push(other);
      if (!cur.hints.includes(r.message)) cur.hints.push(r.message);
      byOption.set(id, cur);
    }
  }

  return options.map((o) => {
    const c = byOption.get(o.id);
    if (!c) return o;
    return { ...o, conflictsWith: c.ids, conflictHints: c.hints };
  });
}

export function selectionConflicts(
  selected: CompanyOption[],
  all: CompanyOption[],
  salvoVerb?: OptionVerb
): ConflictReport[] {
  const ids = new Set(selected.map((s) => s.id));
  return detectConflicts(all, salvoVerb).filter(
    (r) => ids.has(r.optionIds[0]) && ids.has(r.optionIds[1])
  );
}

export function salvoAllowed(
  selected: CompanyOption[],
  all: CompanyOption[],
  salvoVerb?: OptionVerb
): {
  allowed: boolean;
  conflicts: ConflictReport[];
  reason: string | null;
} {
  if (selected.length <= 1) {
    return { allowed: true, conflicts: [], reason: null };
  }
  const conflicts = selectionConflicts(selected, all, salvoVerb);
  if (conflicts.length === 0) {
    return { allowed: true, conflicts: [], reason: null };
  }
  return {
    allowed: false,
    conflicts,
    reason: conflicts[0]?.message ?? "Selected options conflict."
  };
}
