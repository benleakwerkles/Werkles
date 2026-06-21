/**
 * Sally final — Anyone can be anything narrative imagery (2026-06-10)
 * Ghost Forge: anyone-narrative-v1 + squibb-classy-v2
 * Stock fallback: anyone-narrative-stock (Unsplash/Pexels)
 */

/** v1 scatter wiring — off when v2 single-story is active */
export const ANYONE_NARRATIVE_WIRE_ENABLED = false;

export const anyoneNarrativeFolder = "/assets/draft/anyone-narrative-v1";
export const squibbClassyFolder = "/assets/draft/squibb-classy-v2";
export const anyoneStockFolder = "/assets/draft/anyone-narrative-stock";

export const anyoneNarrativeAssets = {
  arcLost: `${anyoneNarrativeFolder}/werkles-anyone-arc-lost-baker-thinking.png`,
  arcSearching: `${anyoneNarrativeFolder}/werkles-anyone-arc-searching-electrician.png`,
  arcDiscoveryMoney: `${anyoneNarrativeFolder}/werkles-anyone-arc-discovery-credit-union.png`,
  arcDiscoveryEquipment: `${anyoneNarrativeFolder}/werkles-anyone-arc-discovery-used-oven.png`,
  arcMomentum: `${anyoneNarrativeFolder}/werkles-anyone-arc-momentum-bakery-line.png`,
  revealPeople: `${anyoneNarrativeFolder}/werkles-anyone-reveal-people-kitchen-table.png`,
  revealSpace: `${anyoneNarrativeFolder}/werkles-anyone-reveal-space-small-bay.png`,
  revealFormation: `${anyoneNarrativeFolder}/werkles-anyone-reveal-formation-lender.png`
} as const;

export const squibbClassyAssets = {
  bustNeutral: `${squibbClassyFolder}/werkles-squibb-classy-bust-neutral-v2.png`,
  scoutPoint: `${squibbClassyFolder}/werkles-squibb-classy-scout-point-v2.png`,
  workshopHost: `${squibbClassyFolder}/werkles-squibb-classy-workshop-host-v2.png`,
  profile: `${squibbClassyFolder}/werkles-squibb-classy-profile-v2.png`
} as const;

/** Stock placeholders until Ghost Forge lands — three free-image batches */
export const anyoneStockAssets = {
  batchPeopleMoney: {
    kitchenTable: `${anyoneStockFolder}/stock-people-kitchen-table.jpg`,
    creditDesk: `${anyoneStockFolder}/stock-money-credit-desk.jpg`
  },
  batchSpaceEquipment: {
    smallBay: `${anyoneStockFolder}/stock-space-small-bay.jpg`,
    usedOven: `${anyoneStockFolder}/stock-equipment-commercial-oven.jpg`
  },
  batchMomentumHero: {
    bakerWorking: `${anyoneStockFolder}/stock-momentum-baker.jpg`,
    electricianTools: `${anyoneStockFolder}/stock-hero-electrician.jpg`,
    heroWorkshop: `${anyoneStockFolder}/stock-hero-workshop.jpg`
  }
} as const;

export const anyoneNarrativeAttribution =
  "Anyone-can-be-anything narrative — draft Sally final run. Ghost Forge + stock placeholders. Not final brand approval.";

export const squibbClassyAttribution =
  "Squibb classy v2 — Ghost Forge exploration. Manual cutout still canonical per MASCOT_RULES.";

/** Hero prefers render; falls back to stock hero workshop */
export const anyoneHeroImage = anyoneStockAssets.batchMomentumHero.heroWorkshop;
