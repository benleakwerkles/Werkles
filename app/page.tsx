import Link from "next/link";

import BetaSignupForm from "./beta-signup-form";
import { HeroStatic } from "@/components/foundry/hero-static";
import { HomeValueFold } from "@/components/foundry/home-value-fold";
import { HomeObjectInterlude } from "@/components/foundry/home-object-interlude";
import { LanesDocumentarySection } from "@/components/foundry/lanes-documentary-section";
import { SiteHeader } from "@/components/foundry/site-header";
import { SiteIcon } from "@/components/foundry/site-icon";
import { WorkshopBandPanel } from "@/components/foundry/workshop-band-panel";
import { copy } from "@/lib/copy";
import { homeStepIcons } from "@/lib/site-icons";
import { routeAtmosphere, stepFacets, workshopFacets } from "@/lib/workshop-facets";

/* Owner review 2026-08-02: "How it works" was three paragraphs — READ READ READ.
   Each step now shows a stylized mini-screen of the actual product surface and
   links to the real page, so visitors see and click instead of reading. */
const howStepDemos = [
  {
    href: "/bellows/intake",
    cta: "Try stating a need",
    mock: (
      <div className="how-mock" aria-hidden="true">
        <p className="how-mock__label">You type</p>
        <div className="how-mock__field">
          I need to win larger contracts
          <span className="how-mock__caret" />
        </div>
        <span className="how-mock__send">Name it</span>
      </div>
    )
  },
  {
    href: "/spark",
    cta: "See a real translation",
    mock: (
      <div className="how-mock" aria-hidden="true">
        <p className="how-mock__label">Werkles answers</p>
        <div className="how-mock__swap">
          <span className="how-mock__said">Goal: larger contracts</span>
          <span className="how-mock__real">What may be in the way: proof you can deliver</span>
        </div>
      </div>
    )
  },
  {
    href: "/proof",
    cta: "See how proof looks",
    mock: (
      <div className="how-mock" aria-hidden="true">
        <p className="how-mock__label">Seller checks</p>
        <ul className="how-mock__checks">
          <li>
            <span>Identity</span>
            <em>verified</em>
          </li>
          <li>
            <span>License</span>
            <em>current</em>
          </li>
          <li>
            <span>Funds</span>
            <em>not checked yet</em>
          </li>
        </ul>
      </div>
    )
  }
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main id="top" className={routeAtmosphere.home}>
        <HeroStatic />
        <HomeValueFold />
        <HomeObjectInterlude />

        <section className="manifesto" aria-labelledby="honestTitle">
          <WorkshopBandPanel tone="workshop" layout="split" atmosphere={false}>
            <div>
              <p className="eyebrow">The honest question</p>
              <h2 id="honestTitle">Werkles should earn its place in your week.</h2>
              <p>
                You already have search, AI, advisers, and people you trust. Werkles earns its keep only when it
                turns that scattered help into a clearer decision and something useful you can carry forward.
              </p>
            </div>
            <div className="honest-answers">
              <article>
                <h3>Use AI for ideas. Use Werkles to organize the decision.</h3>
                <p>
                  Werkles keeps your goal, constraints, possible next moves, and unanswered questions together.
                  When a fact matters, it stays visibly unconfirmed until you or a narrow check supports it.
                </p>
              </article>
              <article>
                <h3>Bring in an expert when the question deserves one.</h3>
                <p>
                  Werkles helps you arrive with the decision, facts, and gaps already laid out. You spend expert
                  time on judgment that needs expertise—not reconstructing your story from scratch.
                </p>
              </article>
              <article>
                <h3>Free public help belongs in the plan too.</h3>
                <p>
                  A public program, library, trade group, or local adviser may be the best next door. Werkles is
                  not here to hide a better free answer; it helps you decide what to ask and what to bring.
                </p>
              </article>
              <article>
                <h3>Pay only when the continuity is worth it.</h3>
                <p>
                  The free path should solve something real. Membership is for deeper tools, saved continuity,
                  and shared Werkle work. It is not a promise of funding, success, or the perfect partner.
                </p>
              </article>
            </div>
          </WorkshopBandPanel>
        </section>

        <LanesDocumentarySection />

        <section id="what-comes-back" className="home-output" aria-labelledby="homeOutputTitle">
          <WorkshopBandPanel tone="workshop" layout="bare" atmosphere={false}>
            <header className="home-output__header">
              <p className="eyebrow">What Werkles can produce</p>
              <h2 id="homeOutputTitle">From a messy need to a usable next move.</h2>
              <p>
                Tell us what you are trying to do once. Werkles uses your answers to build practical next moves
                and compare possible people against the same need.
              </p>
            </header>

            <div className="home-output__demo">
              <div className="home-output__prompt">
                <span>Start here</span>
                <strong>What are you trying to make happen?</strong>
                <p>Bring the notes, screenshots, emails, ideas, and loose ends.</p>
              </div>

              <ol className="home-output__grid" aria-label="What Werkles can produce from your answers">
                <li>
                  <div className="home-output__card-head">
                    <span className="home-output__number" aria-hidden="true">01</span>
                    <small>Hypothesis, not verdict</small>
                  </div>
                  <h3>Find what may be holding the plan up</h3>
                  <p>Separate what you want from what may be getting in the way.</p>
                  <div className="home-output__mini">
                    <span>Goal</span>
                    <strong>What should change</strong>
                    <span>Likely blocker</span>
                    <strong>What to test first</strong>
                  </div>
                </li>
                <li data-output="artifact">
                  <div className="home-output__card-head">
                    <span className="home-output__number" aria-hidden="true">02</span>
                    <small>Editable output</small>
                  </div>
                  <h3>Make something you can use</h3>
                  <p>Create something you can review, correct, and take with you.</p>
                  <ul className="home-output__artifact-list">
                    <li>Working brief</li>
                    <li>Decision checklist</li>
                    <li>Comparison</li>
                    <li>Evidence request</li>
                  </ul>
                </li>
                <li>
                  <div className="home-output__card-head">
                    <span className="home-output__number" aria-hidden="true">03</span>
                    <small>Evidence stays visible</small>
                  </div>
                  <h3>Show possible people or resources</h3>
                  <p>Show why each option connects to what you told us, along with gaps and limits.</p>
                  <div className="home-output__proof-lines" aria-label="Example evidence boundaries">
                    <span>Why it may fit</span>
                    <span>What is known</span>
                    <span>What still needs proof</span>
                  </div>
                </li>
              </ol>
            </div>

            <div className="home-output__actions">
              <Link className="button button-dark" href="/bellows/intake">
                Start with your situation
              </Link>
              <Link className="button button-outline" href="/proof">
                See how proof works
              </Link>
              <p>Options, not outcomes. Nothing is contacted, verified, approved, or sent here.</p>
            </div>
          </WorkshopBandPanel>
        </section>

        <section id="how" className="manifesto" aria-labelledby="howTitle">
          <WorkshopBandPanel tone="workshop" layout="split" atmosphere={false}>
            <div>
              <p className="eyebrow">{copy.howItWorks.eyebrow}</p>
              <h2 id="howTitle">{copy.howItWorks.headline}</h2>
              <p className="how-steps-note">Stylized previews — tap any step to see the real thing.</p>
            </div>
            <div className="how-steps">
              {copy.howItWorks.steps.map((step, index) => {
                const demo = howStepDemos[index];
                return (
                  <article key={step.title} className={workshopFacets[stepFacets[index] ?? "blueprint"]}>
                    <SiteIcon icon={homeStepIcons[index] ?? "step-dossier"} size="lg" className="how-step-icon" />
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.body}</p>
                      {demo ? (
                        <>
                          {demo.mock}
                          <Link className="how-step-cta" href={demo.href}>
                            {demo.cta} <span aria-hidden="true">→</span>
                          </Link>
                        </>
                      ) : null}
                    </div>
                  </article>
                );
              })}
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

      </main>

      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
