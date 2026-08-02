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
      "Werkles is organized decision support for people building a business — any size, any ambition: name what you actually need, see honest options and risks, verify the facts, and make the call yourself.",
    /* people-v1 pass (2026-08-02): the spark is one person and a notebook —
       the moment before anyone else believes it. */
    heroImage: "/assets/draft/people-v1/people-spark-idea-moment.jpg",
    heroAlt: "Man at his kitchen table in morning light, notebook open, gazing out the window mid-thought",
    nextSlug: "/space",
    nextLabel: "Next: the room it happens in →",
    ctaHref: "/signup",
    ctaLabel: "Start free"
  },
  {
    id: "space",
    act: 2,
    slug: "/space",
    // Eyebrows name the moment, never the framework (Ender narrative
    // synthesis, 2026-07-31: "the user should never see the numbering;
    // the user should feel the clock"). Act structure stays in `act:`.
    eyebrow: "The room it happens in",
    headline: "The place your business happens.",
    lede:
      "A storefront, a route, a bench, a spare room — every venture needs somewhere to stand. Werkles helps you figure out what space the next step actually requires, and what it honestly costs.",
    /* people-v1 pass (red team 2026-08-02): last CGI hero in the four-act
       rail, replaced with the photoreal keys-and-lease frame. */
    heroImage: "/assets/draft/people-v1/place-space-just-leased.jpg",
    heroAlt: "Empty just-leased storefront, keys and lease on the counter in morning light",
    nextSlug: "/formation",
    nextLabel: "Next: the people arrive →",
    ctaHref: "/#space",
    ctaLabel: "See Space on home"
  },
  {
    id: "forge",
    act: 3,
    slug: "/formation",
    eyebrow: "The people arrive",
    headline: "The right people, around the same work.",
    lede:
      "Builders, operators, backers, connectors — different lanes, one plan. Werkles helps you name which lane is actually missing and meet it with proof attached.",
    heroImage: "/assets/draft/people-v1/people-partners-clipboard.png",
    heroAlt: "Two partners working through a checklist together in their shop",
    nextSlug: "/proof",
    nextLabel: "Next: proof in hand →",
    ctaHref: "/onboarding",
    ctaLabel: "Pick your lane"
  },
  {
    id: "foundry",
    act: 4,
    slug: "/proof",
    eyebrow: "Proof in hand",
    headline: "Proof you can check before you rely on anyone.",
    lede:
      "A shop opening, a route bought, a practice seeing patients. It happens when the missing piece becomes visible and the facts get verified — identity, credentials, references, funds — at the moment they matter.",
    heroImage: "/assets/draft/people-v1/people-barber-sweeping.jpg",
    heroAlt: "Barber sweeping his shop floor between customers — honest work, open door",
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
  },
  {
    // Re-slotted from the pricing page (Ben, 2026-07-31): the invention
    // scene belongs to the Builder lane's chapter, not the price list.
    id: "forge-a06",
    title: "The part in hand",
    caption: "Builder's work, Operator's questions — two lanes on one object.",
    path: narrativeV2Assets.forgeA06BuilderOperatorPlan
  }
];

export function getNarrativeAct(slug: string): NarrativeActPage | undefined {
  return narrativeArcPages.find((page) => page.slug === slug);
}
