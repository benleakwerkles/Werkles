/**
 * WERKLES_ICON_EXPLORATION_V2 — hand-authored SVG retry.
 * Supersedes v1. Not wired to production UI.
 */

export const ICON_EXPLORATION_V2_ENABLED = false;

export const ICON_EXPLORATION_V2_ROOT =
  "/assets/draft/icon-exploration-v2" as const;

export type IconFamily = "operator" | "network" | "foundry";

export type LaneRole =
  | "spark"
  | "builder"
  | "operator"
  | "backer"
  | "connector";

export const RECOMMENDED_FAMILY: IconFamily = "operator";

export const ICON_FAMILIES = {
  operator: {
    label: "Operator Marks",
    duochrome: `${ICON_EXPLORATION_V2_ROOT}/operator-marks/mark-primary-duochrome.svg`,
    mono: `${ICON_EXPLORATION_V2_ROOT}/operator-marks/mark-primary-mono.svg`,
    copper: `${ICON_EXPLORATION_V2_ROOT}/operator-marks/mark-primary-copper.svg`,
  },
  network: {
    label: "Network Marks",
    mono: `${ICON_EXPLORATION_V2_ROOT}/network-marks/mark-primary-mono.svg`,
    copper: `${ICON_EXPLORATION_V2_ROOT}/network-marks/mark-primary-copper.svg`,
  },
  foundry: {
    label: "Foundry Marks",
    mono: `${ICON_EXPLORATION_V2_ROOT}/foundry-marks/mark-primary-mono.svg`,
    copper: `${ICON_EXPLORATION_V2_ROOT}/foundry-marks/mark-primary-copper.svg`,
  },
} as const;

export const LANE_ICONS_OPERATOR: Record<
  LaneRole,
  { mono: string; copper: string }
> = {
  spark: {
    mono: `${ICON_EXPLORATION_V2_ROOT}/lanes-operator/lane-spark-mono.svg`,
    copper: `${ICON_EXPLORATION_V2_ROOT}/lanes-operator/lane-spark-copper.svg`,
  },
  builder: {
    mono: `${ICON_EXPLORATION_V2_ROOT}/lanes-operator/lane-builder-mono.svg`,
    copper: `${ICON_EXPLORATION_V2_ROOT}/lanes-operator/lane-builder-copper.svg`,
  },
  operator: {
    mono: `${ICON_EXPLORATION_V2_ROOT}/lanes-operator/lane-operator-mono.svg`,
    copper: `${ICON_EXPLORATION_V2_ROOT}/lanes-operator/lane-operator-copper.svg`,
  },
  backer: {
    mono: `${ICON_EXPLORATION_V2_ROOT}/lanes-operator/lane-backer-mono.svg`,
    copper: `${ICON_EXPLORATION_V2_ROOT}/lanes-operator/lane-backer-copper.svg`,
  },
  connector: {
    mono: `${ICON_EXPLORATION_V2_ROOT}/lanes-operator/lane-connector-mono.svg`,
    copper: `${ICON_EXPLORATION_V2_ROOT}/lanes-operator/lane-connector-copper.svg`,
  },
};

export const FIVE_PIECE_ASSEMBLY = {
  separated: `${ICON_EXPLORATION_V2_ROOT}/five-piece-assembly/pieces-separated.svg`,
  assembledMono: `${ICON_EXPLORATION_V2_ROOT}/five-piece-assembly/assembled-w-mono.svg`,
  assembledDuochrome: `${ICON_EXPLORATION_V2_ROOT}/five-piece-assembly/assembled-w-duochrome.svg`,
};

export const FAVICON_CANDIDATES = {
  operatorDuochrome: `${ICON_EXPLORATION_V2_ROOT}/favicon-candidates/operator-duochrome-favicon.svg`,
  operatorCopper: `${ICON_EXPLORATION_V2_ROOT}/favicon-candidates/operator-copper-favicon.svg`,
  networkMono: `${ICON_EXPLORATION_V2_ROOT}/favicon-candidates/network-mono-favicon.svg`,
};

export const PREVIEW_SHEET_HTML = `${ICON_EXPLORATION_V2_ROOT}/preview-sheet.html`;
