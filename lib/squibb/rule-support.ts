import type { ConfidenceLabel } from "./walkthrough-types";

const SUPPORT_BAND: Record<ConfidenceLabel, string> = {
  high: "Stronger rule support",
  medium: "Moderate rule support",
  low: "Limited rule support"
};

export function ruleSupportBand(label: ConfidenceLabel) {
  return SUPPORT_BAND[label] ?? SUPPORT_BAND.low;
}
