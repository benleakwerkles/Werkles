import { narrativeV2Assets } from "@/lib/render-batch-3-imagery";

/** Render Batch 4 — Squibb Bellows + Space extras. Flat v3 Operator Marks retired from site preview. */
export const RENDER_BATCH_4_WIRE_ENABLED = true;
export const RENDER_BATCH_4_ICONS_V3_ENABLED = false;
export const RENDER_BATCH_4_SQUIBB_ENABLED = true;

export const iconsV3Folder = "/assets/draft/icons-v3";
export const squibbBellowsFolder = "/assets/draft/squibb-bellows-v1";

export const iconsV3Assets = [
  {
    id: "icon-v3-mark-w-duochrome",
    lane: "mark",
    label: "W mark",
    symbol: "Duochrome interlock",
    path: `${iconsV3Folder}/werkles-icon-v3-mark-w-duochrome.png`
  },
  {
    id: "icon-v3-lane-spark-candle",
    lane: "spark",
    label: "Spark",
    symbol: "Candle",
    path: `${iconsV3Folder}/werkles-icon-v3-lane-spark-candle.png`
  },
  {
    id: "icon-v3-lane-builder-blocks",
    lane: "builder",
    label: "Builder",
    symbol: "Stacked blocks",
    path: `${iconsV3Folder}/werkles-icon-v3-lane-builder-blocks.png`
  },
  {
    id: "icon-v3-lane-worker-crucible",
    lane: "worker",
    label: "Worker",
    symbol: "Crucible",
    path: `${iconsV3Folder}/werkles-icon-v3-lane-worker-crucible.png`
  },
  {
    id: "icon-v3-lane-operator-hub",
    lane: "operator",
    label: "Operator",
    symbol: "Control hub",
    path: `${iconsV3Folder}/werkles-icon-v3-lane-operator-hub.png`
  },
  {
    id: "icon-v3-lane-connector-arch",
    lane: "connector",
    label: "Connector",
    symbol: "Bridge arch",
    path: `${iconsV3Folder}/werkles-icon-v3-lane-connector-arch.png`
  },
  {
    id: "icon-v3-lane-backer-foundation",
    lane: "backer",
    label: "Backer",
    symbol: "Foundation block",
    path: `${iconsV3Folder}/werkles-icon-v3-lane-backer-foundation.png`
  }
] as const;

export const squibbBellowsAssets = {
  bustHost: `${squibbBellowsFolder}/werkles-squibb-bellows-bust-host-v1.png`,
  lessonCard: `${squibbBellowsFolder}/werkles-squibb-bellows-lesson-card-v1.png`,
  workshopDesk: `${squibbBellowsFolder}/werkles-squibb-bellows-workshop-desk-v1.png`
} as const;

export const spaceBatch4Items = [
  {
    id: "space-d06",
    title: "Bakery prep quiet",
    caption: "Trays stacked, apron on hook — before the crew arrives.",
    path: narrativeV2Assets.spaceD06BakeryPrepQuiet
  },
  {
    id: "space-d07",
    title: "Workshop pegboard",
    caption: "Tools on pegs, half project on bench — recent use visible.",
    path: narrativeV2Assets.spaceD07WorkshopPegboard
  }
] as const;

export const renderBatch4AttributionNote =
  "Render Batch 4 — Squibb Bellows exploration + Space extras. Draft preview only.";
