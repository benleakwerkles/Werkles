import { iconsV2Assets, RENDER_BATCH_3_WIRE_ENABLED, renderBatch3AttributionNote } from "@/lib/render-batch-3-imagery";
import {
  iconsV2BAssets,
  RENDER_BATCH_5_WIRE_ENABLED,
  renderBatch5AttributionNote
} from "@/lib/render-batch-5-imagery";

type Props = {
  compact?: boolean;
};

/** Documentary prop icons only — retired W-mark / Operator Marks / brass token comparison rows. */
export function IconComparisonSheet({ compact = false }: Props) {
  if (!RENDER_BATCH_3_WIRE_ENABLED && !RENDER_BATCH_5_WIRE_ENABLED) {
    return null;
  }

  return (
    <section
      className={`icon-comparison-sheet icon-comparison-sheet--documentary${compact ? " icon-comparison-sheet--compact" : ""}`}
      aria-labelledby="iconComparisonTitle"
    >
      <h2 id="iconComparisonTitle" className="icon-comparison-sheet__title">
        Documentary lane props
      </h2>
      <p className="icon-comparison-sheet__lede">
        Real objects on the bench — mild lane wayfinding. Not mascot art, not settled W-mark exploration.
      </p>

      {RENDER_BATCH_3_WIRE_ENABLED ? (
        <div className="icon-comparison-sheet__row">
          <h3>Primary prop set</h3>
          <ul className="icon-comparison-sheet__strip">
            {iconsV2Assets.map((icon) => (
              <li key={icon.id}>
                <img src={icon.path} alt="" width={48} height={48} className="icon-comparison-sheet__photo" />
                <span>{icon.label}</span>
                <small>{icon.symbol}</small>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {RENDER_BATCH_5_WIRE_ENABLED ? (
        <div className="icon-comparison-sheet__row">
          <h3>Alternate prop set</h3>
          <ul className="icon-comparison-sheet__strip">
            {iconsV2BAssets.map((icon) => (
              <li key={icon.id}>
                <img src={icon.path} alt="" width={48} height={48} className="icon-comparison-sheet__photo" />
                <span>{icon.label}</span>
                <small>{icon.symbol}</small>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="icon-comparison-sheet__note" role="note">
        {RENDER_BATCH_5_WIRE_ENABLED ? renderBatch5AttributionNote : renderBatch3AttributionNote}
      </p>
    </section>
  );
}
