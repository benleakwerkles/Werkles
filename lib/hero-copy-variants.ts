/** Hero headline variants — operator preview in dev. Ender primary; Skybro arc review. */

export const HERO_COPY_PREVIEW_ENABLED = process.env.HERO_COPY_PREVIEW === "1";

/** Locked 2026-06-20 — Hero truth pass: people, trust, momentum, opportunity. */
export const HERO_HEADLINE_PRIMARY =
  "Find the people and proof that move your business forward.";

export const HERO_HEADLINE_VARIANTS = [
  HERO_HEADLINE_PRIMARY,
  "Werkles helps builders find the right next person, lender, space, or tool.",
  "Turn a stuck business need into a trusted next move.",
  "Real people. Verified help. Momentum you can act on."
] as const;

export type HeroHeadlineVariant = (typeof HERO_HEADLINE_VARIANTS)[number];

export const HERO_SUBHEAD_PRIMARY =
  "Werkles helps small business builders name what they need, find reachable help, and verify the facts before they rely on anyone.";

export const HERO_POSITIONING_PRIMARY =
  "For people building real businesses: trusted introductions, practical resources, and itemized proof before money, deals, or partnerships move.";

export const HERO_BEFORE_STATE_PRIMARY = "";
