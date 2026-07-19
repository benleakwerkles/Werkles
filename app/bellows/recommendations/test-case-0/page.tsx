import Link from "next/link";

import { PublicTrustFooter } from "@/components/foundry/public-trust-footer";
import { SiteHeader } from "@/components/foundry/site-header";
import { NarrativeJourneyRail } from "@/components/narrative/narrative-journey-rail";
import { ConciergeWalkthrough } from "@/components/squibb/concierge-walkthrough";
import { loadConciergeUser0Flow } from "@/lib/squibb/concierge-walkthrough-test-case-0";
import { loadSpeakerHumanReadTestCase0 } from "@/lib/squibb/speaker-transparency-test-case-0";

import "./concierge-walkthrough.css";

export const metadata = {
  title: "Concierge User #0 | Bellows",
  description:
    "60-second diagnosis — symptom, Speaker read, falsifiers, and a reversible test. No matching."
};

export default function ConciergeWalkthroughTestCase0Page() {
  const walkthrough = loadConciergeUser0Flow();
  const speakerRead = loadSpeakerHumanReadTestCase0();

  return (
    <>
      <SiteHeader />
      <main className="bellows-main narrative-act-page workshop-route--bellows squibb-walkthrough-page">
        <NarrativeJourneyRail currentSlug="/bellows" />

        <nav className="squibb-rec-page__nav" aria-label="Bellows">
          <Link className="button button-ghost" href="/bellows">
            ← Back to Bellows
          </Link>
          <Link className="button button-ghost" href="/bellows/intake">
            Concierge intake
          </Link>
        </nav>

        <ConciergeWalkthrough walkthrough={walkthrough} speakerRead={speakerRead} />
      </main>
      <PublicTrustFooter />
    </>
  );
}
