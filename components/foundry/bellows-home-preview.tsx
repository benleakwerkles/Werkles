import Image from "next/image";
import Link from "next/link";

import { copy } from "@/lib/copy";
import {
  RENDER_BATCH_4_SQUIBB_ENABLED,
  renderBatch4AttributionNote,
  squibbBellowsAssets
} from "@/lib/render-batch-4-imagery";

export function BellowsHomePreview() {
  if (!RENDER_BATCH_4_SQUIBB_ENABLED) return null;

  const { bellowsPreview } = copy.home;

  return (
    <section id="bellows-preview" className="bellows-home-preview" aria-labelledby="bellowsPreviewTitle">
      <div className="bellows-home-preview__copy">
        <p className="eyebrow">{bellowsPreview.eyebrow}</p>
        <h2 id="bellowsPreviewTitle">{bellowsPreview.headline}</h2>
        <p>{bellowsPreview.body}</p>
        <p className="bellows-home-preview__host">{bellowsPreview.host}</p>
        <div className="bellows-home-preview__actions">
          <Link className="button button-light" href="/bellows">
            {bellowsPreview.cta}
          </Link>
          <Link className="button button-ghost" href="/proof">
            Inspect proof first
          </Link>
        </div>
      </div>

      <div className="bellows-home-preview__visuals">
        <figure className="bellows-home-preview__squibb">
          <Image
            src={squibbBellowsAssets.bustHost}
            alt="Squibb — brass workshop owl host for Bellows lessons"
            width={420}
            height={420}
            className="bellows-home-preview__squibb-photo"
          />
          <figcaption>{bellowsPreview.squibbCaption}</figcaption>
        </figure>
        <figure className="bellows-home-preview__lesson">
          <Image
            src={squibbBellowsAssets.lessonCard}
            alt="Squibb beside a lesson card on the workshop desk"
            width={560}
            height={420}
            className="bellows-home-preview__lesson-photo"
          />
          <figcaption>{bellowsPreview.lessonCaption}</figcaption>
        </figure>
      </div>

      <p className="bellows-home-preview__note" role="note">
        {renderBatch4AttributionNote}
      </p>
    </section>
  );
}
