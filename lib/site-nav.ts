import { iconsV2Assets, RENDER_BATCH_3_WIRE_ENABLED } from "@/lib/render-batch-3-imagery";

export type PrimaryNavId = "people" | "story" | "proof" | "bellows" | "membership";

export type PrimaryNavItem = {
  id: PrimaryNavId;
  href: string;
  label: string;
  lane: (typeof iconsV2Assets)[number]["lane"];
  symbol: string;
};

export type MemberNavItem = Readonly<{
  id: "work" | "people" | "bellows" | "about";
  href: string;
  label: string;
}>;

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
    id: "membership",
    href: "/membership",
    label: "Membership",
    lane: "backer",
    symbol: "Foundry membership"
  }
];

/** Stable member navigation. A label has one destination across the site. */
export const memberNavItems: readonly MemberNavItem[] = Object.freeze([
  Object.freeze({ id: "work", href: "/dashboard/blueprints", label: "My Work" }),
  Object.freeze({ id: "people", href: "/dashboard/intros", label: "Match Deck" }),
  Object.freeze({ id: "bellows", href: "/bellows/personal", label: "Bellows" }),
  Object.freeze({ id: "about", href: "/dashboard/profile", label: "About Me" })
]);

export type MemberRouteContext = Readonly<{
  label: string;
  purpose: string;
  nextHref: string;
  nextLabel: string;
}>;

const memberRouteContexts: readonly (Readonly<{
  matches: (pathname: string) => boolean;
}> & MemberRouteContext)[] = Object.freeze([
  Object.freeze({ matches: (path: string) => path.startsWith("/dashboard/werkles/formation"), label: "Possible Werkle", purpose: "Decide what could become shared without erasing either person’s work.", nextHref: "/bellows/personal", nextLabel: "My Bellows" }),
  Object.freeze({ matches: (path: string) => path.startsWith("/dashboard/blueprints"), label: "My Work", purpose: "Turn the strongest next move into a plan you can use.", nextHref: "/dashboard/intros", nextLabel: "Match Deck" }),
  Object.freeze({ matches: (path: string) => path.startsWith("/dashboard/intros"), label: "Match Deck", purpose: "Compare possible collaborators and the reasons they may fit.", nextHref: "#match-deck-candidates", nextLabel: "Choose a Match" }),
  Object.freeze({ matches: (path: string) => path.startsWith("/dashboard/profile"), label: "About Me", purpose: "Control how other members meet you and what you are building.", nextHref: "/dashboard/crucible", nextLabel: "Optional Checks" }),
  Object.freeze({ matches: (path: string) => path.startsWith("/dashboard/crucible"), label: "Optional Checks", purpose: "Check one narrow fact only when a real decision needs it.", nextHref: "/dashboard/profile", nextLabel: "About Me" }),
  Object.freeze({ matches: (path: string) => path.startsWith("/dashboard/billing"), label: "Membership", purpose: "Review what is included before changing a plan.", nextHref: "/dashboard", nextLabel: "Member Home" }),
  Object.freeze({ matches: (path: string) => path === "/dashboard", label: "Member Home", purpose: "Choose which piece of work to pick up next.", nextHref: "/dashboard/blueprints", nextLabel: "My Work" }),
  Object.freeze({ matches: (path: string) => path.startsWith("/bellows/intake"), label: "Intake", purpose: "Tell Werkles what you are trying to make happen and what is in the way.", nextHref: "/bellows/recommendations", nextLabel: "Recommendations" }),
  Object.freeze({ matches: (path: string) => path.startsWith("/bellows/recommendations"), label: "Recommendations", purpose: "Compare possible next moves before choosing what to work on.", nextHref: "/dashboard/blueprints", nextLabel: "My Work" }),
  Object.freeze({ matches: (path: string) => path.startsWith("/bellows/personal"), label: "My Bellows", purpose: "Learn one useful method and turn it into working material.", nextHref: "/dashboard/blueprints", nextLabel: "My Work" }),
  Object.freeze({ matches: (path: string) => path.startsWith("/bellows/library"), label: "Bellows Library", purpose: "Browse practical lessons when you want a wider view.", nextHref: "/bellows/personal", nextLabel: "My Bellows" })
]);

export function memberRouteContext(pathname: string): MemberRouteContext | null {
  return memberRouteContexts.find((route) => route.matches(pathname)) ?? null;
}

export function memberNavIsCurrent(id: MemberNavItem["id"], pathname: string) {
  if (id === "work") return pathname.startsWith("/dashboard/blueprints") || pathname.startsWith("/bellows/intake") || pathname.startsWith("/bellows/recommendations");
  if (id === "people") return pathname.startsWith("/dashboard/intros") || pathname.startsWith("/dashboard/werkles");
  if (id === "bellows") return pathname.startsWith("/bellows/personal") || pathname.startsWith("/bellows/library");
  return pathname.startsWith("/dashboard/profile") || pathname.startsWith("/dashboard/crucible");
}

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
