import Link from "next/link";

import { PublicTrustFooter } from "@/components/foundry/public-trust-footer";
import { SiteHeader } from "@/components/foundry/site-header";
import { NarrativeJourneyRail } from "@/components/narrative/narrative-journey-rail";
import { ConciergeIntakeForm } from "@/components/squibb/concierge-intake-form";

import "./concierge-intake.css";

export const metadata = {
  title: "Concierge Intake | Bellows",
  description: "Review the Werkles intake questions. Submission is temporarily closed while secure storage is connected."
};

export default function ConciergeIntakePage() {
  return (
    <>
      <SiteHeader />
      <main className="bellows-main narrative-act-page workshop-route--bellows concierge-intake-page">
        <NarrativeJourneyRail currentSlug="/bellows" />

        <nav className="concierge-intake-page__nav" aria-label="Bellows">
          <Link className="button button-ghost" href="/bellows">
            ← Back to Bellows
          </Link>
          <Link className="button button-ghost" href="/bellows/recommendations">
            Squibb recommendations
          </Link>
          <Link className="button button-ghost" href="/bellows/recommendations/test-case-0">
            Concierge walkthrough
          </Link>
          <Link className="button button-ghost" href="/dashboard">
            Member home
          </Link>
        </nav>

        <ConciergeIntakeForm />
      </main>
      <PublicTrustFooter />
    </>
  );
}
