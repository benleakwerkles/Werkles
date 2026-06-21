import Link from "next/link";

import { SiteHeader } from "@/components/foundry/site-header";
import { NarrativeJourneyRail } from "@/components/narrative/narrative-journey-rail";
import { ConciergeWalkthrough } from "@/components/squibb/concierge-walkthrough";
import { copy } from "@/lib/copy";
import { loadConciergeWalkthroughTestCase0 } from "@/lib/squibb/concierge-walkthrough-test-case-0";

import "./concierge-walkthrough.css";

export const metadata = {
  title: "Squibb Concierge · Test Case #0 | Bellows",
  description:
    "Display-only Squibb concierge walkthrough — diagnosis before matching, no candidates."
};

export default function ConciergeWalkthroughTestCase0Page() {
  const walkthrough = loadConciergeWalkthroughTestCase0();

  return (
    <>
      <SiteHeader />
      <main className="bellows-main narrative-act-page workshop-route--bellows squibb-rec-page squibb-walkthrough-page">
        <NarrativeJourneyRail currentSlug="/bellows" />

        <nav className="squibb-rec-page__nav" aria-label="Bellows">
          <Link className="button button-ghost" href="/bellows">
            ← Back to Bellows
          </Link>
        </nav>

        <ConciergeWalkthrough walkthrough={walkthrough} />
      </main>
      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
