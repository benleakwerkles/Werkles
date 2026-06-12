import { iconsV2Assets, RENDER_BATCH_3_WIRE_ENABLED, renderBatch3AttributionNote } from "@/lib/render-batch-3-imagery";
import {
  iconsV2BAssets,
  RENDER_BATCH_5_WIRE_ENABLED,
  renderBatch5AttributionNote
} from "@/lib/render-batch-5-imagery";

/** Mild documentary prop strip — support icons, not hero content. */
export function DocumentaryIconsStrip() {
  if (!RENDER_BATCH_3_WIRE_ENABLED) return null;

  const alternates = RENDER_BATCH_5_WIRE_ENABLED ? iconsV2BAssets : [];

  return (
    <section
      id="lane-icons"
      className="documentary-icons-strip"
      aria-labelledby="documentaryIconsTitle"
    >
      <div className="documentary-icons-strip__intro">
        <p className="eyebrow">Lane props</p>
        <h2 id="documentaryIconsTitle">Documentary icons on the bench</h2>
        <p className="documentary-icons-strip__lede">
          Real objects at rest — mild wayfinding for lanes, not mascot art or W-mark exploration.
        </p>
      </div>

      <ul className="documentary-icons-strip__row" aria-label="Documentary lane prop icons">
        {iconsV2Assets.map((icon) => (
          <li key={icon.id}>
            <img src={icon.path} alt="" width={56} height={56} className="documentary-icons-strip__photo" />
            <span>{icon.label}</span>
            <small>{icon.symbol}</small>
          </li>
        ))}
      </ul>

      {alternates.length > 0 ? (
        <>
          <p className="documentary-icons-strip__alt-label">Alternate prop set (Batch 5)</p>
          <ul className="documentary-icons-strip__row documentary-icons-strip__row--alt" aria-label="Alternate documentary props">
            {alternates.map((icon) => (
              <li key={icon.id}>
                <img src={icon.path} alt="" width={56} height={56} className="documentary-icons-strip__photo" />
                <span>{icon.label}</span>
                <small>{icon.symbol}</small>
              </li>
            ))}
          </ul>
          <p className="documentary-icons-strip__note" role="note">
            {renderBatch5AttributionNote}
          </p>
        </>
      ) : (
        <p className="documentary-icons-strip__note" role="note">
          {renderBatch3AttributionNote}
        </p>
      )}
    </section>
  );
}
