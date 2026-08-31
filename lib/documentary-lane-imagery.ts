import { ANYONE_NARRATIVE_V2_ENABLED } from "@/lib/anyone-narrative-v2-imagery";
import type { LaneId } from "@/lib/visual-system/types";

export type DocumentaryLanePhoto = {
  path: string;
  caption: string;
  alt: string;
};

export type DocumentaryLaneIcon = {
  path: string;
  symbol: string;
  label: string;
};

// Owner walkthrough 2026-07-27: broaden industries beyond construction-heavy
// imagery. Six lanes, six trades — none of them a toolbelt.
const legacyDocumentaryLanePhotos: Record<LaneId, DocumentaryLanePhoto> = {
  spark: {
    path: "/assets/draft/people-v1/people-spark-idea-moment.jpg",
    caption: "The moment the next move becomes worth testing",
    alt: "Person pausing over a notebook to consider a new direction — Spark lane"
  },
  builder: {
    path: "/assets/draft/industry-breadth/werkles-industry-florist.png",
    caption: "Craft hands making the thing real",
    alt: "Florist arranging a bouquet behind her shop counter — Builder lane"
  },
  worker: {
    path: "/assets/draft/industry-breadth/werkles-industry-dogwalker.png",
    caption: "Shows up on schedule, every route",
    alt: "Dog walker with four dogs on a neighborhood route — Worker lane"
  },
  operator: {
    path: "/assets/draft/people-v1/people-vet-exam.jpg",
    caption: "Delivery when promises meet Tuesday",
    alt: "Veterinarian gently examining a golden retriever in a bright clinic — Operator lane"
  },
  backer: {
    path: "/assets/draft/industry-breadth/werkles-industry-accountant.png",
    caption: "Questions before checks",
    alt: "Accountant working through ledgers at a home office desk — Backer lane"
  },
  connector: {
    path: "/assets/draft/industry-breadth/werkles-collab-coffee-plans.png",
    caption: "Introduction without performance",
    alt: "Two people discussing plans over coffee — Connector lane"
  }
};

/** Human-first documentary stills — legacy narrative only (no stock mash). */
export const documentaryLanePhotos: Record<LaneId, DocumentaryLanePhoto> = legacyDocumentaryLanePhotos;

/* Lane icons: clear-v1 family (Ben + red-team, 2026-08-02). One-second rule:
   every icon is an object a stranger names instantly. MJ keepers + in-house,
   backgrounds stripped, normalized 512px transparent PNGs. */
const laneIconRoot = "/assets/brand/product-icons/clear-v1";

export const documentaryLaneIcons: Record<LaneId, DocumentaryLaneIcon> = {
  spark: { path: `${laneIconRoot}/icon-spark-match.png`, symbol: "Struck match", label: "Spark" },
  builder: { path: `${laneIconRoot}/icon-builder-hammer.png`, symbol: "Hammer", label: "Builder" },
  worker: { path: `${laneIconRoot}/icon-worker-glove.png`, symbol: "Work glove", label: "Worker" },
  operator: { path: `${laneIconRoot}/icon-operator-clipboard.png`, symbol: "Checklist clipboard", label: "Operator" },
  backer: { path: `${laneIconRoot}/icon-backer-coins.png`, symbol: "Coin stack", label: "Backer" },
  connector: { path: `${laneIconRoot}/icon-connector-plug.png`, symbol: "Plug meets socket", label: "Connector" }
};

export const documentaryImageryAttribution = ANYONE_NARRATIVE_V2_ENABLED
  ? "Homepage story uses visual-story v2. Lane cards use legacy narrative stills."
  : "Documentary human content + prop icons — draft Ghost Forge preview. Not final brand approval.";
