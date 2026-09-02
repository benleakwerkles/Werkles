import Link from "next/link";

import { LocalAwareSiteHeader } from "@/components/foundry/local-aware-site-header";
import { ConciergeWalkthrough } from "@/components/squibb/concierge-walkthrough";
import { copy } from "@/lib/copy";
import { loadConciergeUser0Flow } from "@/lib/squibb/concierge-walkthrough-test-case-0";
import { loadSpeakerHumanReadTestCase0 } from "@/lib/squibb/speaker-transparency-test-case-0";

import "./concierge-walkthrough.css";

export const metadata = {
  title: "Worked Recommendation Example | Bellows",
  description:
    "A concise worked example: situation, possible read, counterevidence, and a reversible test. No matching."
};

export default function ConciergeWalkthroughTestCase0Page() {
  const walkthrough = loadConciergeUser0Flow();
  const speakerRead = loadSpeakerHumanReadTestCase0();

  return (
    <>
      <LocalAwareSiteHeader />
      <main className="bellows-main narrative-act-page route-room route-room--bellows workshop-route--bellows squibb-walkthrough-page">

        <nav className="squibb-rec-page__nav" aria-label="Bellows">
          <Link className="button button-ghost" href="/bellows">
            ← Back to Bellows
          </Link>
          <Link className="button button-ghost" href="/bellows/intake">
            Werkles questions
          </Link>
        </nav>

        <ConciergeWalkthrough walkthrough={walkthrough} speakerRead={speakerRead} />
      </main>
      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
