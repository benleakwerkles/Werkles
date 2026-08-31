import "server-only";

import { isMatchingPublicEnabled } from "@/lib/matching/feature-flags";
import { GHOST_FLEET_DISCLOSURE, isGhostFleetEnabled } from "@/lib/ghost-fleet/enabled";
import { matchGhostsForOwner } from "@/lib/ghost-fleet/loader";
import {
  buildGhostFleetPlayableLoopBridge,
  type GhostFleetPlayableLoopBridge
} from "@/lib/ghost-fleet/playable-loop";
import type { BellowsPacketLedger } from "@/lib/squibb/bellows-ledger";
import { BAKERY_EQUIPMENT_SOURCE_DOCUMENT } from "@/lib/squibb/example-matching-source-document";
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

function examplePageData(publicEnabled: boolean): PublicBellowsRecommendationPageData {
  const demo = loadSquibbRecommendationSession();
  const doc = BAKERY_EQUIPMENT_SOURCE_DOCUMENT;

  return {
    session: {
      ...demo,
      source: {
        mode: "demo",
        label: publicEnabled ? "Published source document" : "Catalog scenario",
        detail: publicEnabled
          ? "Catalog ratings are scored against the source document on this page, not against a personal intake."
          : "Personal recommendations are closed during this beta. This catalog readout uses a published fixture.",
        fedDocument: {
          id: doc.id,
          title: doc.title,
          kind: doc.kind,
          summary: doc.summary,
          body: doc.body,
          excerpts: doc.excerpts
        }
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
    return examplePageData(isMatchingPublicEnabled());
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
