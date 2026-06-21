import Link from "next/link";

import { SiteHeader } from "@/components/foundry/site-header";
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
      <footer className="site-footer">
        <p>{copy.proofDisclaimer}</p>
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
