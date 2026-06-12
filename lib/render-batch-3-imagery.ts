/** Render Batch 3 — narrative-human icons + Space/Forge extras (preview wire). */
export const RENDER_BATCH_3_WIRE_ENABLED = true;

export const iconsV2Folder = "/assets/draft/icons-v2";
export const narrativeV2Folder = "/assets/draft/homepage-narrative-v2";

export const iconsV2Assets = [
  {
    id: "icon-v2-spark-flint",
    lane: "spark",
    label: "Spark",
    symbol: "Flint strike",
    path: `${iconsV2Folder}/werkles-icon-v2-lane-spark-flint-strike.png`
  },
  {
    id: "icon-v2-builder-tsquare",
    lane: "builder",
    label: "Builder",
    symbol: "T-square",
    path: `${iconsV2Folder}/werkles-icon-v2-lane-builder-tsquare.png`
  },
  {
    id: "icon-v2-worker-tongs",
    lane: "worker",
    label: "Worker",
    symbol: "Crucible tongs",
    path: `${iconsV2Folder}/werkles-icon-v2-lane-worker-tongs.png`
  },
  {
    id: "icon-v2-operator-keyring",
    lane: "operator",
    label: "Operator",
    symbol: "Keyring",
    path: `${iconsV2Folder}/werkles-icon-v2-lane-operator-keyring.png`
  },
  {
    id: "icon-v2-backer-ingot",
    lane: "backer",
    label: "Backer",
    symbol: "Ingot stack",
    path: `${iconsV2Folder}/werkles-icon-v2-lane-backer-ingot-stack.png`
  },
  {
    id: "icon-v2-connector-rings",
    lane: "connector",
    label: "Connector",
    symbol: "Interlocking rings",
    path: `${iconsV2Folder}/werkles-icon-v2-lane-connector-rings.png`
  }
] as const;

export const narrativeV2Assets = {
  spaceD04ReceptionQuiet: `${narrativeV2Folder}/werkles-homepage-narrative-space-d04-reception-quiet.png`,
  spaceD05VanDawn: `${narrativeV2Folder}/werkles-homepage-narrative-space-d05-van-dawn.png`,
  spaceD02MaterialsStaged: `${narrativeV2Folder}/werkles-homepage-narrative-space-d02-materials-staged.png`,
  spaceD03ToolAtRest: `${narrativeV2Folder}/werkles-homepage-narrative-space-d03-tool-at-rest.png`,
  forgeA04ThreeAtPlan: `${narrativeV2Folder}/werkles-homepage-narrative-forge-a04-three-at-plan.png`,
  forgeA05NearlyFinishedPair: `${narrativeV2Folder}/werkles-homepage-narrative-forge-a05-nearly-finished-pair.png`,
  forgeA06BuilderOperatorPlan: `${narrativeV2Folder}/werkles-homepage-narrative-forge-a06-builder-operator-plan.png`,
  forgeA07ConnectorIntroTable: `${narrativeV2Folder}/werkles-homepage-narrative-forge-a07-connector-intro-table.png`,
  spaceD06BakeryPrepQuiet: `${narrativeV2Folder}/werkles-homepage-narrative-space-d06-bakery-prep-quiet.png`,
  spaceD07WorkshopPegboard: `${narrativeV2Folder}/werkles-homepage-narrative-space-d07-workshop-pegboard.png`
} as const;

export const spaceV2Gallery = [
  {
    id: "space-d04",
    title: "Reception quiet hour",
    caption: "Appointment book, pen in gutter — inhabited not staged.",
    path: narrativeV2Assets.spaceD04ReceptionQuiet
  },
  {
    id: "space-d05",
    title: "Van at dawn",
    caption: "One tool out of rack — working life before the crew.",
    path: narrativeV2Assets.spaceD05VanDawn
  },
  {
    id: "space-d02-materials",
    title: "Materials staged",
    caption: "Half-built alt — tile, lumber, conduit in frame.",
    path: narrativeV2Assets.spaceD02MaterialsStaged
  }
] as const;

export const forgeV2Gallery = [
  {
    id: "forge-a05",
    title: "Nearly finished pair",
    caption: "Last fixture — space almost open.",
    path: narrativeV2Assets.forgeA05NearlyFinishedPair
  },
  {
    id: "forge-a06",
    title: "Builder + operator at plan",
    caption: "Lanes meeting on the numbers.",
    path: narrativeV2Assets.forgeA06BuilderOperatorPlan
  },
  {
    id: "forge-a07",
    title: "Connector intro",
    caption: "Three at the table — introduction without performance.",
    path: narrativeV2Assets.forgeA07ConnectorIntroTable
  }
] as const;

export const renderBatch3AttributionNote =
  "Render Batch 3 — documentary prop icons + Space/Forge extras. Draft preview only.";
