import Link from "next/link";
import { copy } from "@/lib/copy";
import { HeroCopyBlock } from "@/components/foundry/hero-copy-block";
import { WorkshopMomentEyebrow } from "@/components/foundry/workshop-moment-eyebrow";
import { ANYONE_NARRATIVE_V2_ENABLED } from "@/lib/anyone-narrative-v2-imagery";
import { ANYONE_NARRATIVE_WIRE_ENABLED } from "@/lib/anyone-narrative-imagery";
import { NARRATIVE_V1_WIRE_ENABLED } from "@/lib/homepage-narrative-imagery";
import { RENDER_BATCH_1_ENABLED } from "@/lib/render-batch-1-imagery";
import { STOCK_PREVIEW_ENABLED } from "@/lib/stock-preview-imagery";

export function HeroStatic() {
  const { artifact } = copy.home;
  const heroImageryClass = ANYONE_NARRATIVE_V2_ENABLED
    ? " hero--story-v2"
    : ANYONE_NARRATIVE_WIRE_ENABLED
      ? " hero--anyone-narrative"
      : NARRATIVE_V1_WIRE_ENABLED
      ? " hero--narrative-v1"
      : RENDER_BATCH_1_ENABLED
      ? " hero--render-batch-1"
      : STOCK_PREVIEW_ENABLED
        ? " hero--stock-preview"
        : "";

  return (
    <section className={`hero hero--draft-v01 hero--rewrite-v1${heroImageryClass}`}>
      <div className="hero-copy">
        <WorkshopMomentEyebrow />
        <HeroCopyBlock />
        <div className="hero-actions">
          <Link className="button button-light" href="/bellows/recommendations">
            {copy.hero.primaryCta}
          </Link>
          <Link className="button button-ghost" href="/proof">
            {copy.hero.secondaryCta}
          </Link>
        </div>
        <p className="hero-trust-line">{copy.hero.trustLine}</p>
      </div>

      <aside className="hero-artifact" aria-label="Example Werkles output">
        <p className="hero-artifact__label">{artifact.label}</p>
        <div className="hero-artifact__plate">
          <strong className="hero-artifact__title">{artifact.title}</strong>
          <p className="hero-artifact__means">{artifact.meansLine}</p>
          <p className="hero-artifact__body">{artifact.body}</p>
          <span className="hero-artifact__badge">{copy.trust.badge}</span>
        </div>
        <p className="hero-artifact__note">{artifact.note}</p>
      </aside>
    </section>
  );
}
