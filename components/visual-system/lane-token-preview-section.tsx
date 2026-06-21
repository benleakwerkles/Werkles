import {
  FLARE_TOKENS,
  LANE_DEFINITIONS,
  LANE_TOKEN_SYSTEM_V1_ENABLED,
  PRIMARY_TOKENS,
} from "@/lib/lane-token-system-v1";
import type { LaneTokenId } from "@/lib/lane-token-system-v1";
import {
  RENDER_BATCH_3_WIRE_ENABLED,
  iconsV2Assets,
  renderBatch3AttributionNote,
} from "@/lib/render-batch-3-imagery";
import {
  RENDER_BATCH_4_ICONS_V3_ENABLED,
  iconsV3Assets,
  renderBatch4AttributionNote
} from "@/lib/render-batch-4-imagery";
import {
  RENDER_BATCH_5_WIRE_ENABLED,
  iconsV2BAssets,
  renderBatch5AttributionNote,
} from "@/lib/render-batch-5-imagery";

const laneOrder: LaneTokenId[] = [
  "spark",
  "builder",
  "worker",
  "operator",
  "backer",
  "connector",
];

export function LaneTokenPreviewSection() {
  if (!LANE_TOKEN_SYSTEM_V1_ENABLED) return null;

  return (
    <section id="lane-tokens" className="vs-section vs-section--lane-tokens" aria-labelledby="laneTokensTitle">
      <div className="vs-section__intro">
        <p className="eyebrow">Lane token preview</p>
        <h2 id="laneTokensTitle">Monopoly-style brass tokens</h2>
        <p className="vs-section__lede">
          Primary set is live on lane cards above. Flare set trades the unreadable glove and dog for
          foundry tongs, ingot, flint strike, and interlocking rings — more character, still
          business-credible.
        </p>
      </div>

      <div className="vs-token-compare">
        <div className="vs-token-compare__set">
          <h3>Primary (on lane cards)</h3>
          <ul className="vs-token-strip">
            {laneOrder.map((id) => (
              <li key={`primary-${id}`}>
                <img src={PRIMARY_TOKENS[id].copper} alt="" width={56} height={56} />
                <span>{LANE_DEFINITIONS[id].label}</span>
                <small>{PRIMARY_TOKENS[id].symbol}</small>
              </li>
            ))}
          </ul>
        </div>

        <div className="vs-token-compare__set">
          <h3>Flare (draft v2)</h3>
          <ul className="vs-token-strip">
            {laneOrder.map((id) => (
              <li key={`flare-${id}`}>
                <img src={FLARE_TOKENS[id].copper} alt="" width={56} height={56} />
                <span>{LANE_DEFINITIONS[id].label}</span>
                <small>{FLARE_TOKENS[id].symbol}</small>
              </li>
            ))}
          </ul>
        </div>

        {RENDER_BATCH_3_WIRE_ENABLED ? (
          <div className="vs-token-compare__set vs-token-compare__set--ghost-forge">
            <h3>Ghost Forge v2 — documentary props</h3>
            <p className="vs-token-compare__hint">
              Real objects on the bench — preferred exploration direction. Compare to SVG sets above.
            </p>
            <ul className="vs-token-strip">
              {iconsV2Assets.map((icon) => (
                <li key={icon.id}>
                  <img src={icon.path} alt="" width={56} height={56} className="vs-token-strip__photo" />
                  <span>{icon.label}</span>
                  <small>{icon.symbol}</small>
                </li>
              ))}
            </ul>
            <p className="stock-preview-badge" role="note">
              {renderBatch3AttributionNote}
            </p>
          </div>
        ) : null}

        {RENDER_BATCH_5_WIRE_ENABLED ? (
          <div className="vs-token-compare__set vs-token-compare__set--ghost-forge">
            <h3>Ghost Forge v2-b — documentary alternates</h3>
            <p className="vs-token-compare__hint">
              Second prop pass — matchbook, glove, clipboard, and other bench objects.
            </p>
            <ul className="vs-token-strip">
              {iconsV2BAssets.map((icon) => (
                <li key={icon.id}>
                  <img src={icon.path} alt="" width={56} height={56} className="vs-token-strip__photo" />
                  <span>{icon.label}</span>
                  <small>{icon.symbol}</small>
                </li>
              ))}
            </ul>
            <p className="stock-preview-badge" role="note">
              {renderBatch5AttributionNote}
            </p>
          </div>
        ) : null}

        {RENDER_BATCH_4_ICONS_V3_ENABLED ? (
          <div className="vs-token-compare__set vs-token-compare__set--ghost-forge">
            <h3>Ghost Forge v3 — Operator Marks (flat vector)</h3>
            <p className="vs-token-compare__hint">
              Brand-matched duochrome + copper lane strokes — compare to documentary props above.
            </p>
            <ul className="vs-token-strip">
              {iconsV3Assets.map((icon) => (
                <li key={icon.id}>
                  <img src={icon.path} alt="" width={56} height={56} className="vs-token-strip__photo" />
                  <span>{icon.label}</span>
                  <small>{icon.symbol}</small>
                </li>
              ))}
            </ul>
            <p className="stock-preview-badge" role="note">
              {renderBatch4AttributionNote}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
