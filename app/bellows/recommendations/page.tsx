import Link from "next/link";

import { SiteHeader } from "@/components/foundry/site-header";
import { NarrativeJourneyRail } from "@/components/narrative/narrative-journey-rail";
import { SquibbRecommendationSurface } from "@/components/squibb/recommendation-surface";
import { copy } from "@/lib/copy";
import {
  loadBellowsPacketLedger,
  loadSquibbRecommendationSessionForBellows
} from "@/lib/squibb/recommendation-session-server";

import "./squibb-recommendations.css";

export const metadata = {
  title: "Squibb Recommendations | Bellows",
  description: "Squibb recommendation surface — ranked next steps with reasoning, confidence, proof, and human gates."
};

export default async function SquibbRecommendationsPage() {
  const [session, ledger] = await Promise.all([
    loadSquibbRecommendationSessionForBellows(),
    loadBellowsPacketLedger()
  ]);

  return (
    <>
      <SiteHeader />
      <main className="bellows-main narrative-act-page workshop-route--bellows squibb-rec-page">
        <NarrativeJourneyRail currentSlug="/bellows" />

        <nav className="squibb-rec-page__nav" aria-label="Bellows">
          <Link className="button button-ghost" href="/bellows">
            ← Back to Bellows
          </Link>
          <Link className="button button-ghost" href="/bellows/intake">
            Concierge intake
          </Link>
          <Link className="button button-ghost" href="/dashboard">
            Member home
          </Link>
        </nav>

        <SquibbRecommendationSurface session={session} ledger={ledger} />

        <p className="squibb-rec-page__test-case-link">
          <Link className="button button-outline" href="/bellows/recommendations/test-case-0">
            Concierge walkthrough · Test Case #0
          </Link>
        </p>
      </main>
      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
