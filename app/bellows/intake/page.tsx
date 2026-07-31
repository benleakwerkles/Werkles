import Link from "next/link";

import { SiteHeader } from "@/components/foundry/site-header";
import { ConciergeIntakeForm } from "@/components/squibb/concierge-intake-form";
import { copy } from "@/lib/copy";

import "./concierge-intake.css";

export const metadata = {
  title: "Concierge Intake | Bellows",
  description: "Describe what is stuck so Werkles can recommend a practical next step."
};

export default function ConciergeIntakePage() {
  return (
    <>
      <SiteHeader />
      <main className="bellows-main narrative-act-page workshop-route--bellows concierge-intake-page">

        <nav className="concierge-intake-page__nav" aria-label="Bellows">
          <Link className="button button-ghost" href="/bellows">
            ← Back to Bellows
          </Link>
          <Link className="button button-ghost" href="/bellows/recommendations/test-case-0">
            See a worked example
          </Link>
        </nav>

        <section className="panel concierge-intake-page__guide" aria-labelledby="intakeGuideTitle">
          <p className="eyebrow">Start with the real problem</p>
          <h2 id="intakeGuideTitle">You do not have to arrive knowing exactly what you need.</h2>
          <p>
            Bring the tangled version. Werkles helps separate the pressure you feel from the partner, funding,
            hire, or tool you may—or may not—need.
          </p>
          <ol>
            <li>Tell us what feels heavy or stuck.</li>
            <li>See the need underneath the first request.</li>
            <li>Compare practical options, risks, and next steps.</li>
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
