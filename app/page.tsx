import Link from "next/link";

import BetaSignupForm from "./beta-signup-form";
import { HeroStatic } from "@/components/foundry/hero-static";
import { HomeValueFold } from "@/components/foundry/home-value-fold";
import { LanesDocumentarySection } from "@/components/foundry/lanes-documentary-section";
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
        <HeroStatic />
        <HomeValueFold />

        <section className="manifesto" aria-labelledby="honestTitle">
          <WorkshopBandPanel tone="workshop" layout="split" atmosphere={false}>
            <div>
              <p className="eyebrow">The honest question</p>
              <h2 id="honestTitle">You could do this without us.</h2>
              <p>
                Another AI. A consultant. The SBA. All real options — so here&apos;s the honest math on each,
                because if we can&apos;t win this comparison out loud, we don&apos;t deserve your ten bucks.
              </p>
            </div>
            <div className="honest-answers">
              <article>
                <h3>Another AI will agree with you.</h3>
                <p>
                  Ask a chatbot about your plan and it cheers you on. Werkles checks your plan against real
                  prices, real sellers, and verifiable proof — and tells you when you&apos;re wrong. That&apos;s
                  the difference between a mirror and a scout.
                </p>
              </article>
              <article>
                <h3>A good consultant runs $150 an hour.</h3>
                <p>
                  Some are worth it. But you shouldn&apos;t need to pay consulting rates to find out your real
                  bottleneck is a $4,200 oven. Werkles is $9.99 a month because your runway matters more than
                  our margin.
                </p>
              </article>
              <article>
                <h3>The SBA is genuinely good. Use it.</h3>
                <p>
                  Seriously — free counseling, real programs. Werkles sits beside it, not against it: the SBA
                  hands you the textbook; Werkles names <em>your</em> missing piece and verifies the specific
                  people you&apos;d rely on to get it.
                </p>
              </article>
              <article>
                <h3>No schemes. No gouging. That&apos;s the pitch.</h3>
                <p>
                  We&apos;re not selling a get-rich-quick anything. We listen to your reality and show you how
                  it fits the reality the world throws back. If that&apos;s not worth ten dollars, cancel — it
                  takes one click.
                </p>
              </article>
            </div>
          </WorkshopBandPanel>
        </section>

        <LanesDocumentarySection />
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
                <div className="member-selected-surface__actions">
                  <Link className="button button-dark" href="/login">
                    Log in
                  </Link>
                  <Link className="button button-outline" href="/dashboard">
                    Member home
                  </Link>
                </div>
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
