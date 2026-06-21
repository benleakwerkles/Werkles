import type { CSSProperties } from "react";
import { getWorkshopVisitorBucket } from "@/lib/workshop-moment";

/** Documentary narrative plates only — gen-1 ghost-forge fantasy/workshop interiors retired. */
export const workshopAtmospherePlates = {
  foundry: [
    "/assets/draft/homepage-narrative-v1/werkles-homepage-narrative-foundry-b02-finished-product.png",
    "/assets/draft/homepage-narrative-v2/werkles-homepage-narrative-forge-a05-nearly-finished-pair.png",
    "/assets/draft/homepage-narrative-v2/werkles-homepage-narrative-forge-a06-builder-operator-plan.png"
  ],
  proof: [
    "/assets/draft/homepage-narrative-v1/werkles-homepage-narrative-foundry-b02-finished-product.png",
    "/assets/draft/homepage-narrative-v2/werkles-homepage-narrative-space-d03-tool-at-rest.png",
    "/assets/draft/homepage-narrative-v1/werkles-homepage-narrative-space-d01-before-opening.png"
  ],
  workshop: [
    "/assets/draft/homepage-narrative-v1/werkles-homepage-narrative-forge-a03-half-built-pair.png",
    "/assets/draft/homepage-narrative-v2/werkles-homepage-narrative-space-d04-reception-quiet.png",
    "/assets/draft/homepage-narrative-v2/werkles-homepage-narrative-space-d07-workshop-pegboard.png"
  ]
} as const;

export type WorkshopBandTone = keyof typeof workshopAtmospherePlates;

/** Daily-stable pick — same plate all day, rotates by UTC date. */
export function pickWorkshopAtmospherePlate(
  tone: WorkshopBandTone,
  date = new Date()
): string {
  const seed = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
  const bucket = getWorkshopVisitorBucket(seed);
  const plates = workshopAtmospherePlates[tone];
  return plates[bucket % plates.length];
}

export function workshopBandImageStyle(tone: WorkshopBandTone, date = new Date()): CSSProperties {
  const plate = pickWorkshopAtmospherePlate(tone, date);
  return { ["--workshop-band-image" as string]: `url("${plate}")` };
}
