import { iconsV2Assets, RENDER_BATCH_3_WIRE_ENABLED } from "@/lib/render-batch-3-imagery";

export type PrimaryNavId = "people" | "story" | "proof" | "bellows" | "dues";

export type PrimaryNavItem = {
  id: PrimaryNavId;
  href: string;
  label: string;
  lane: (typeof iconsV2Assets)[number]["lane"];
  symbol: string;
};

/** Pruned primary nav — fewer, larger documentary icons. Beta/How/Pricing dropped from header. */
export const primaryNavItems: PrimaryNavItem[] = [
  {
    id: "people",
    href: "/#lanes",
    label: "People",
    lane: "connector",
    symbol: "Six lanes on the floor"
  },
  {
    id: "story",
    href: "/spark",
    label: "Story",
    lane: "spark",
    symbol: "Four-act journey"
  },
  {
    id: "proof",
    href: "/proof",
    label: "Proof",
    lane: "worker",
    symbol: "Inspect the steel"
  },
  {
    id: "bellows",
    href: "/bellows",
    label: "Bellows",
    lane: "builder",
    symbol: "Squibb hosts the floor"
  },
  {
    id: "dues",
    href: "/membership",
    label: "Dues",
    lane: "backer",
    symbol: "Foundry access"
  }
];

const iconByLane = Object.fromEntries(iconsV2Assets.map((icon) => [icon.lane, icon.path])) as Record<
  PrimaryNavItem["lane"],
  string
>;

export function getNavDocumentaryIconPath(lane: PrimaryNavItem["lane"]) {
  if (!RENDER_BATCH_3_WIRE_ENABLED) return null;
  return iconByLane[lane] ?? null;
}

/** When true, nav uses transparent PNG props (Render Batch 6). */
export const NAV_ICONS_TRANSPARENT_WIRE_ENABLED = true;

export const navIconsTransparentFolder = "/assets/draft/icons-nav-transparent-v1";
