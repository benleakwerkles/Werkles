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
          <Link className="button button-outline" href="/signup">
            {copy.hero.primaryCta}
          </Link>
        </section>
      </NarrativeActPageLayout>
      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
