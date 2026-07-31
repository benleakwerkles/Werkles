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
    path: "/assets/draft/industry-breadth/werkles-industry-dj.png",
    caption: "The weekend rig that wants to be a company",
    alt: "DJ setting up her mobile rig before an event — Spark lane"
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
    path: "/assets/draft/industry-breadth/werkles-industry-veterinarian.png",
    caption: "Delivery when promises meet Tuesday",
    alt: "Veterinarian examining a dog in a small clinic — Operator lane"
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

/* Lane icons rebuilt in the lady-jessica-v1 family (Ben, 2026-07-31: the
   sepia Ghost Forge photo-props read as "old icons I hate"). Same metaphors,
   logo-tone flat vectors. */
const laneIconRoot = "/assets/brand/product-icons/lady-jessica-v1";

export const documentaryLaneIcons: Record<LaneId, DocumentaryLaneIcon> = {
  spark: { path: `${laneIconRoot}/werkles-lane-spark-v1.png`, symbol: "Flint strike", label: "Spark" },
  builder: { path: `${laneIconRoot}/werkles-lane-builder-v1.png`, symbol: "T-square", label: "Builder" },
  worker: { path: `${laneIconRoot}/werkles-lane-worker-v1.png`, symbol: "Crucible tongs", label: "Worker" },
  operator: { path: `${laneIconRoot}/werkles-lane-operator-v1.png`, symbol: "Keyring", label: "Operator" },
  backer: { path: `${laneIconRoot}/werkles-lane-backer-v1.png`, symbol: "Ingot stack", label: "Backer" },
  connector: { path: `${laneIconRoot}/werkles-lane-connector-v1.png`, symbol: "Interlocking rings", label: "Connector" }
};

export const documentaryImageryAttribution = ANYONE_NARRATIVE_V2_ENABLED
  ? "Homepage story uses visual-story v2. Lane cards use legacy narrative stills."
  : "Documentary human content + prop icons — draft Ghost Forge preview. Not final brand approval.";
