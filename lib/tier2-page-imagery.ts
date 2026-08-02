/**
 * Tier-2 page imagery — Act III Forge focus + hybrid transparent icons.
 * Run A (Forge): wire existing v1/v2 assets now; batch-7 renders land in tier2-forge-v1/.
 * Run B (Icons): transparent nav icons now; batch-8 hybrid icons in icons-hybrid-v1/.
 */

export const TIER2_IMAGERY_ENABLED = true;

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

/* Icon rail: clear-v1 family (Ben + red-team, 2026-08-02). One-second rule —
   every icon is an object a stranger names instantly. Keeps rails in lockstep
   with the homepage lane icons. */
const laneIconRoot = "/assets/brand/product-icons/clear-v1";

export const tier2HybridIcons = [
  { id: "spark", label: "Spark", path: `${laneIconRoot}/icon-spark-match.png`, fallback: undefined },
  { id: "builder", label: "Builder", path: `${laneIconRoot}/icon-builder-hammer.png`, fallback: undefined },
  { id: "worker", label: "Worker", path: `${laneIconRoot}/icon-worker-glove.png`, fallback: undefined },
  { id: "operator", label: "Operator", path: `${laneIconRoot}/icon-operator-clipboard.png`, fallback: undefined },
  { id: "backer", label: "Backer", path: `${laneIconRoot}/icon-backer-coins.png`, fallback: undefined },
  { id: "connector", label: "Connector", path: `${laneIconRoot}/icon-connector-plug.png`, fallback: undefined }
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
    /* people-v1 pass (Ben + Lady Jessica, 2026-08-02): bright, clean,
       photoreal documentary frames replace the dim render-batch plates. */
    featured: {
      eyebrow: "Opening day",
      caption: "The sign flips. First customer, first sale — the milestones dues are for.",
      path: "/assets/draft/people-v1/people-open-sign-flip.jpg",
      alt: "Shop owner flipping her door sign to OPEN on opening morning",
      featured: true
    },
    forgeBand: {
      eyebrow: "The first customer",
      caption: "The whole point, mid-laugh — a real person on the other side of the counter.",
      path: "/assets/draft/people-v1/people-first-customer.jpg",
      alt: "Baker handing a paper bag across the counter to his first customer"
    },
    showIconRail: true
  },
  pricing: {
    act: "forge",
    /* forgeBand removed: a price page earns exactly one photograph (Ender). */
    featured: {
      eyebrow: "The week before open",
      caption: "Last fixture before open — Werkles forming around the idea.",
      path: "/assets/draft/people-v1/people-stepladder-lamp.jpg",
      alt: "Owner on a stepladder hanging the last pendant lamp while her partner steadies the ladder"
    },
    showIconRail: true
  },
  billing: {
    act: "forge",
    featured: {
      eyebrow: "What the dues are for",
      caption: "First customer, first sale — the milestones the runway buys.",
      path: "/assets/draft/people-v1/people-first-customer.jpg",
      alt: "Baker handing a paper bag across the counter to a smiling customer"
    },
    showIconRail: true
  },
  crucible: {
    act: "forge",
    /* Red team 2026-08-02: the smiling florist didn't match "checking" —
       the clipboard pair is an actual reviewing gesture. */
    forgeBand: {
      eyebrow: "Proof in formation",
      caption: "Checking happens around work that already exists.",
      path: "/assets/draft/people-v1/people-partners-clipboard.png",
      alt: "Two partners reviewing a checklist together in their shop"
    },
    showIconRail: true
  },
  membershipSuccess: {
    act: "foundry",
    /* Red team 2026-08-02: don't replay the homepage hero right after
       payment. Moving in is the moment that just happened. */
    featured: {
      eyebrow: "You're on the floor",
      caption: "Keys in hand, boxes through the door — welcome in.",
      path: "/assets/draft/people-v1/people-boxes-through-door.jpg",
      alt: "New owner carrying boxes through the door of her empty shop"
    },
    showIconRail: false
  },
  signup: {
    act: "forge",
    featured: {
      eyebrow: "Where it starts",
      caption: "One person, one notebook, one idea worth taking seriously.",
      path: "/assets/draft/people-v1/people-spark-idea-moment.jpg",
      alt: "Man at his kitchen table at dawn, looking up from a notebook mid-idea"
    },
    forgeBand: {
      eyebrow: "Moving in",
      caption: "When the idea gets a set of keys.",
      path: "/assets/draft/people-v1/people-boxes-through-door.jpg",
      alt: "New owner carrying boxes through the door of her empty shop"
    },
    showIconRail: true
  }
};
