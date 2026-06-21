import type { CompanyOption, ConflictReport } from "./types";

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function detectConflicts(options: CompanyOption[]): ConflictReport[] {
  const reports: ConflictReport[] = [];
  const seen = new Set<string>();

  function add(report: ConflictReport) {
    const key = pairKey(report.optionIds[0], report.optionIds[1]);
    if (seen.has(key)) return;
    seen.add(key);
    reports.push(report);
  }

  for (let i = 0; i < options.length; i++) {
    for (let j = i + 1; j < options.length; j++) {
      const a = options[i];
      const b = options[j];

      if (a.consumesAgent && b.consumesAgent && a.target === b.target) {
        add({
          optionIds: [a.id, b.id],
          kind: "agent",
          message: `Sending ${a.target} on “${shortTitle(a.title)}” delays “${shortTitle(b.title)}”.`
        });
      }

      if (a.consumesFrontier && b.consumesFrontier) {
        if (a.id.includes("yea") && b.id.includes("nay")) {
          add({
            optionIds: [a.id, b.id],
            kind: "exclusive",
            message: "YEA and NAY on the same frontier — pick one."
          });
        } else if (a.id.includes("nay") && b.id.includes("yea")) {
          add({
            optionIds: [a.id, b.id],
            kind: "exclusive",
            message: "YEA and NAY on the same frontier — pick one."
          });
        } else if (
          a.kind === "queue" &&
          b.kind === "queue" &&
          !a.isActiveFrontier &&
          !b.isActiveFrontier
        ) {
          add({
            optionIds: [a.id, b.id],
            kind: "frontier",
            message: `Only one frontier — choosing ${a.code} defers ${b.code}.`
          });
        } else if (a.isActiveFrontier && b.isActiveFrontier && a.id !== b.id) {
          add({
            optionIds: [a.id, b.id],
            kind: "frontier",
            message: "Both compete for operator attention on the active frontier."
          });
        }
      }

      if (
        (a.id.includes("kill_test") || b.id.includes("kill_test")) &&
        (a.id.includes("yea") || b.id.includes("yea"))
      ) {
        add({
          optionIds: [a.id, b.id],
          kind: "exclusive",
          message: "Kill test and YEA on the same lane — kill test may explode the frontier."
        });
      }
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
  all: CompanyOption[]
): ConflictReport[] {
  const ids = new Set(selected.map((s) => s.id));
  return detectConflicts(all).filter((r) => ids.has(r.optionIds[0]) && ids.has(r.optionIds[1]));
}

function shortTitle(title: string): string {
  return title.length > 36 ? `${title.slice(0, 34)}…` : title;
}

export function salvoAllowed(selected: CompanyOption[], all: CompanyOption[]): {
  allowed: boolean;
  conflicts: ConflictReport[];
  reason: string | null;
} {
  if (selected.length <= 1) {
    return { allowed: true, conflicts: [], reason: null };
  }
  const conflicts = selectionConflicts(selected, all);
  if (conflicts.length === 0) {
    return { allowed: true, conflicts: [], reason: null };
  }
  return {
    allowed: false,
    conflicts,
    reason: conflicts[0]?.message ?? "Selected options conflict."
  };
}
