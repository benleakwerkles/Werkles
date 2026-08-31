import Link from "next/link";

import { NarrativeActPageLayout } from "@/components/narrative/narrative-act-page-layout";
import { NarrativePhotoGallery } from "@/components/narrative/narrative-photo-gallery";
import { ProofDoctrineSection } from "@/components/narrative/proof-doctrine-section";
import { copy } from "@/lib/copy";
import { narrativeV1Assets } from "@/lib/homepage-narrative-imagery";
import { forgeV2Gallery } from "@/lib/render-batch-3-imagery";
import { getNarrativeAct } from "@/lib/narrative-arc";

const foundryProofGallery = [
  {
    id: "foundry-b02",
    title: "Finished product on bench",
    caption: "A finished result you can inspect.",
    path: narrativeV1Assets.foundryB02FinishedProduct
  },
  ...forgeV2Gallery.map((item) => ({
    id: item.id,
    title: item.title,
    caption: item.caption,
    path: item.path
  }))
];

export const metadata = {
  title: "Proof you can check",
  description: "Identity, credentials, references, funds — verified at the moment you need to rely on someone."
};

export default function ProofPage() {
  const act = getNarrativeAct("/proof");
  if (!act) return null;

  return (
    <>
      <NarrativeActPageLayout act={act}>
        <NarrativePhotoGallery title="What checked work can look like" items={foundryProofGallery} />
        <ProofDoctrineSection />

        <section className="narrative-act-body panel" aria-labelledby="proofPathsTitle">
          <p className="eyebrow">Where to go next</p>
          <h2 id="proofPathsTitle">Choose what to do next.</h2>
          <p>
            Once you know what Werkles can check—and what it cannot—pick the next move that fits where you are:
            exploring, joining, or paying dues.
          </p>
          <div className="trust-state-strip" aria-label="Proof exit paths">
            <span>Start free</span>
            <span>Compare pricing</span>
            <span>Join when ready</span>
          </div>
          <div className="member-selected-surface__actions">
            <Link className="button button-dark" href="/signup">
              Start free
            </Link>
            <Link className="button button-outline" href="/pricing">
              Compare pricing
            </Link>
            <Link className="button button-outline" href="/membership">
              Review Foundry Dues
            </Link>
          </div>
        </section>

        <section className="narrative-act-body panel" aria-labelledby="proofArcTitle">
          <p className="eyebrow">See the pieces</p>
          <h2 id="proofArcTitle">See how an idea becomes shared work.</h2>
          <p>
            Start with the idea, look at the place it needs, and decide who belongs in the work. Each page stands on
            its own; together they show where checks become useful.
          </p>
          <div className="member-selected-surface__actions">
            <Link className="button button-outline" href="/spark">
              Spark
            </Link>
            <Link className="button button-outline" href="/formation">
              Formation
            </Link>
            <Link className="button button-outline" href="/space">
              Space
            </Link>
          </div>
        </section>

        {act.nextSlug ? (
          <section className="narrative-act-body panel">
            <h2>After proof — learn the floor</h2>
            <p>
              Bellows gives you practical lessons and working tools once you know which question needs attention.
            </p>
            <Link className="button button-light" href={act.nextSlug}>
              Continue → {act.nextLabel}
            </Link>
          </section>
        ) : null}
      </NarrativeActPageLayout>
      <footer className="site-footer">
        <p>{copy.proofDisclaimer}</p>
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
