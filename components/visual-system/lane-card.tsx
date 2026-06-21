import Image from "next/image";

import {
  documentaryLaneIcons,
  documentaryLanePhotos
} from "@/lib/documentary-lane-imagery";
import type { LaneDefinition } from "@/lib/visual-system/types";

type LaneCardProps = {
  lane: LaneDefinition;
};

export function LaneCard({ lane }: LaneCardProps) {
  const photo = documentaryLanePhotos[lane.id];
  const icon = documentaryLaneIcons[lane.id];

  return (
    <article
      className="vs-lane-card vs-lane-card--documentary"
      style={{ ["--vs-lane-accent" as string]: `var(${lane.accentVar})` }}
      aria-labelledby={`lane-${lane.id}-title`}
    >
      <figure className="vs-lane-card__photo">
        <Image
          src={photo.path}
          alt={photo.alt}
          width={640}
          height={360}
          className="vs-lane-card__photo-img"
        />
        <figcaption>{photo.caption}</figcaption>
      </figure>
      <header className="vs-lane-card__header">
        <div className="vs-lane-card__title-row">
          <div>
            <p className="vs-lane-card__code">Lane</p>
            <h3 id={`lane-${lane.id}-title`} className="vs-lane-card__title">
              {lane.title}
            </h3>
          </div>
          <figure className="vs-lane-card__token" aria-hidden="true">
            <img src={icon.path} alt="" width={48} height={48} decoding="async" />
          </figure>
        </div>
      </header>
      <p className="vs-lane-card__definition">{lane.definition}</p>
      <ul className="vs-lane-card__attributes" aria-label={`${lane.title} attributes`}>
        {lane.attributes.map((attr) => (
          <li key={attr}>{attr}</li>
        ))}
      </ul>
    </article>
  );
}
