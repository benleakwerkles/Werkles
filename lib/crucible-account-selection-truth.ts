import type { CruciblePriceKey } from "@/lib/pricing";

export type AccountSelectionTruth = {
  heading: string;
  body: string;
};

const fundsAccountSelectionTruth: AccountSelectionTruth = {
  heading: "Before Plaid Link",
  body:
    '"Financial accounts" is Plaid Link\'s display term. You choose from the eligible accounts Link shows. Only accounts you select would be considered. Finishing Link alone creates no funds proof or receipt.'
};

export function accountSelectionTruthFor(checkKey: CruciblePriceKey): AccountSelectionTruth | null {
  return checkKey === "funds" ? fundsAccountSelectionTruth : null;
}
