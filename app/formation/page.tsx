import Link from "next/link";

import { SiteHeader } from "@/components/foundry/site-header";
import { IconComparisonSheet } from "@/components/narrative/icon-comparison-sheet";
import { NarrativeActPageLayout } from "@/components/narrative/narrative-act-page-layout";
import { NarrativePhotoGallery } from "@/components/narrative/narrative-photo-gallery";
import { copy } from "@/lib/copy";
import { allForgeGallery, getNarrativeAct } from "@/lib/narrative-arc";

export default function FormationPage() {
  const act = getNarrativeAct("/formation");
  if (!act) return null;

  return (
    <>
      <SiteHeader />
      <NarrativeActPageLayout act={act}>
        <NarrativePhotoGallery title="Forge beat library" items={allForgeGallery} />
        <IconComparisonSheet />
        <section className="narrative-act-body panel">
          <h2>Lanes meeting on the work</h2>
          <p>
            Forge is where complementary lanes share attention on a plan, fixture, or number — never the camera.
            Documentary lane cards on the homepage carry the human proof; these photographs deepen the library.
          </p>
          <div className="trust-state-strip" aria-label="Formation entry paths">
            <span>Pick a lane</span>
            <span>Build profile</span>
            <span>Proof visible</span>
          </div>
          <div className="member-selected-surface__actions">
            <Link className="button button-dark" href="/onboarding">
              Pick your lane
            </Link>
            <Link className="button button-outline" href="/signup">
              Start free
            </Link>
            <Link className="button button-outline" href="/proof">
              Inspect proof
            </Link>
            <Link className="button button-ghost" href="/#lanes">
              See lanes on home
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
