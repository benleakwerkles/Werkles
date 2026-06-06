import Link from "next/link";
import { copy } from "@/lib/copy";
import { WorkshopMomentEyebrow } from "@/components/foundry/workshop-moment-eyebrow";
import { STOCK_PREVIEW_ENABLED } from "@/lib/stock-preview-imagery";

export function HeroStatic() {
  const { artifact } = copy.home;

  return (
    <section
      className={`hero hero--draft-v01 hero--rewrite-v1${STOCK_PREVIEW_ENABLED ? " hero--stock-preview" : ""}`}
    >
      <div className="hero-copy">
        <WorkshopMomentEyebrow />
        <h1>{copy.hero.headline}</h1>
        <p className="hero-lead">{copy.hero.subhead}</p>
        <p className="hero-positioning">{copy.hero.positioning}</p>
        <p className="hero-before">{copy.hero.beforeState}</p>
        <div className="hero-actions">
          <Link className="button button-light" href="/signup">
            {copy.hero.primaryCta}
          </Link>
          <Link className="button button-ghost" href="#how">
            {copy.hero.secondaryCta}
          </Link>
        </div>
        <p className="hero-signup-preview">{copy.hero.signupPreview}</p>
      </div>

      <aside className="hero-artifact" aria-label="Example Werkles output">
        <p className="hero-artifact__label">{artifact.label}</p>
        <div className="hero-artifact__plate">
          <strong className="hero-artifact__title">{artifact.title}</strong>
          <p className="hero-artifact__fit">{artifact.fitLine}</p>
          <p className="hero-artifact__body">{artifact.body}</p>
          <span className="hero-artifact__badge">{copy.trust.badge}</span>
        </div>
        <p className="hero-artifact__note">{artifact.note}</p>
      </aside>
    </section>
  );
}
