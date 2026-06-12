/**
 * WERKLES_ICON_EXPLORATION_V1 — draft vector marks only.
 * Not wired to production UI. Separate from render-batch human imagery.
 */

export const ICON_EXPLORATION_V1_ENABLED = false;

export const ICON_EXPLORATION_V1_ROOT =
  "/assets/draft/icon-exploration-v1" as const;

export type IconFamily = "operator" | "network" | "foundry";

export type LaneRole =
  | "spark"
  | "builder"
  | "operator"
  | "backer"
  | "connector";

export const ICON_FAMILIES: Record<
  IconFamily,
  { label: string; primaryMono: string; primaryCopper: string }
> = {
  operator: {
    label: "Operator Marks",
    primaryMono: `${ICON_EXPLORATION_V1_ROOT}/operator-marks/mark-primary-mono.svg`,
    primaryCopper: `${ICON_EXPLORATION_V1_ROOT}/operator-marks/mark-primary-copper.svg`,
  },
  network: {
    label: "Network Marks",
    primaryMono: `${ICON_EXPLORATION_V1_ROOT}/network-marks/mark-primary-mono.svg`,
    primaryCopper: `${ICON_EXPLORATION_V1_ROOT}/network-marks/mark-primary-copper.svg`,
  },
  foundry: {
    label: "Foundry Marks",
    primaryMono: `${ICON_EXPLORATION_V1_ROOT}/foundry-marks/mark-primary-mono.svg`,
    primaryCopper: `${ICON_EXPLORATION_V1_ROOT}/foundry-marks/mark-primary-copper.svg`,
  },
};

export const RECOMMENDED_FAMILY: IconFamily = "network";

export const LANE_ICONS: Record<
  IconFamily,
  Record<LaneRole, { mono: string; copper?: string }>
> = {
  operator: {
    spark: {
      mono: `${ICON_EXPLORATION_V1_ROOT}/lanes-operator/lane-spark-mono.svg`,
    },
    builder: {
      mono: `${ICON_EXPLORATION_V1_ROOT}/lanes-operator/lane-builder-mono.svg`,
    },
    operator: {
      mono: `${ICON_EXPLORATION_V1_ROOT}/lanes-operator/lane-operator-mono.svg`,
    },
    backer: {
      mono: `${ICON_EXPLORATION_V1_ROOT}/lanes-operator/lane-backer-mono.svg`,
    },
    connector: {
      mono: `${ICON_EXPLORATION_V1_ROOT}/lanes-operator/lane-connector-mono.svg`,
    },
  },
  network: {
    spark: {
      mono: `${ICON_EXPLORATION_V1_ROOT}/lanes-network/lane-spark-mono.svg`,
      copper: `${ICON_EXPLORATION_V1_ROOT}/lanes-network/lane-spark-copper.svg`,
    },
    builder: {
      mono: `${ICON_EXPLORATION_V1_ROOT}/lanes-network/lane-builder-mono.svg`,
      copper: `${ICON_EXPLORATION_V1_ROOT}/lanes-network/lane-builder-copper.svg`,
    },
    operator: {
      mono: `${ICON_EXPLORATION_V1_ROOT}/lanes-network/lane-operator-mono.svg`,
      copper: `${ICON_EXPLORATION_V1_ROOT}/lanes-network/lane-operator-copper.svg`,
    },
    backer: {
      mono: `${ICON_EXPLORATION_V1_ROOT}/lanes-network/lane-backer-mono.svg`,
      copper: `${ICON_EXPLORATION_V1_ROOT}/lanes-network/lane-backer-copper.svg`,
    },
    connector: {
      mono: `${ICON_EXPLORATION_V1_ROOT}/lanes-network/lane-connector-mono.svg`,
      copper: `${ICON_EXPLORATION_V1_ROOT}/lanes-network/lane-connector-copper.svg`,
    },
  },
  foundry: {
    spark: {
      mono: `${ICON_EXPLORATION_V1_ROOT}/lanes-foundry/lane-spark-mono.svg`,
    },
    builder: {
      mono: `${ICON_EXPLORATION_V1_ROOT}/lanes-foundry/lane-builder-mono.svg`,
    },
    operator: {
      mono: `${ICON_EXPLORATION_V1_ROOT}/lanes-foundry/lane-operator-mono.svg`,
    },
    backer: {
      mono: `${ICON_EXPLORATION_V1_ROOT}/lanes-foundry/lane-backer-mono.svg`,
    },
    connector: {
      mono: `${ICON_EXPLORATION_V1_ROOT}/lanes-foundry/lane-connector-mono.svg`,
    },
  },
};

export const FIVE_PIECE_ASSEMBLY = {
  separated: `${ICON_EXPLORATION_V1_ROOT}/five-piece-assembly/pieces-separated.svg`,
  assembledMono: `${ICON_EXPLORATION_V1_ROOT}/five-piece-assembly/assembled-w-mono.svg`,
  assembledCopper: `${ICON_EXPLORATION_V1_ROOT}/five-piece-assembly/assembled-w-copper.svg`,
  pieces: {
    spark: `${ICON_EXPLORATION_V1_ROOT}/five-piece-assembly/piece-spark.svg`,
    builder: `${ICON_EXPLORATION_V1_ROOT}/five-piece-assembly/piece-builder.svg`,
    operator: `${ICON_EXPLORATION_V1_ROOT}/five-piece-assembly/piece-operator.svg`,
    backer: `${ICON_EXPLORATION_V1_ROOT}/five-piece-assembly/piece-backer.svg`,
    connector: `${ICON_EXPLORATION_V1_ROOT}/five-piece-assembly/piece-connector.svg`,
  },
};

export const FAVICON_CANDIDATES = {
  networkMono: `${ICON_EXPLORATION_V1_ROOT}/favicon-candidates/network-favicon-mono.svg`,
  networkCopper: `${ICON_EXPLORATION_V1_ROOT}/favicon-candidates/network-favicon-copper.svg`,
  operatorMono: `${ICON_EXPLORATION_V1_ROOT}/favicon-candidates/operator-favicon-mono.svg`,
  foundryMono: `${ICON_EXPLORATION_V1_ROOT}/favicon-candidates/foundry-favicon-mono.svg`,
  fivePieceMono: `${ICON_EXPLORATION_V1_ROOT}/favicon-candidates/five-piece-favicon-mono.svg`,
};

export const PREVIEW_SHEET = {
  svg: `${ICON_EXPLORATION_V1_ROOT}/preview-sheet.svg`,
  html: `${ICON_EXPLORATION_V1_ROOT}/preview-sheet.html`,
  png: `${ICON_EXPLORATION_V1_ROOT}/preview-sheet.png`,
};
