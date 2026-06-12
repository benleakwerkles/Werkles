import type { FormationPhase, LaneId } from "@/lib/visual-system/types";

/** Toggle editorial stock placeholders site-wide (preview only — Ghost Forge replaces). */
export const STOCK_PREVIEW_ENABLED = false;

export type StockPreviewAsset = {
  path: string;
  source: "unsplash" | "pexels";
  credit: string;
  creditUrl: string;
  scene: string;
};

export const stockPreviewFolder = "/assets/draft/stock-preview";

export const stockPreviewHero: StockPreviewAsset = {
  path: `${stockPreviewFolder}/hero-workshop.jpg`,
  source: "unsplash",
  credit: "Unsplash",
  creditUrl: "https://unsplash.com/photos/1504917595217-d4dc5ebe6122",
  scene: "Workshop bench — tools and materials, no fantasy staging"
};

export const stockPreviewByLane: Record<LaneId, StockPreviewAsset> = {
  spark: {
    path: `${stockPreviewFolder}/lane-spark-glass.jpg`,
    source: "pexels",
    credit: "Pexels",
    creditUrl: "https://www.pexels.com/photo/2807343/",
    scene: "Glass studio — half-lit creative bench"
  },
  operator: {
    path: `${stockPreviewFolder}/lane-operator-office.jpg`,
    source: "unsplash",
    credit: "Unsplash",
    creditUrl: "https://unsplash.com/photos/1497366216548-37526070297c",
    scene: "Small office floor — schedules and delivery reality"
  },
  backer: {
    path: `${stockPreviewFolder}/lane-backer-desk.jpg`,
    source: "unsplash",
    credit: "Unsplash",
    creditUrl: "https://unsplash.com/photos/1454165804606-c3d57bc86b40",
    scene: "Planning desk — notebooks, no banking handshake tropes"
  },
  connector: {
    path: `${stockPreviewFolder}/lane-connector-cafe.jpg`,
    source: "unsplash",
    credit: "Unsplash",
    creditUrl: "https://unsplash.com/photos/1554118811-1e0d58224f24",
    scene: "Neighborhood café — room with a pulse"
  },
  builder: {
    path: `${stockPreviewFolder}/lane-builder-woodshop.jpg`,
    source: "pexels",
    credit: "Pexels",
    creditUrl: "https://www.pexels.com/photo/3933255/",
    scene: "Woodshop bench — craft and field judgment"
  },
  worker: {
    path: `${stockPreviewFolder}/lane-worker-bakery.jpg`,
    source: "pexels",
    credit: "Pexels",
    creditUrl: "https://www.pexels.com/photo/2132665/",
    scene: "Cupcake shop counter — skilled execution on the bench"
  }
};

export const stockPreviewFormation: Record<FormationPhase, StockPreviewAsset> = {
  solo: {
    path: `${stockPreviewFolder}/formation-solo.jpg`,
    source: "pexels",
    credit: "Pexels",
    creditUrl: "https://www.pexels.com/photo/1571460/",
    scene: "Solo workspace — one chair, formation not started"
  },
  partial: {
    path: `${stockPreviewFolder}/formation-partial.jpg`,
    source: "unsplash",
    credit: "Unsplash",
    creditUrl: "https://unsplash.com/photos/1581092160562-40aa08e78837",
    scene: "Industrial floor — partial assembly in progress"
  },
  formed: {
    path: `${stockPreviewFolder}/formation-formed.jpg`,
    source: "pexels",
    credit: "Pexels",
    creditUrl: "https://www.pexels.com/photo/3184292/",
    scene: "Shared work table — locked joints, complementary lanes"
  }
};

export const stockPreviewAttributionNote =
  "Stock preview placeholders (Unsplash / Pexels). Replace with Ghost Forge custom assets before production.";
