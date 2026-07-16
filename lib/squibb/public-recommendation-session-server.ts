import "server-only";

import { isMatchingPublicEnabled } from "@/lib/matching/feature-flags";
import type { BellowsPacketLedger } from "@/lib/squibb/bellows-ledger";
import {
  loadBellowsPacketLedger,
  loadSquibbRecommendationSessionForBellows
} from "@/lib/squibb/recommendation-session-server";
import {
  loadSquibbRecommendationSession,
  type SquibbRecommendationSession
} from "@/lib/squibb/recommendations";

export type PublicBellowsRecommendationPageData = {
  session: SquibbRecommendationSession;
  ledger: BellowsPacketLedger;
};

function closedBetaPageData(): PublicBellowsRecommendationPageData {
  const demo = loadSquibbRecommendationSession();

  return {
    session: {
      ...demo,
      source: {
        mode: "demo",
        label: "Demo scenario",
        detail: "Personal recommendations are closed while this beta is being tested, so this page uses an example."
      }
    },
    ledger: {
      intakes: [],
      optionPackets: []
    }
  };
}

/** Decide OFF before constructing any personal intake, run, or ledger read. */
export async function loadPublicBellowsRecommendationPageData(): Promise<PublicBellowsRecommendationPageData> {
  if (!isMatchingPublicEnabled()) {
    return closedBetaPageData();
  }

  const [session, ledger] = await Promise.all([
    loadSquibbRecommendationSessionForBellows(),
    loadBellowsPacketLedger()
  ]);

  return { session, ledger };
}
