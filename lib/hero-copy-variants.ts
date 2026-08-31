/** Hero headline variants — operator preview in dev. Ender primary; Skybro arc review. */

export const HERO_COPY_PREVIEW_ENABLED = process.env.HERO_COPY_PREVIEW === "1";

/** Petra product ruling 2026-08-19 — the front door welcomes ordinary people. */
export const HERO_HEADLINE_PRIMARY = "Figure out your next step. Build something real.";

export const HERO_HEADLINE_VARIANTS = [
  HERO_HEADLINE_PRIMARY,
  "Turn a stuck idea into an honest next move.",
  "Find useful options for the thing you want to make real.",
  "Understand the situation. Compare what could move it forward."
] as const;

export type HeroHeadlineVariant = (typeof HERO_HEADLINE_VARIANTS)[number];

export const HERO_SUBHEAD_PRIMARY =
  "Whether you are starting an idea, growing a business, solving a problem, or looking for the right help, Werkles helps you understand the situation, explore honest options, and move forward with confidence.";

export const HERO_POSITIONING_PRIMARY =
  "Discover people, knowledge, services, opportunities, and practical next steps—organized around what actually moves you forward.";

export const HERO_BEFORE_STATE_PRIMARY = "";
