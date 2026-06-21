/**
 * Sally v2 — ONE visual story (same protagonist, one arc).
 * Ghost Forge: anyone-narrative-v2 + squibb-classy-v3
 * Stock: only 3 narrative fallbacks for the baker beat — not site-wide mash.
 */

export const ANYONE_NARRATIVE_V2_ENABLED = true;

export const storyV2Folder = "/assets/draft/anyone-narrative-v2";
export const squibbV3Folder = "/assets/draft/squibb-classy-v3";
export const storyV2StockFolder = "/assets/draft/anyone-narrative-v2-stock";

/** Same woman throughout — late-30s home baker scaling to storefront */
export const storyProtagonistId = "baker-maria";

export const storyV2Assets = {
  beat01WrongNeed: `${storyV2Folder}/werkles-story-v2-beat01-wrong-need.png`,
  beat02SquibbMoment: `${storyV2Folder}/werkles-story-v2-beat02-squibb-moment.png`,
  beat03MoneyReveal: `${storyV2Folder}/werkles-story-v2-beat03-money-reveal.png`,
  beat04EquipmentReveal: `${storyV2Folder}/werkles-story-v2-beat04-equipment-reveal.png`,
  beat05ShopOpen: `${storyV2Folder}/werkles-story-v2-beat05-shop-open.png`,
  heroKey: `${storyV2Folder}/werkles-story-v2-hero-wide.png`,
  heroFallback: `${storyV2Folder}/werkles-story-v2-beat01-wrong-need.png`
} as const;

export const squibbV3Assets = {
  bustCutout: `${squibbV3Folder}/werkles-squibb-v3-bust-cutout.png`,
  scoutPoint: `${squibbV3Folder}/werkles-squibb-v3-scout-point.png`,
  workshopHost: `${squibbV3Folder}/werkles-squibb-v3-workshop-host.png`,
  profileSilhouette: `${squibbV3Folder}/werkles-squibb-v3-profile-silhouette.png`
} as const;

/** Only used when v2 render missing — same story beat, not random site photos */
export const storyV2StockFallback = {
  beat01: `${storyV2StockFolder}/fallback-beat01-home-kitchen.jpg`,
  beat03: `${storyV2StockFolder}/fallback-beat03-lender-desk.jpg`,
  beat04: `${storyV2StockFolder}/fallback-beat04-commercial-oven.jpg`
} as const;

export const storyV2Attribution =
  "Visual story v2 — one protagonist, five beats. Draft Ghost Forge. Not final brand approval.";
