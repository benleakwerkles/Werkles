import Link from "next/link";

import { SiteHeader } from "@/components/foundry/site-header";
import { IconComparisonSheet } from "@/components/narrative/icon-comparison-sheet";
import { NarrativeActPageLayout } from "@/components/narrative/narrative-act-page-layout";
import { copy } from "@/lib/copy";
import { getNarrativeAct } from "@/lib/narrative-arc";

export default function SparkPage() {
  const act = getNarrativeAct("/spark");
  if (!act) return null;

  return (
    <>
      <SiteHeader />
      <NarrativeActPageLayout act={act}>
        <section className="narrative-act-body panel">
          <h2>Before the room exists</h2>
          <p>
            Spark is one person with a specific opening in frame — notes, plans, half-finished thought on real work.
            Not applause, not performance — just evidence that something wants steel around it.
          </p>
          <div className="trust-state-strip" aria-label="Spark entry paths">
            <span>Free account</span>
            <span>Proof before trust</span>
            <span>Onboarding when ready</span>
          </div>
          <div className="member-selected-surface__actions">
            <Link className="button button-dark" href="/signup">
              {copy.hero.primaryCta}
            </Link>
            <Link className="button button-outline" href="/proof">
              Inspect proof
            </Link>
            <Link className="button button-outline" href="/onboarding">
              See onboarding
            </Link>
          </div>
        </section>
      </NarrativeActPageLayout>
      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
