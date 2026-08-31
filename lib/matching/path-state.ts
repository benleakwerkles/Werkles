import type { RecommendationKind } from "@/lib/squibb/recommendations";

export const INTAKE_PATH_IDS = [
  "loan_or_funding",
  "partner_or_co_owner",
  "employee_or_contractor",
  "tool_or_system",
  "training_or_adviser",
  "moving_or_changing_location"
] as const;

export type IntakePathId = (typeof INTAKE_PATH_IDS)[number];
export type IntakePathStatus = "considering" | "tried" | "ruled_out";

export type StructuredPathStatus = Readonly<{
  pathId: IntakePathId;
  pathLabel: string;
  status: IntakePathStatus;
}>;

const PATH_DEFINITIONS: Readonly<
  Record<IntakePathId, Readonly<{ label: string; kinds: readonly RecommendationKind[] }>>
> = Object.freeze({
  loan_or_funding: Object.freeze({
    label: "Loan or funding",
    kinds: Object.freeze(["raise_capital", "find_banker", "find_credit_union"] satisfies RecommendationKind[])
  }),
  partner_or_co_owner: Object.freeze({
    label: "Partner or co-owner",
    kinds: Object.freeze(["find_partner", "stage_intro_candidate"] satisfies RecommendationKind[])
  }),
  employee_or_contractor: Object.freeze({
    label: "Employee or contractor",
    kinds: Object.freeze(["stage_intro_candidate"] satisfies RecommendationKind[])
  }),
  tool_or_system: Object.freeze({
    label: "Tool or system",
    kinds: Object.freeze(["find_equipment"] satisfies RecommendationKind[])
  }),
  training_or_adviser: Object.freeze({
    label: "Training or adviser",
    kinds: Object.freeze(["get_training", "stage_intro_candidate"] satisfies RecommendationKind[])
  }),
  moving_or_changing_location: Object.freeze({
    label: "Moving or changing location",
    kinds: Object.freeze(["relocate"] satisfies RecommendationKind[])
  })
});

const ID_BY_LABEL = new Map(
  INTAKE_PATH_IDS.map((pathId) => [PATH_DEFINITIONS[pathId].label, pathId] as const)
);

const STATUS_BY_LABEL = Object.freeze({
  Considering: "considering",
  Tried: "tried",
  "Ruled out": "ruled_out"
} as const);

export class IntakePathStateContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntakePathStateContractError";
  }
}

export function recommendationKindsForIntakePath(
  pathId: IntakePathId
): readonly RecommendationKind[] {
  const definition = PATH_DEFINITIONS[pathId];
  if (!definition) throw new IntakePathStateContractError(`Unknown intake path id: ${String(pathId)}`);
  return definition.kinds;
}

export function parseStructuredPathStatuses(value: string): readonly StructuredPathStatus[] {
  const parsed: StructuredPathStatus[] = [];
  const seen = new Set<IntakePathId>();

  for (const line of value.split(/\r?\n|;\s*(?=(?:Considering|Tried|Ruled out)\s+—)/)) {
    const match = /^(Considering|Tried|Ruled out)\s+—\s+(.+)$/.exec(line.trim());
    if (!match) continue;
    const pathLabel = match[2].trim();
    const pathId = ID_BY_LABEL.get(pathLabel);
    if (!pathId) throw new IntakePathStateContractError(`Unknown intake path label: ${pathLabel}`);
    if (seen.has(pathId)) throw new IntakePathStateContractError(`Duplicate intake path state: ${pathId}`);
    seen.add(pathId);
    parsed.push(Object.freeze({
      pathId,
      pathLabel,
      status: STATUS_BY_LABEL[match[1] as keyof typeof STATUS_BY_LABEL]
    }));
  }

  return Object.freeze(parsed);
}

export function kindsForStatus(
  statuses: readonly StructuredPathStatus[],
  status: IntakePathStatus
): readonly RecommendationKind[] {
  const kinds = new Set<RecommendationKind>();
  for (const item of statuses) {
    if (item.status !== status) continue;
    for (const kind of recommendationKindsForIntakePath(item.pathId)) kinds.add(kind);
  }
  return Object.freeze([...kinds]);
}
