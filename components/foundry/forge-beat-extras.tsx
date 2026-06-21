import Image from "next/image";

import {
  RENDER_BATCH_3_WIRE_ENABLED,
  forgeV2Gallery,
  renderBatch3AttributionNote
} from "@/lib/render-batch-3-imagery";

export function ForgeBeatExtras() {
  if (!RENDER_BATCH_3_WIRE_ENABLED) {
    return null;
  }

  return (
    <section
      id="forge-extras"
      className="narrative-extras narrative-extras--forge"
      aria-labelledby="forgeExtrasTitle"
    >
      <h3 id="forgeExtrasTitle" className="narrative-extras__title">
        Act Three — Forge options
      </h3>
      <div className="narrative-extras__grid">
        {forgeV2Gallery.map((item) => (
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
      </p>
    </section>
  );
}
