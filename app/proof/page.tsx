import Link from "next/link";

import { PublicTrustFooter } from "@/components/foundry/public-trust-footer";
import { SiteHeader } from "@/components/foundry/site-header";
import { NarrativeActPageLayout } from "@/components/narrative/narrative-act-page-layout";
import { NarrativePhotoGallery } from "@/components/narrative/narrative-photo-gallery";
import { ProofDoctrineSection } from "@/components/narrative/proof-doctrine-section";
import { narrativeV1Assets } from "@/lib/homepage-narrative-imagery";
import { forgeV2Gallery } from "@/lib/render-batch-3-imagery";
import { getNarrativeAct } from "@/lib/narrative-arc";

const foundryProofGallery = [
  {
    id: "foundry-b02",
    title: "Finished product on bench",
    caption: "Canonical Act IV — outcome carries the weight.",
    path: narrativeV1Assets.foundryB02FinishedProduct
  },
  ...forgeV2Gallery.map((item) => ({
    id: item.id,
    title: item.title,
    caption: item.caption,
    path: item.path
  }))
];

export default function ProofPage() {
  const act = getNarrativeAct("/proof");
  if (!act) return null;

  return (
    <>
      <SiteHeader />
      <NarrativeActPageLayout act={act}>
        <NarrativePhotoGallery title="Foundry beat library" items={foundryProofGallery} />
        <ProofDoctrineSection />

        <section className="narrative-act-body panel" aria-labelledby="proofPathsTitle">
          <p className="eyebrow">Where to go next</p>
          <h2 id="proofPathsTitle">Three safe doors after proof.</h2>
          <p>
            Proof is the trust layer. Once you know what Werkles shows and what it refuses to fake, pick the next move
            that matches where you are: exploring, joining, or paying dues.
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
          <p className="eyebrow">The arc</p>
          <h2 id="proofArcTitle">Walk the story in order.</h2>
          <p>
            Spark, Formation, and Space set the tone before Foundry proof. Each act is optional reading — together they
            show what Werkles refuses to fake.
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
              Bellows sits next in the arc. Squibb hosts operator lessons without guru fog once you know what signal
              to inspect.
            </p>
            <Link className="button button-light" href={act.nextSlug}>
              Continue → {act.nextLabel}
            </Link>
          </section>
        ) : null}
      </NarrativeActPageLayout>
      <PublicTrustFooter showProofDisclaimer />
    </>
  );
}
