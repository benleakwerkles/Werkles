import type { FormationPhase, LaneId } from "@/lib/visual-system/types";

/** WERKLES_RENDER_BATCH_1 — local preview generated imagery (draft only). */
export const RENDER_BATCH_1_ENABLED = false;

export const renderBatch1Folder = "/assets/draft/render-batch-1";

export type RenderBatch1Asset = {
  id: string;
  path: string;
  title: string;
  placement: string;
  priority: number;
};

export const renderBatch1Assets: RenderBatch1Asset[] = [
  {
    id: "spark-kitchen-table",
    path: `${renderBatch1Folder}/werkles-render-batch-1-spark-kitchen-table.png`,
    title: "Spark founder at kitchen table",
    placement: "Hero background · Spark lane card",
    priority: 1
  },
  {
    id: "operator-nurse-sue",
    path: `${renderBatch1Folder}/werkles-render-batch-1-operator-nurse-sue.png`,
    title: "Nurse Sue — operator in medical office",
    placement: "Operator lane card · How-it-works fit step",
    priority: 2
  },
  {
    id: "electrician-bookkeeper",
    path: `${renderBatch1Folder}/werkles-render-batch-1-electrician-bookkeeper.png`,
    title: "Electrician + bookkeeper reviewing job profitability",
    placement: "Formation partial backdrop · Builder/Backer pairing",
    priority: 3
  },
  {
    id: "connector-intro",
    path: `${renderBatch1Folder}/werkles-render-batch-1-connector-intro.png`,
    title: "Connector introducing two founders",
    placement: "Connector lane card · Formation partial",
    priority: 4
  },
  {
    id: "accountants-plumbing",
    path: `${renderBatch1Folder}/werkles-render-batch-1-accountants-plumbing.png`,
    title: "Accountants partnering with plumbing company",
    placement: "Formation formed · People gallery",
    priority: 5
  },
  {
    id: "drone-crabbing-team",
    path: `${renderBatch1Folder}/werkles-render-batch-1-drone-crabbing-team.png`,
    title: "Drone crabbing startup team",
    placement: "Spark lane alt · Gallery featured",
    priority: 6
  },
  {
    id: "mentor-contractor",
    path: `${renderBatch1Folder}/werkles-render-batch-1-mentor-contractor.png`,
    title: "Retired contractor mentoring younger builder",
    placement: "Builder lane card · Trust band scrim",
    priority: 7
  },
  {
    id: "backer-opportunity-packet",
    path: `${renderBatch1Folder}/werkles-render-batch-1-backer-opportunity-packet.png`,
    title: "Local backer reviewing opportunity packet",
    placement: "Backer lane card · Beta/proof ops card",
    priority: 8
  }
];

export const renderBatch1Hero = renderBatch1Assets[0];

export const renderBatch1ByLane: Partial<Record<LaneId, RenderBatch1Asset>> = {
  spark: renderBatch1Assets[0],
  operator: renderBatch1Assets[1],
  backer: renderBatch1Assets[7],
  connector: renderBatch1Assets[3],
  builder: renderBatch1Assets[6],
  worker: renderBatch1Assets[2]
};

export const renderBatch1Formation: Partial<Record<FormationPhase, RenderBatch1Asset>> = {
  solo: renderBatch1Assets[0],
  partial: renderBatch1Assets[3],
  formed: renderBatch1Assets[4]
};

export const renderBatch1AttributionNote =
  "Render Batch 1 — draft generated preview. Not final brand approval. Replace via Ghost Forge when Gate 05 opens.";
