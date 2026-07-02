/**
 * Ender imagery + UX feel — FROM_ENDER_IMAGERY_AND_UX_FOR_MAKER_1
 * Structure for UI; final public copy remains Dink + Ben.
 */

export const ENDER_IMAGERY_ARC_ID = "anyone-can-be-anything-v1";

export const enderImageryArcBeats = [
  {
    id: "lost",
    label: "Lost",
    feeling: "They understood my problem and didn't reduce me to it.",
    imagery: "One real person with an unnamed need — dim, close, industrial-real.",
    uxFeel: "Quiet, uncrowded, one idea — a question opening, not an answer."
  },
  {
    id: "searching",
    label: "Searching",
    feeling: "Maybe what I came for isn't what I need.",
    imagery: "The same person noticing something off the obvious path.",
    uxFeel: "The world starts to open; Squibb appears to notice, not help."
  },
  {
    id: "discovery",
    label: "Discovery",
    feeling: "That's the real need — and it's reachable.",
    imagery: "The Door — affordable oven, lender who says yes, closer than you thought.",
    uxFeel: "Discovery mechanism plays out; summit beat — give it room."
  },
  {
    id: "formation",
    label: "Formation",
    feeling: "Safe to act, and not alone.",
    imagery: "Verified partner, lender, or seller becoming real.",
    uxFeel: "Itemized trust signals appear at the moment of reliance."
  },
  {
    id: "momentum",
    label: "Momentum",
    feeling: "This is a beginning — there's more I can become.",
    imagery: "Real business running; same person further along.",
    uxFeel: "Next reachable step always visible; becoming feels ongoing."
  }
] as const;

export const enderRevealCategories = [
  {
    id: "people",
    label: "People",
    imageryNote: "Partner, mentor, friend at kitchen table — warm, plain, real.",
    revealExample: "A relative with the skill you needed — not another hire."
  },
  {
    id: "money",
    label: "Money",
    imageryNote: "Credit union desk, local lender, handshake — not VC.",
    revealExample: "I didn't know this door was open to me."
  },
  {
    id: "space",
    label: "Space",
    imageryNote: "A place to build that exists and is within reach.",
    revealExample: "Small bay available — closer than you assumed."
  },
  {
    id: "equipment",
    label: "Equipment",
    imageryNote: "Used commercial oven, tool within budget.",
    revealExample: "Wait — I could actually afford this."
  }
] as const;

export const enderDiscoveryMechanismSteps = [
  {
    step: 1,
    title: "Say what you came for",
    body: "In your words. Nothing scored or sorted yet."
  },
  {
    step: 2,
    title: "Squibb notices once",
    body: "One question about what's under it — not a quiz."
  },
  {
    step: 3,
    title: "See real patterns",
    body: "What people who started here actually needed — the reachable, best-for-you option."
  },
  {
    step: 4,
    title: "You recognize the Door",
    body: "The real need becomes visible. You choose."
  },
  {
    step: 5,
    title: "Act with runway",
    body: "Concrete enough to move — trust signals attached at the moment of reliance."
  }
] as const;

export type TrustSignalMarkState = "cleared" | "preview" | "lapsed" | "pending";

export const enderTrustSignalMarks = [
  { key: "identity", label: "Identity", appliesTo: "people" as const, state: "preview" as TrustSignalMarkState },
  { key: "funds", label: "Funds", appliesTo: "people" as const, state: "preview" as TrustSignalMarkState },
  { key: "license", label: "License", appliesTo: "people" as const, state: "preview" as TrustSignalMarkState },
  { key: "background", label: "Background", appliesTo: "people" as const, state: "pending" as TrustSignalMarkState },
  { key: "references", label: "References", appliesTo: "people" as const, state: "preview" as TrustSignalMarkState },
  { key: "lender", label: "Lender check", appliesTo: "lenders" as const, state: "preview" as TrustSignalMarkState },
  { key: "seller", label: "Seller check", appliesTo: "sellers" as const, state: "preview" as TrustSignalMarkState }
] as const;

export const enderCastExamples = [
  "Home-health nurse going independent",
  "Electrician opening his own shop",
  "Baker scaling out of her home kitchen",
  "Single parent starting a cleaning business",
  "Machinist, welder, repair-shop owner",
  "Laid-off worker reskilling",
  "Older person changing careers",
  "Recent immigrant opening a storefront"
] as const;
