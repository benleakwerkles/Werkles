/**
 * WERKLES_LANE_TOKEN_SYSTEM_V1 — six-lane Monopoly-style brass tokens.
 * Draft only. Not wired to production UI.
 */

/** Preview: primary tokens on lane cards in Ender visual tests. */
export const LANE_TOKEN_SYSTEM_V1_ENABLED = false;

export const LANE_TOKEN_SYSTEM_V1_ROOT =
  "/assets/draft/lane-token-system-v1" as const;

export type LaneTokenId =
  | "spark"
  | "builder"
  | "worker"
  | "operator"
  | "backer"
  | "connector";

export const LANE_DEFINITIONS: Record<
  LaneTokenId,
  { label: string; role: string }
> = {
  spark: { label: "Spark", role: "Has the idea / opportunity" },
  builder: { label: "Builder", role: "Builds the thing / system / product" },
  worker: { label: "Worker", role: "Performs skilled craft / execution" },
  operator: { label: "Operator", role: "Runs machine / back office / process" },
  backer: { label: "Backer", role: "Brings capital / resources" },
  connector: { label: "Connector", role: "Brings people / access" },
};

export const RECOMMENDED_SET = "primary" as const;

/** More character — foundry-forward silhouettes; replaces unreadable glove/dog. */
export const FLARE_TOKENS: Record<
  LaneTokenId,
  { symbol: string; mono: string; copper: string }
> = {
  spark: {
    symbol: "flint-strike",
    mono: `${LANE_TOKEN_SYSTEM_V1_ROOT}/flare/spark-flint-strike-mono.svg`,
    copper: `${LANE_TOKEN_SYSTEM_V1_ROOT}/flare/spark-flint-strike-copper.svg`,
  },
  builder: {
    symbol: "t-square",
    mono: `${LANE_TOKEN_SYSTEM_V1_ROOT}/flare/builder-tsquare-mono.svg`,
    copper: `${LANE_TOKEN_SYSTEM_V1_ROOT}/flare/builder-tsquare-copper.svg`,
  },
  worker: {
    symbol: "crucible-tongs",
    mono: `${LANE_TOKEN_SYSTEM_V1_ROOT}/flare/worker-tongs-mono.svg`,
    copper: `${LANE_TOKEN_SYSTEM_V1_ROOT}/flare/worker-tongs-copper.svg`,
  },
  operator: {
    symbol: "keyring",
    mono: `${LANE_TOKEN_SYSTEM_V1_ROOT}/flare/operator-keyring-mono.svg`,
    copper: `${LANE_TOKEN_SYSTEM_V1_ROOT}/flare/operator-keyring-copper.svg`,
  },
  backer: {
    symbol: "ingot",
    mono: `${LANE_TOKEN_SYSTEM_V1_ROOT}/flare/backer-ingot-mono.svg`,
    copper: `${LANE_TOKEN_SYSTEM_V1_ROOT}/flare/backer-ingot-copper.svg`,
  },
  connector: {
    symbol: "interlocking-rings",
    mono: `${LANE_TOKEN_SYSTEM_V1_ROOT}/flare/connector-rings-mono.svg`,
    copper: `${LANE_TOKEN_SYSTEM_V1_ROOT}/flare/connector-rings-copper.svg`,
  },
};

export const PRIMARY_TOKENS: Record<
  LaneTokenId,
  { symbol: string; mono: string; copper: string }
