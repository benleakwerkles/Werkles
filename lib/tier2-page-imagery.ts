/**
 * Tier-2 page imagery — Act III Forge focus + hybrid transparent icons.
 * Run A (Forge): wire existing v1/v2 assets now; batch-7 renders land in tier2-forge-v1/.
 * Run B (Icons): transparent nav icons now; batch-8 hybrid icons in icons-hybrid-v1/.
 */

import { narrativeV1Assets } from "@/lib/homepage-narrative-imagery";
import { iconsV2Assets, narrativeV2Assets } from "@/lib/render-batch-3-imagery";

export const TIER2_IMAGERY_ENABLED = true;

export const tier2ImageryAttribution =
  "Tier-2 preview — Act III Forge + hybrid prop icons. Draft only; not final brand approval.";

const transparentNavFolder = "/assets/draft/icons-nav-transparent-v1";
const tier2ForgeFolder = "/assets/draft/tier2-forge-v1";
const hybridIconsFolder = "/assets/draft/icons-hybrid-v1";

export const tier2HybridIconBatch8Paths = {
  spark: `${hybridIconsFolder}/werkles-tier2-icon-spark-hybrid.png`,
  builder: `${hybridIconsFolder}/werkles-tier2-icon-builder-hybrid.png`,
  worker: `${hybridIconsFolder}/werkles-tier2-icon-worker-hybrid.png`,
  operator: `${hybridIconsFolder}/werkles-tier2-icon-operator-hybrid.png`,
  backer: `${hybridIconsFolder}/werkles-tier2-icon-backer-hybrid.png`,
  connector: `${hybridIconsFolder}/werkles-tier2-icon-connector-hybrid.png`
} as const;

/** Hybrid icons: batch-6 transparent nav (landed) until batch-8 renders exist. */
export const tier2HybridIcons = [
  {
    id: "spark",
    label: "Spark",
    path: `${transparentNavFolder}/werkles-nav-icon-spark-transparent.png`,
    fallback: iconsV2Assets.find((i) => i.lane === "spark")?.path
  },
  {
    id: "builder",
    label: "Builder",
    path: `${transparentNavFolder}/werkles-nav-icon-builder-transparent.png`,
    fallback: iconsV2Assets.find((i) => i.lane === "builder")?.path
  },
  {
    id: "worker",
    label: "Worker",
    path: `${transparentNavFolder}/werkles-nav-icon-worker-transparent.png`,
    fallback: iconsV2Assets.find((i) => i.lane === "worker")?.path
  },
  {
    id: "operator",
    label: "Operator",
    path: iconsV2Assets.find((i) => i.lane === "operator")?.path ?? `${transparentNavFolder}/werkles-nav-icon-builder-transparent.png`,
    fallback: undefined
  },
  {
    id: "backer",
    label: "Backer",
    path: `${transparentNavFolder}/werkles-nav-icon-backer-transparent.png`,
    fallback: iconsV2Assets.find((i) => i.lane === "backer")?.path
  },
  {
    id: "connector",
    label: "Connector",
    path: `${transparentNavFolder}/werkles-nav-icon-connector-transparent.png`,
    fallback: iconsV2Assets.find((i) => i.lane === "connector")?.path
  }
] as const;

export type Tier2PageKey =
  | "membership"
  | "pricing"
  | "billing"
  | "crucible"
  | "membershipSuccess"
  | "signup";

export type Tier2FeaturedImage = {
  eyebrow: string;
  caption: string;
  path: string;
  alt: string;
  featured?: boolean;
};

export type Tier2PageImagery = {
  act: "forge" | "foundry" | "space";
  featured?: Tier2FeaturedImage;
  forgeBand?: Tier2FeaturedImage;
  showIconRail?: boolean;
};

/** Batch 7 placeholders — swap paths when renders land. */
export const tier2ForgeBatch7Assets = {
  forgeE01GaragePrototype: `${tier2ForgeFolder}/werkles-tier2-forge-e01-garage-prototype-pair.png`,
  forgeE02CounterLaunch: `${tier2ForgeFolder}/werkles-tier2-forge-e02-counter-service-launch.png`,
  forgeE03SmallProductBench: `${tier2ForgeFolder}/werkles-tier2-forge-e03-small-product-bench.png`,
  forgeE04PlanTableTight: `${tier2ForgeFolder}/werkles-tier2-forge-e04-plan-table-tight.png`
} as const;

export const tier2PageImagery: Record<Tier2PageKey, Tier2PageImagery> = {
  membership: {
    act: "forge",
    featured: {
      eyebrow: "Act III · working life",
      caption: "Van at dawn — one tool out of the rack. Formation starts before the crew arrives.",
      path: narrativeV2Assets.spaceD05VanDawn,
      alt: "Work van at dawn with tools in rack — documentary Space beat",
      featured: true
    },
    forgeBand: {
      eyebrow: "Act III · Forge",
      caption: "Introduction without performance — people around the work, not the pitch.",
      path: narrativeV2Assets.forgeA07ConnectorIntroTable,
      alt: "Three people at table reviewing plans — Connector forge beat"
    },
    showIconRail: true
  },
  pricing: {
    act: "forge",
    forgeBand: {
      eyebrow: "Act III · lanes meeting",
      caption: "Builder and operator on the same plan — fit you can read.",
      path: narrativeV2Assets.forgeA06BuilderOperatorPlan,
      alt: "Builder and operator reviewing plan together"
    },
    featured: {
      eyebrow: "Act III · nearly open",
      caption: "Last fixture before open — Werkles forming around the idea.",
      path: narrativeV2Assets.forgeA05NearlyFinishedPair,
      alt: "Two people finishing commercial space — nearly open forge beat"
    },
    showIconRail: true
  },
  billing: {
    act: "forge",
    featured: {
      eyebrow: "Act III · assembly",
      caption: "Three at the plan — small scale, real stakes.",
      path: narrativeV2Assets.forgeA04ThreeAtPlan,
      alt: "Three people at plan table in working space"
    },
    showIconRail: true
  },
  crucible: {
    act: "forge",
    forgeBand: {
      eyebrow: "Act III · proof in formation",
      caption: "Checking happens around work that already exists.",
      path: narrativeV1Assets.forgeA03HalfBuiltPair,
      alt: "Two people in half-built space reviewing plans"
    },
    showIconRail: true
  },
  membershipSuccess: {
    act: "foundry",
    featured: {
      eyebrow: "Act IV · outcome",
      caption: "Finished product on the bench — evidence, not promise.",
      path: narrativeV1Assets.foundryB02FinishedProduct,
      alt: "Finished product on workshop bench — Foundry beat"
    },
    showIconRail: false
  },
  signup: {
    act: "forge",
    featured: {
      eyebrow: "Act III · Spark meets Forge",
      caption: "Thought becoming plan — kitchen table to shared work.",
      path: narrativeV1Assets.sparkC01KitchenTable,
      alt: "Person at kitchen table with notes — Spark beat"
    },
    forgeBand: {
      eyebrow: "Act III · Forge",
      caption: "When the idea earns a second pair of hands.",
      path: narrativeV2Assets.forgeA05NearlyFinishedPair,
      alt: "Two people finishing space together"
    },
    showIconRail: true
  }
};
