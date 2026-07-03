import Link from "next/link";

import { SiteHeader } from "@/components/foundry/site-header";
import { NarrativeJourneyRail } from "@/components/narrative/narrative-journey-rail";
import { ConciergeIntakeForm } from "@/components/squibb/concierge-intake-form";
import { copy } from "@/lib/copy";

import "./concierge-intake.css";

export const metadata = {
  title: "Concierge Intake | Bellows",
  description: "Symptom-only intake for Speaker — no matching, no profiles, no solution questions."
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

        <section className="panel concierge-intake-page__guide" aria-labelledby="intakeGuideTitle">
          <p className="eyebrow">How intake works</p>
          <h2 id="intakeGuideTitle">Symptoms in, Speaker packet out, recommendations second.</h2>
          <ol>
            <li>Answer symptom questions — not “what partner do you want.”</li>
            <li>Submit to save a Speaker-readable packet for human review.</li>
            <li>Compare ranked next steps on the Squibb recommendation surface.</li>
          </ol>
        </section>

        <ConciergeIntakeForm />
      </main>
      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
