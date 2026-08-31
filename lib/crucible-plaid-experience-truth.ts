import type { CruciblePriceKey } from "@/lib/pricing";

export const PLAID_CONFIGURED_EXPERIENCE_TRUTH =
  "Requests the configured Plaid sandbox experience; availability checked on open.";

export function plaidExperienceTruthFor(
  checkKey: CruciblePriceKey,
  actionEnabled: boolean
): string | null {
  return checkKey === "funds" && actionEnabled
    ? PLAID_CONFIGURED_EXPERIENCE_TRUTH
    : null;
}
