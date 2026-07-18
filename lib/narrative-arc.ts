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
    eyebrow: "Act I — Spark",
    headline: "Something specific wants steel around it.",
    lede: "An idea gets real when you can name the next piece it needs.",
    heroImage: narrativeV1Assets.sparkC01KitchenTable,
    heroAlt: "Person at kitchen table with notes — Spark beat documentary preview",
    nextSlug: "/space",
    nextLabel: "Act II — Space",
    ctaHref: "/signup",
    ctaLabel: "Enter the Foundry"
  },
  {
    id: "space",
    act: 2,
    slug: "/space",
    eyebrow: "Act II — Space",
    headline: "The room waits — paused, not empty.",
    lede: "A room can hold possibility before the crew or sign arrives.",
    heroImage: narrativeV1Assets.spaceD01BeforeOpening,
    heroAlt: "Commercial space before opening — Space beat documentary preview",
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
    headline: "Complementary lanes lock on the same plan.",
    lede: "Different strengths meet around the same piece of work.",
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
    headline: "People leave different than they arrived.",
    lede: "The missing piece becomes visible. The next move feels possible—and safer to make.",
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
  "From first spark to working floor—one step at a time.";
