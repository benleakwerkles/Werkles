import "server-only";

import { GHOST_FLEET_DISCLOSURE, isGhostFleetEnabled } from "@/lib/ghost-fleet/enabled";
import { matchGhostsForOwner } from "@/lib/ghost-fleet/loader";
import {
  buildGhostFleetPlayableLoopBridge,
  type GhostFleetPlayableLoopBridge
} from "@/lib/ghost-fleet/playable-loop";
import type { BellowsPacketLedger } from "@/lib/squibb/bellows-ledger";
import { readBellowsOwnerIdFromCookies } from "@/lib/squibb/bellows-owner-session";
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
  ghostFleetBridge: GhostFleetPlayableLoopBridge | null;
};

/**
 * Personal intake → matching readout is allowed on this machine only.
 * Production werkles.com stays example-only until authenticated owner binding
 * Production phrase lands. Local `next start` opts in with BELLOWS_PERSONAL_RECS_LOCAL=true.
 */
function canServePersonalBellowsRecommendations() {
  if (process.env.VERCEL_ENV === "production") return false;
  /* Accept 1 as well as true: a local `next start` with the wrong spelling silently
     served the bakery demo and read as a data-binding bug for an hour. */
  const optIn = (process.env.BELLOWS_PERSONAL_RECS_LOCAL || "").toLowerCase();
  if (optIn === "true" || optIn === "1") return true;
  return process.env.NODE_ENV === "development";
}

function emptyPageData(): PublicBellowsRecommendationPageData {
  const catalog = loadSquibbRecommendationSession();
  return {
    session: {
      ...catalog,
      statedNeed: "Complete Intake to connect these options to your situation.",
      operatorContext: "General option library",
      squibbIntro: "Browse the possibilities, or complete Intake to see which ones fit your situation first.",
      ranked: [],
      source: {
        mode: "demo",
        label: "General option library",
        detail: "Nothing here is ranked for you until an Intake is connected."
      }
    },
    ledger: {
      intakes: [],
      optionPackets: []
    },
    ghostFleetBridge: null
  };
}

/**
 * Local/dev: owner-cookie (or member_*) scoped personal readout.
 * Unbound session with personal mode on → empty prompt (not another person's intake).
 * Production → example-only.
 */
export async function loadPublicBellowsRecommendationPageData(): Promise<PublicBellowsRecommendationPageData> {
  if (!canServePersonalBellowsRecommendations()) {
    return emptyPageData();
  }

  const ownerId = await readBellowsOwnerIdFromCookies();
  if (!ownerId) {
    return {
      session: {
        ...loadSquibbRecommendationSession(),
        statedNeed: "Submit intake to see your ranked next steps.",
        ranked: [],
        source: {
          mode: "demo",
          label: "No intake for this session yet",
          detail:
            "Answer the Werkles questions first. Your readout stays bound to this browser session until account saving is ready."
        }
      },
      ledger: { intakes: [], optionPackets: [] },
      ghostFleetBridge: null
    };
  }

  const [session, ledger, ghostMatches] = await Promise.all([
    loadSquibbRecommendationSessionForBellows(ownerId),
    loadBellowsPacketLedger(ownerId),
    isGhostFleetEnabled() ? matchGhostsForOwner(ownerId, 12) : Promise.resolve(null)
  ]);

  const shownIntakeId = session.source?.mode === "latest_intake" ? session.source.intakeId : undefined;
  const ghostFleetBridge =
    ghostMatches && shownIntakeId
      ? buildGhostFleetPlayableLoopBridge(ghostMatches, shownIntakeId, GHOST_FLEET_DISCLOSURE)
      : null;

  return { session, ledger, ghostFleetBridge };
}
