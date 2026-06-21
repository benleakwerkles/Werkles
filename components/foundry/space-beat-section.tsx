import Image from "next/image";

import { copy } from "@/lib/copy";
import {
  NARRATIVE_V1_WIRE_ENABLED,
  narrativeV1Assets,
  narrativeV1AttributionNote
} from "@/lib/homepage-narrative-imagery";

export function SpaceBeatSection() {
  const { spaceBeat } = copy.home;

  return (
    <section
      id="space"
      className={`space-beat${NARRATIVE_V1_WIRE_ENABLED ? " space-beat--wired" : ""}`}
      aria-labelledby="spaceBeatTitle"
      data-narrative-beat="space"
    >
      <div className="space-beat__copy">
        <p className="eyebrow">{spaceBeat.eyebrow}</p>
        <h2 id="spaceBeatTitle">{spaceBeat.headline}</h2>
        <p>{spaceBeat.body}</p>
        {NARRATIVE_V1_WIRE_ENABLED ? (
          <p className="space-beat__note" role="note">
            {narrativeV1AttributionNote}
          </p>
        ) : null}
      </div>
      {NARRATIVE_V1_WIRE_ENABLED ? (
        <figure className="space-beat__figure">
          <Image
            src={narrativeV1Assets.spaceD01BeforeOpening}
            alt="Empty working commercial space before opening — documentary preview still"
            width={1280}
            height={720}
            className="space-beat__photo"
            priority={false}
          />
        </figure>
      ) : (
        <div
          className="space-beat__frame"
          role="img"
          aria-label={spaceBeat.frameLabel}
          data-frame-status="pending"
        >
          <span className="space-beat__frame-label">{spaceBeat.frameLabel}</span>
        </div>
      )}
    </section>
  );
}
