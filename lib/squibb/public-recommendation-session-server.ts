import "server-only";

import { isMatchingPublicEnabled } from "@/lib/matching/feature-flags";
import type { BellowsPacketLedger } from "@/lib/squibb/bellows-ledger";
import {
  loadSquibbRecommendationSession,
  type SquibbRecommendationSession
} from "@/lib/squibb/recommendations";

export type PublicBellowsRecommendationPageData = {
  session: SquibbRecommendationSession;
  ledger: BellowsPacketLedger;
};

function examplePageData(publicEnabled: boolean): PublicBellowsRecommendationPageData {
  const demo = loadSquibbRecommendationSession();

  return {
    session: {
      ...demo,
      source: {
        mode: "demo",
        label: publicEnabled ? "Rules-based recommendation example" : "Demo scenario",
        detail: publicEnabled
          ? "This public beta uses an example. No personal recommendation is shown until it can be tied to your account."
          : "Personal recommendations are closed while this beta is being tested, so this page uses an example."
      }
    },
    ledger: {
      intakes: [],
      optionPackets: []
    }
  };
}

/**
 * Public mode controls product labeling, not permission to read global/latest
 * member state. Keep this page example-only until authenticated owner binding
 * can be supplied to every intake, run, and ledger reader.
 */
export async function loadPublicBellowsRecommendationPageData(): Promise<PublicBellowsRecommendationPageData> {
  return examplePageData(isMatchingPublicEnabled());
}
