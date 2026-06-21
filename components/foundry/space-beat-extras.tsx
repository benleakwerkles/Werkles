import Image from "next/image";

import {
  RENDER_BATCH_3_WIRE_ENABLED,
  renderBatch3AttributionNote,
  spaceV2Gallery
} from "@/lib/render-batch-3-imagery";
import { RENDER_BATCH_4_WIRE_ENABLED, spaceBatch4Items } from "@/lib/render-batch-4-imagery";

const allSpaceExtras = [...spaceV2Gallery, ...(RENDER_BATCH_4_WIRE_ENABLED ? spaceBatch4Items : [])];

export function SpaceBeatExtras() {
  if (!RENDER_BATCH_3_WIRE_ENABLED) {
    return null;
  }

  return (
    <section className="narrative-extras narrative-extras--space" aria-labelledby="spaceExtrasTitle">
      <h3 id="spaceExtrasTitle" className="narrative-extras__title">
        More Space beats
      </h3>
      <div className="narrative-extras__grid">
        {allSpaceExtras.map((item) => (
          <figure key={item.id} className="narrative-extras__tile">
            <Image
              src={item.path}
              alt={item.title}
              width={640}
              height={360}
              className="narrative-extras__photo"
            />
            <figcaption>
              <strong>{item.title}</strong>
              <span>{item.caption}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="narrative-extras__note" role="note">
        {renderBatch3AttributionNote}
        {RENDER_BATCH_4_WIRE_ENABLED ? ` ${spaceBatch4Items.length} Batch 4 Space beats included.` : ""}
      </p>
    </section>
  );
}
