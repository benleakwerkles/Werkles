import Link from "next/link";

import BetaSignupForm from "./beta-signup-form";
import { DraftReviewBadge } from "@/components/foundry/draft-review-badge";
import { HeroStatic } from "@/components/foundry/hero-static";
import { HomeValueFold } from "@/components/foundry/home-value-fold";
import { SiteHeader } from "@/components/foundry/site-header";
import { SiteIcon } from "@/components/foundry/site-icon";
import { SquibbStoryBeat } from "@/components/foundry/squibb-story-beat";
import { VisualStorySection } from "@/components/foundry/visual-story-section";
import { WorkshopBandPanel } from "@/components/foundry/workshop-band-panel";
import { ANYONE_NARRATIVE_V2_ENABLED } from "@/lib/anyone-narrative-v2-imagery";
import { copy } from "@/lib/copy";
import { homeStepIcons } from "@/lib/site-icons";
import { routeAtmosphere, stepFacets, workshopFacets } from "@/lib/workshop-facets";

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main id="top" className={routeAtmosphere.home}>
        <div className="home-draft-badge">
          <DraftReviewBadge />
        </div>

        <HeroStatic />
        <HomeValueFold />
        <SquibbStoryBeat />
        <VisualStorySection />

        <section id="how" className="manifesto" aria-labelledby="howTitle">
          <WorkshopBandPanel tone="workshop" layout="split" atmosphere={false}>
            <div>
              <p className="eyebrow">{copy.howItWorks.eyebrow}</p>
              <h2 id="howTitle">{copy.howItWorks.headline}</h2>
            </div>
            <div className="how-steps">
              {copy.howItWorks.steps.map((step, index) => (
                <article key={step.title} className={workshopFacets[stepFacets[index] ?? "blueprint"]}>
                  <SiteIcon icon={homeStepIcons[index] ?? "step-dossier"} size="lg" className="how-step-icon" />
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </WorkshopBandPanel>
        </section>

        <section className="proof-warning proof-boundary">
          <WorkshopBandPanel tone="proof" layout="split" atmosphere={false}>
            <div>
              <p className="eyebrow">{copy.trust.eyebrow}</p>
              <h2>{copy.trust.headline}</h2>
              <p className="trust-badge">{copy.trust.badge}</p>
            </div>
            <div>
              <p>{copy.trust.supporting}</p>
              <p>{copy.trust.body}</p>
            </div>
          </WorkshopBandPanel>
        </section>

        <section className="operations-grid">
          <WorkshopBandPanel tone="foundry" layout="bare" className="operations-grid__band" atmosphere={false}>
            <div className="operations-grid__cards">
              <article id="beta" className="ops-card">
                <div className="card-heading">
                  <p>{copy.home.foundry.eyebrow}</p>
                  <h2>{copy.home.foundry.headline}</h2>
                </div>
                <p>{copy.home.foundry.body}</p>
                <BetaSignupForm />
              </article>

              <article className="ops-card">
                <div className="card-heading">
                  <p>{copy.home.forge.eyebrow}</p>
                  <h2>{copy.home.forge.headline}</h2>
                </div>
                <p>{copy.home.forge.body}</p>
                <div className="gate-list" aria-label="Required account gate">
                  {copy.home.accountGate.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <Link className="button button-outline" href="/proof">
                  {copy.home.forge.primaryCta}
                </Link>
              </article>

              <article className="ops-card">
                <div className="card-heading">
                  <p>{copy.home.dashboardTeaser.kicker}</p>
                  <h2>{copy.home.dashboardTeaser.headline}</h2>
                </div>
                <p className="status-line">{copy.home.dashboardTeaser.body}</p>
                <Link className="button button-outline" href="/membership">
                  {copy.home.foundry.cta}
                </Link>
              </article>
            </div>
          </WorkshopBandPanel>
        </section>

        {ANYONE_NARRATIVE_V2_ENABLED ? null : (
          <p className="home-legacy-note">Legacy narrative sections hidden during visual-story v2 pass.</p>
        )}
      </main>

      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
