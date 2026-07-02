import { renderBatch1Assets, renderBatch1AttributionNote, renderBatch1Hero } from "@/lib/render-batch-1-imagery";

export function RenderBatch1Gallery() {
  return (
    <section id="render-batch-1" className="render-batch-gallery" aria-labelledby="renderBatch1Title">
      <div className="render-batch-gallery__header">
        <p className="eyebrow">Render Batch 1 — draft review</p>
        <h2 id="renderBatch1Title">Human-first Werkles scenes</h2>
        <p className="render-batch-gallery__lede">
          Documentary realism preview batch. Recommended hero: <strong>{renderBatch1Hero.title}</strong>.
        </p>
        <p className="stock-preview-badge" role="note">
          {renderBatch1AttributionNote}
        </p>
      </div>
      <div className="render-batch-gallery__grid">
        {renderBatch1Assets.map((asset) => (
          <figure key={asset.id} className="render-batch-gallery__tile">
            <div className="render-batch-gallery__frame">
              <img src={asset.path} alt="" loading="lazy" decoding="async" />
            </div>
            <figcaption>
              <strong>
                {asset.priority}. {asset.title}
              </strong>
              <span>{asset.placement}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
