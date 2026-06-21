import { RENDER_BATCH_1_ENABLED, renderBatch1AttributionNote } from "@/lib/render-batch-1-imagery";
import { STOCK_PREVIEW_ENABLED, stockPreviewAttributionNote } from "@/lib/stock-preview-imagery";
import { laneDefinitions } from "@/lib/visual-system/lanes";
import { profileCardShowcase } from "@/lib/visual-system/profile-cards";
import { FormationSequence } from "./formation-sequence";
import { LaneCard } from "./lane-card";
import { LaneTokenPreviewSection } from "./lane-token-preview-section";
import { ProfileCard } from "./profile-card";
import { StockPreviewBadge } from "./stock-preview-badge";

export function EnderVisualTestsSection() {
  return (
    <>
      <section id="profile-cards" className="vs-section" aria-labelledby="profileCardsTitle">
        <div className="vs-section__intro">
          <p className="eyebrow">Ender visual test 1</p>
          <h2 id="profileCardsTitle">Profile card design system</h2>
          <p className="vs-section__lede">
            Four states — undeclared, lane chosen, in formation, formed. Cards carry lane, role,
            formation status, skills, and availability. No character art. Iron Palette only.
          </p>
        </div>
        <div className="vs-profile-showcase">
          {profileCardShowcase.map((model) => (
            <ProfileCard key={model.state} model={model} />
          ))}
        </div>
      </section>

      <section
        id="lanes"
        className={`vs-section${RENDER_BATCH_1_ENABLED || STOCK_PREVIEW_ENABLED ? " vs-section--stock-preview" : ""}`}
        aria-labelledby="lanesTitle"
      >
        <div className="vs-section__intro">
          <p className="eyebrow">Ender visual test 2</p>
          <h2 id="lanesTitle">Lane cards</h2>
          <p className="vs-section__lede">
            Six lanes — definition plus three attributes. Color coding within Iron Palette. No fantasy
            archetypes, no game UI, no construction-only framing.
            {RENDER_BATCH_1_ENABLED
              ? " Render Batch 1 human-first scenes — documentary realism, not game art."
              : STOCK_PREVIEW_ENABLED
                ? " Editorial workplace photos preview the people-direction shift — environments, not game art."
                : null}
          </p>
          {RENDER_BATCH_1_ENABLED ? (
            <p className="stock-preview-badge" role="note">
              {renderBatch1AttributionNote}
            </p>
          ) : STOCK_PREVIEW_ENABLED ? (
            <StockPreviewBadge />
          ) : null}
        </div>
        <div className="vs-lane-grid">
          {laneDefinitions.map((lane) => (
            <LaneCard key={lane.id} lane={lane} />
          ))}
        </div>
      </section>

      <LaneTokenPreviewSection />

      <section id="formation" className="vs-section" aria-labelledby="formationTitle">
        <div className="vs-section__intro">
          <p className="eyebrow">Ender visual test 3</p>
          <h2 id="formationTitle">Formation sequence</h2>
          <p className="vs-section__lede">
            Solo with ghost slots, partial formation with precise lines, Werkle formed with dossier
            frame. Cards and outlines only — no puzzle pieces, gears, or handshakes.
          </p>
          {RENDER_BATCH_1_ENABLED ? (
            <p className="stock-preview-badge" role="note">
              {renderBatch1AttributionNote}
            </p>
          ) : STOCK_PREVIEW_ENABLED ? (
            <StockPreviewBadge />
          ) : null}
        </div>
        <FormationSequence />
      </section>
    </>
  );
}