> = {
  spark: {
    symbol: "ember",
    mono: `${LANE_TOKEN_SYSTEM_V1_ROOT}/primary/spark-ember-mono.svg`,
    copper: `${LANE_TOKEN_SYSTEM_V1_ROOT}/primary/spark-ember-copper.svg`,
  },
  builder: {
    symbol: "framing-square",
    mono: `${LANE_TOKEN_SYSTEM_V1_ROOT}/primary/builder-framing-square-mono.svg`,
    copper: `${LANE_TOKEN_SYSTEM_V1_ROOT}/primary/builder-framing-square-copper.svg`,
  },
  worker: {
    symbol: "glove",
    mono: `${LANE_TOKEN_SYSTEM_V1_ROOT}/primary/worker-glove-mono.svg`,
    copper: `${LANE_TOKEN_SYSTEM_V1_ROOT}/primary/worker-glove-copper.svg`,
  },
  operator: {
    symbol: "control-dial",
    mono: `${LANE_TOKEN_SYSTEM_V1_ROOT}/primary/operator-dial-mono.svg`,
    copper: `${LANE_TOKEN_SYSTEM_V1_ROOT}/primary/operator-dial-copper.svg`,
  },
  backer: {
    symbol: "dog-token",
    mono: `${LANE_TOKEN_SYSTEM_V1_ROOT}/primary/backer-dog-token-mono.svg`,
    copper: `${LANE_TOKEN_SYSTEM_V1_ROOT}/primary/backer-dog-token-copper.svg`,
  },
  connector: {
    symbol: "bridge",
    mono: `${LANE_TOKEN_SYSTEM_V1_ROOT}/primary/connector-bridge-mono.svg`,
    copper: `${LANE_TOKEN_SYSTEM_V1_ROOT}/primary/connector-bridge-copper.svg`,
  },
};

export const ALTERNATE_TOKENS: Record<
  LaneTokenId,
  { symbol: string; mono: string; copper: string }
> = {
  spark: {
    symbol: "match",
    mono: `${LANE_TOKEN_SYSTEM_V1_ROOT}/alternate/spark-match-mono.svg`,
    copper: `${LANE_TOKEN_SYSTEM_V1_ROOT}/alternate/spark-match-copper.svg`,
  },
  builder: {
    symbol: "blueprint-block",
    mono: `${LANE_TOKEN_SYSTEM_V1_ROOT}/alternate/builder-blueprint-block-mono.svg`,
    copper: `${LANE_TOKEN_SYSTEM_V1_ROOT}/alternate/builder-blueprint-block-copper.svg`,
  },
  worker: {
    symbol: "boot",
    mono: `${LANE_TOKEN_SYSTEM_V1_ROOT}/alternate/worker-boot-mono.svg`,
    copper: `${LANE_TOKEN_SYSTEM_V1_ROOT}/alternate/worker-boot-copper.svg`,
  },
  operator: {
    symbol: "clipboard",
    mono: `${LANE_TOKEN_SYSTEM_V1_ROOT}/alternate/operator-clipboard-mono.svg`,
    copper: `${LANE_TOKEN_SYSTEM_V1_ROOT}/alternate/operator-clipboard-copper.svg`,
  },
  backer: {
    symbol: "foundation-block",
    mono: `${LANE_TOKEN_SYSTEM_V1_ROOT}/alternate/backer-foundation-block-mono.svg`,
    copper: `${LANE_TOKEN_SYSTEM_V1_ROOT}/alternate/backer-foundation-block-copper.svg`,
  },
  connector: {
    symbol: "compass",
    mono: `${LANE_TOKEN_SYSTEM_V1_ROOT}/alternate/connector-compass-mono.svg`,
    copper: `${LANE_TOKEN_SYSTEM_V1_ROOT}/alternate/connector-compass-copper.svg`,
  },
};

export const SMALL_SIZE_RISKS = {
  primary: ["backer: dog-token needs Monopoly context at 24px"],
  alternate: [
    "spark: match flame nub",
    "connector: compass thin legs",
    "builder: blueprint grid lines",
  ],
} as const;

export const PREVIEW = {
  html: `${LANE_TOKEN_SYSTEM_V1_ROOT}/preview-sheet.html`,
  svg: `${LANE_TOKEN_SYSTEM_V1_ROOT}/preview-sheet.svg`,
  png: `${LANE_TOKEN_SYSTEM_V1_ROOT}/preview-sheet.png`,
};
