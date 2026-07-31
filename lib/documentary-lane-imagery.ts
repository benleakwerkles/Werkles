import { ANYONE_NARRATIVE_V2_ENABLED } from "@/lib/anyone-narrative-v2-imagery";
import { iconsV2Assets } from "@/lib/render-batch-3-imagery";
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

export const documentaryLaneIcons: Record<LaneId, DocumentaryLaneIcon> = Object.fromEntries(
  iconsV2Assets.map((icon) => [
    icon.lane,
    { path: icon.path, symbol: icon.symbol, label: icon.label }
  ])
) as Record<LaneId, DocumentaryLaneIcon>;

export const documentaryImageryAttribution = ANYONE_NARRATIVE_V2_ENABLED
  ? "Homepage story uses visual-story v2. Lane cards use legacy narrative stills."
  : "Documentary human content + prop icons — draft Ghost Forge preview. Not final brand approval.";
