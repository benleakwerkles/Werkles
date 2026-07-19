import Image from "next/image";

import {
  documentaryLaneIcons,
  documentaryLanePhotos
} from "@/lib/documentary-lane-imagery";
import { laneDefinitions } from "@/lib/visual-system/lanes";

export function LanesDocumentarySection() {
  return (
    <section id="lanes" className="lanes-documentary" aria-labelledby="lanesDocTitle">
      <div className="lanes-documentary__intro">
        <p className="eyebrow">The Forge</p>
        <h2 id="lanesDocTitle">Six lanes. Real people. Visible potential.</h2>
        <p className="lanes-documentary__lede">
          Choose the role closest to how you help work move. You can change it as the work changes.
        </p>
      </div>

      <div className="lanes-documentary__grid">
        {laneDefinitions.map((lane) => {
          const photo = documentaryLanePhotos[lane.id];
          const icon = documentaryLaneIcons[lane.id];

          return (
            <article
              key={lane.id}
              className="lanes-documentary__card"
              style={{ ["--vs-lane-accent" as string]: `var(${lane.accentVar})` }}
              aria-labelledby={`lane-doc-${lane.id}`}
            >
              <figure className="lanes-documentary__photo">
                <Image
                  src={photo.path}
                  alt={photo.alt}
                  width={640}
                  height={360}
                  className="lanes-documentary__photo-img"
                />
                <figcaption>{photo.caption}</figcaption>
              </figure>
              <header className="lanes-documentary__header">
                {icon ? (
                  <img
                    src={icon.path}
                    alt=""
                    width={44}
                    height={44}
                    className="lanes-documentary__icon"
                  />
                ) : null}
                <div>
                  <p className="lanes-documentary__code">Lane</p>
                  <h3 id={`lane-doc-${lane.id}`}>{lane.title}</h3>
                </div>
              </header>
              <p>{lane.definition}</p>
              <ul className="lanes-documentary__attrs" aria-label={`${lane.title} attributes`}>
                {lane.attributes.map((attr) => (
                  <li key={attr}>{attr}</li>
                ))}
              </ul>
              {icon ? <small className="lanes-documentary__prop">{icon.symbol}</small> : null}
            </article>
          );
        })}
      </div>

    </section>
  );
}
