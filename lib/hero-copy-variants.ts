/** Hero headline variants — operator preview in dev. Ender primary; Skybro arc review. */

export const HERO_COPY_PREVIEW_ENABLED = process.env.HERO_COPY_PREVIEW === "1";

/** Locked 2026-06-10 — Maker punch-up v2 (Ben feedback — faster hook). */
export const HERO_HEADLINE_PRIMARY =
  "You know something's missing. You're probably wrong about what.";

export const HERO_HEADLINE_VARIANTS = [
  HERO_HEADLINE_PRIMARY,
  "Something is missing. It may not be what you think.",
  "The work is real. The partner should be too.",
  "You see what's missing. Now find who fills it."
] as const;

export type HeroHeadlineVariant = (typeof HERO_HEADLINE_VARIANTS)[number];

export const HERO_SUBHEAD_PRIMARY =
  "Werkles names the real bottleneck — a person, a lender, a space, or a tool — and shows you the one you can actually reach.";

export const HERO_POSITIONING_PRIMARY =
  "Not matching. Not motivation. Discovery with proof before money, deals, or partnerships move.";

export const HERO_BEFORE_STATE_PRIMARY = "";
