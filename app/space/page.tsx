import Link from "next/link";

import { SiteHeader } from "@/components/foundry/site-header";
import { NarrativeActPageLayout } from "@/components/narrative/narrative-act-page-layout";
import { NarrativePhotoGallery } from "@/components/narrative/narrative-photo-gallery";
import { copy } from "@/lib/copy";
import { allSpaceGallery, getNarrativeAct } from "@/lib/narrative-arc";

export default function SpacePage() {
  const act = getNarrativeAct("/space");
  if (!act) return null;

  return (
    <>
      <SiteHeader />
      <NarrativeActPageLayout act={act}>
        <NarrativePhotoGallery title="Space beat library" items={allSpaceGallery} />
        <section className="narrative-act-body panel">
          <h2>Inhabited, not abandoned</h2>
          <p>
            Every Space frame needs one sign of recent or imminent use — apron on hook, pen in gutter, tool out of
            rack. Real-estate aspiration and demolition reads both fail this act.
          </p>
          <Link className="button button-outline" href="/">
            Back to homepage Space beat
          </Link>
        </section>
      </NarrativeActPageLayout>
      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
