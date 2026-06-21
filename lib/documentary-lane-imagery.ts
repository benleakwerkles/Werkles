import { ANYONE_NARRATIVE_V2_ENABLED } from "@/lib/anyone-narrative-v2-imagery";
import { narrativeV1Assets } from "@/lib/homepage-narrative-imagery";
import { iconsV2Assets, narrativeV2Assets } from "@/lib/render-batch-3-imagery";
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

const legacyDocumentaryLanePhotos: Record<LaneId, DocumentaryLanePhoto> = {
  spark: {
    path: narrativeV1Assets.sparkC01KitchenTable,
    caption: "Act I — thought in progress",
    alt: "Person at kitchen table with notes — Spark beat"
  },
  builder: {
    path: narrativeV1Assets.forgeA03HalfBuiltPair,
    caption: "Two lanes on the plan",
    alt: "Builder and partner reviewing plans in half-built space"
  },
  worker: {
    path: narrativeV2Assets.spaceD03ToolAtRest,
    caption: "Tool at rest — placed by use",
    alt: "Workshop tool at rest on bench — Worker lane"
  },
  operator: {
    path: narrativeV2Assets.forgeA06BuilderOperatorPlan,
    caption: "Operator lane at the numbers",
    alt: "Builder and operator reviewing plan together"
  },
  backer: {
    path: narrativeV2Assets.spaceD04ReceptionQuiet,
    caption: "Back-office before the crew",
    alt: "Quiet reception desk — capital discipline without theater"
  },
  connector: {
    path: narrativeV2Assets.forgeA07ConnectorIntroTable,
    caption: "Introduction without performance",
    alt: "Three people at table — Connector beat"
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
