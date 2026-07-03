export type DenZoneId =
  | "main-desk"
  | "workbench"
  | "machine-wall"
  | "receipt-wall"
  | "artifact-shelf"
  | "pearl-shelf"
  | "forge"
  | "permission-swatter";

export type DenZoneDef = {
  id: DenZoneId;
  title: string;
  tagline: string;
  icon: string;
  depth: number;
};

export const DEN_ZONES: DenZoneDef[] = [
  {
    id: "main-desk",
    title: "Main Desk",
    tagline: "What do you want built?",
    icon: "✎",
    depth: 48
  },
  {
    id: "workbench",
    title: "Workbench",
    tagline: "Active projects",
    icon: "⚒",
    depth: 32
  },
  {
    id: "machine-wall",
    title: "Machine Wall",
    tagline: "Betsy · Doss · Sally · Spanzee",
    icon: "🖥",
    depth: 24
  },
  {
    id: "receipt-wall",
    title: "Receipt Wall",
    tagline: "Latest receipts",
    icon: "📎",
    depth: 28
  },
  {
    id: "artifact-shelf",
    title: "Operator Shelf",
    tagline: "Pointers to drawer, registry, roster, swatter, crawler",
    icon: "📚",
    depth: 20
  },
  {
    id: "pearl-shelf",
    title: "Pearl Shelf",
    tagline: "NEW · REVIEWED · PROMOTED · wisdom nuggets",
    icon: "◈",
    depth: 22
  },
  {
    id: "forge",
    title: "Forge",
    tagline: "Spanzee dreams · MMORPG · Space Mining",
    icon: "🔥",
    depth: 36
  },
  {
    id: "permission-swatter",
    title: "Permission Swatter",
    tagline: "Permissions Swatted",
    icon: "🪰",
    depth: 40
  }
];

export function zoneFor(id: DenZoneId): DenZoneDef {
  return DEN_ZONES.find((z) => z.id === id) ?? DEN_ZONES[0];
}

/** Opens on demand — Ben can stay on Workbench all session. */
export const SECONDARY_DEN_ZONE_IDS: DenZoneId[] = ["machine-wall", "receipt-wall", "pearl-shelf"];

/** Other zones — collapsed rail, not session-critical. */
export const AUX_DEN_ZONE_IDS: DenZoneId[] = ["artifact-shelf", "forge", "permission-swatter"];
