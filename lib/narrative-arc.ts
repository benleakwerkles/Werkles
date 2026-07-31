import { narrativeV1Assets } from "@/lib/homepage-narrative-imagery";
import { narrativeV2Assets, spaceV2Gallery, forgeV2Gallery } from "@/lib/render-batch-3-imagery";
import { spaceBatch4Items } from "@/lib/render-batch-4-imagery";

export type NarrativeActId = "spark" | "space" | "forge" | "foundry";

export type NarrativeActPage = {
  id: NarrativeActId;
  act: number;
  slug: string;
  eyebrow: string;
  headline: string;
  lede: string;
  heroImage: string;
  heroAlt: string;
  nextSlug: string | null;
  nextLabel: string | null;
  ctaHref: string;
  ctaLabel: string;
};

export const narrativeArcPages: NarrativeActPage[] = [
  {
    id: "spark",
    act: 1,
    slug: "/spark",
    eyebrow: "The story — what Werkles is",
    headline: "You bring the spark. Werkles helps you build the real thing.",
    lede:
      "Werkles is organized decision support for people starting or growing a small business: name what you actually need, see honest options and risks, verify the facts, and make the call yourself.",
    // Owner walkthrough 2026-07-27 keep list: universal collaboration scenes,
    // especially people discussing a project over coffee.
    heroImage: "/assets/draft/industry-breadth/werkles-collab-coffee-plans.png",
    heroAlt: "Two people working through business plans together over coffee",
    nextSlug: "/space",
    nextLabel: "Act II — Space",
    ctaHref: "/signup",
    ctaLabel: "Start free"
  },
  {
    id: "space",
    act: 2,
    slug: "/space",
    eyebrow: "Act II — Space",
    headline: "The place your business happens.",
    lede:
      "A storefront, a route, a bench, a spare room — every venture needs somewhere to stand. Werkles helps you figure out what space the next step actually requires, and what it honestly costs.",
    heroImage: "/assets/draft/industry-breadth/werkles-space-just-leased.png",
    heroAlt: "Just-leased storefront with keys on the counter in morning light",
    nextSlug: "/formation",
    nextLabel: "Act III — Forge",
    ctaHref: "/#space",
    ctaLabel: "See Space on home"
  },
  {
    id: "forge",
    act: 3,
    slug: "/formation",
    eyebrow: "Act III — Forge",
    headline: "The right people, around the same work.",
    lede:
      "Builders, operators, backers, connectors — different lanes, one plan. Werkles helps you name which lane is actually missing and meet it with proof attached.",
    heroImage: narrativeV1Assets.forgeA03HalfBuiltPair,
    heroAlt: "Two people reviewing plans in half-built space — Forge beat",
    nextSlug: "/proof",
    nextLabel: "Act IV — Foundry",
    ctaHref: "/onboarding",
    ctaLabel: "Pick your lane"
  },
  {
    id: "foundry",
    act: 4,
    slug: "/proof",
    eyebrow: "Act IV — Foundry",
    headline: "Proof you can check before you rely on anyone.",
    lede:
      "A shop opening, a route bought, a practice seeing patients. It happens when the missing piece becomes visible and the facts get verified — identity, credentials, references, funds — at the moment they matter.",
    heroImage: narrativeV1Assets.foundryB02FinishedProduct,
    heroAlt: "Finished product on bench — Foundry proof texture",
    nextSlug: "/bellows",
    nextLabel: "Bellows — learn the floor",
    ctaHref: "/membership",
    ctaLabel: "Join the Foundry"
  }
];

export const allSpaceGallery = [
  {
    id: "space-d01",
    title: "Before opening",
    caption: "Canonical Act II — quiet hour, room waiting to be filled.",
    path: narrativeV1Assets.spaceD01BeforeOpening
  },
  {
    id: "space-d02",
    title: "Half-built",
    caption: "Space becoming — rhymes with Forge A03.",
    path: narrativeV1Assets.spaceD02HalfBuilt
  },
  {
    id: "space-d03",
    title: "Tool at rest",
    caption: "Intimate register — object placed by use.",
    path: narrativeV2Assets.spaceD03ToolAtRest
  },
  ...spaceV2Gallery.map((item) => ({ id: item.id, title: item.title, caption: item.caption, path: item.path })),
  ...spaceBatch4Items.map((item) => ({ id: item.id, title: item.title, caption: item.caption, path: item.path }))
];

export const allForgeGallery = [
  {
    id: "forge-a03",
    title: "Half-built pair",
    caption: "Space D02 rhyme — two lanes on the plan.",
    path: narrativeV1Assets.forgeA03HalfBuiltPair
  },
  ...forgeV2Gallery.map((item) => ({ id: item.id, title: item.title, caption: item.caption, path: item.path })),
  {
    id: "forge-a04",
    title: "Three at plan",
    caption: "Formation alt — three people, paper focal.",
    path: narrativeV2Assets.forgeA04ThreeAtPlan
  }
];

export function getNarrativeAct(slug: string): NarrativeActPage | undefined {
  return narrativeArcPages.find((page) => page.slug === slug);
}

export const narrativeArcAttribution =
  "Four-act narrative wire — draft Ghost Forge previews. Not final brand approval.";
