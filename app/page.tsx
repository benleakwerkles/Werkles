import Link from "next/link";

import { HeroStatic } from "@/components/foundry/hero-static";
import { HomeValueFold } from "@/components/foundry/home-value-fold";
import { LanesDocumentarySection } from "@/components/foundry/lanes-documentary-section";
import { PublicTrustFooter } from "@/components/foundry/public-trust-footer";
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

        <section className="home-account-handoff" aria-labelledby="homeAccountHandoffTitle">
          <WorkshopBandPanel tone="foundry" className="home-account-handoff__band" atmosphere={false}>
            <div className="home-account-handoff__copy">
              <p className="eyebrow">After the example</p>
              <h2 id="homeAccountHandoffTitle">Ready to try it with your situation?</h2>
              <p>
                Create a free account when you want a private path tied to you. The public example stays available
                without one.
              </p>
            </div>
            <div className="home-account-handoff__actions">
              <Link className="button button-dark" href="/signup?next=%2Fbellows%2Frecommendations">
                Create a free account
              </Link>
              <nav className="home-account-handoff__links" aria-label="Other ways to continue">
                <Link href="/login">Sign in</Link>
                <Link href="/pricing">Pricing</Link>
                <Link href="/dashboard">Member home</Link>
                <Link href="/onboarding">Continue onboarding</Link>
                <Link href="/proof">How trust is checked</Link>
              </nav>
            </div>
          </WorkshopBandPanel>
        </section>

        {ANYONE_NARRATIVE_V2_ENABLED ? null : (
          <p className="home-legacy-note">Legacy narrative sections hidden during visual-story v2 pass.</p>
        )}
      </main>

      <PublicTrustFooter />
    </>
  );
}
