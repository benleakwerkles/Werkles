import Link from "next/link";
import { DiscoveryIntakeForm } from "./discovery-intake-form";
import { PublicTrustFooter } from "@/components/foundry/public-trust-footer";
import { SiteHeader } from "@/components/foundry/site-header";
import { SiteIcon } from "@/components/foundry/site-icon";
import { routeAtmosphere } from "@/lib/workshop-facets";

const deliverySections = [
  "What you asked for",
  "What we heard underneath it",
  "Visible reasons",
  "One recommendation",
  "Why not the alternatives",
  "What would change this"
];

export default function DiscoveryPage() {
  return (
    <>
      <SiteHeader />
      <main className={`discovery-page ${routeAtmosphere.home}`}>
        <section className="discovery-hero" aria-labelledby="discoveryTitle">
          <div>
            <p className="eyebrow">Werkles discovery intake</p>
            <h1 id="discoveryTitle">Review the questions that help Werkles understand where you are.</h1>
            <p>
              Submission is temporarily closed while secure account storage is being connected. Nothing you type
              here is saved or sent.
            </p>
            <div className="hero-actions">
              <Link className="button button-light" href="#intake">Review the questions</Link>
              <Link className="button button-ghost" href="#what-comes-back">See what a reviewer returns</Link>
            </div>
          </div>
          <aside className="discovery-hero__panel" aria-label="Human-operated promise">
            <SiteIcon icon="icon-dossier" size="lg" />
            <strong>Human review required</strong>
            <p>No personal recommendation, introduction, or automatic contact is created from this closed form.</p>
          </aside>
        </section>

        <section id="intake" className="discovery-layout" aria-label="Discovery intake form">
          <article className="discovery-card discovery-card--form">
            <div className="card-heading">
              <p>Your starting point</p>
              <h2>Tell us where things stand.</h2>
            </div>
            <DiscoveryIntakeForm />
          </article>

          <aside id="what-comes-back" className="discovery-card discovery-card--sticky">
            <div className="card-heading">
              <p>What comes back</p>
              <h2>One recommendation card</h2>
            </div>
            <p>
              A reviewer turns the intake into a short card. The card is not a verdict on you, and Werkles is not vouching
              for anyone. It is a reasoned next path based on what you shared.
            </p>
            <ol className="discovery-delivery-list">
              {deliverySections.map((section) => (
                <li key={section}>{section}</li>
              ))}
            </ol>
          </aside>
        </section>
      </main>
      <PublicTrustFooter />
    </>
  );
}
