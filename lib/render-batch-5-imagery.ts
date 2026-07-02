/** Render Batch 5 — documentary icon alternates (v2-b props). Wire when assets exist. */
export const RENDER_BATCH_5_WIRE_ENABLED = false;

export const iconsV2BFolder = "/assets/draft/icons-v2-b";

export const iconsV2BAssets = [
  {
    id: "icon-v2b-spark-matchbook",
    lane: "spark",
    label: "Spark",
    symbol: "Matchbook / candle stub",
    path: `${iconsV2BFolder}/werkles-icon-v2b-lane-spark-matchbook.png`
  },
  {
    id: "icon-v2b-builder-chalkline",
    lane: "builder",
    label: "Builder",
    symbol: "Chalk line reel",
    path: `${iconsV2BFolder}/werkles-icon-v2b-lane-builder-chalkline.png`
  },
  {
    id: "icon-v2b-worker-glove",
    lane: "worker",
    label: "Worker",
    symbol: "Work glove",
    path: `${iconsV2BFolder}/werkles-icon-v2b-lane-worker-glove.png`
  },
  {
    id: "icon-v2b-operator-clipboard",
    lane: "operator",
    label: "Operator",
    symbol: "Clipboard",
    path: `${iconsV2BFolder}/werkles-icon-v2b-lane-operator-clipboard.png`
  },
  {
    id: "icon-v2b-backer-envelopes",
    lane: "backer",
    label: "Backer",
    symbol: "Banded envelopes",
    path: `${iconsV2BFolder}/werkles-icon-v2b-lane-backer-envelopes.png`
  },
  {
    id: "icon-v2b-connector-cards",
    lane: "connector",
    label: "Connector",
    symbol: "Edge-over-edge cards",
    path: `${iconsV2BFolder}/werkles-icon-v2b-lane-connector-cards.png`
  }
] as const;

export const renderBatch5AttributionNote =
  "Render Batch 5 — documentary prop alternates (v2-b). Draft preview only.";
