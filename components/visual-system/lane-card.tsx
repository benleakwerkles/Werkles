import { STOCK_PREVIEW_ENABLED, stockPreviewByLane } from "@/lib/stock-preview-imagery";
import type { LaneDefinition } from "@/lib/visual-system/types";

type LaneCardProps = {
  lane: LaneDefinition;
};

export function LaneCard({ lane }: LaneCardProps) {
  const preview = STOCK_PREVIEW_ENABLED ? stockPreviewByLane[lane.id] : null;

  return (
    <article
      className={`vs-lane-card${preview ? " vs-lane-card--stock-preview" : ""}`}
      style={{ ["--vs-lane-accent" as string]: `var(${lane.accentVar})` }}
      aria-labelledby={`lane-${lane.id}-title`}
    >
      {preview ? (
        <figure className="vs-lane-card__photo">
          <img src={preview.path} alt="" loading="lazy" decoding="async" />
          <figcaption>{preview.scene}</figcaption>
        </figure>
      ) : null}
      <header className="vs-lane-card__header">
        <p className="vs-lane-card__code">Lane</p>
        <h3 id={`lane-${lane.id}-title`} className="vs-lane-card__title">
          {lane.title}
        </h3>
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
