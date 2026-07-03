import Link from "next/link";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { routeAtmosphere } from "@/lib/workshop-facets";

export default function OperatorIndexPage() {
  return (
    <CockpitShell>
      <main className={`dashboard-main operator-page ${routeAtmosphere.dashboard}`}>
        <nav className="dashboard-nav" aria-label="Operator navigation">
          <Link href="/">Werkles</Link>
          <Link href="/thinkit">ThinkIt</Link>
          <Link href="/operator/kind-sir">Kind Sir Ops</Link>
        </nav>

        <section className="membership-hero operator-hero">
          <p className="eyebrow">Operator bench</p>
          <h1>Work that should not be mixed into the public pitch.</h1>
          <p>Internal surfaces for compliance readbacks, build handoffs, and post-payment proof checks.</p>
        </section>

        <section className="operations-grid__cards">
          <article className="ops-card">
            <div className="card-heading">
              <p>SkyPooka</p>
              <h2>Mobile Nerdkle field console</h2>
            </div>
            <p>Thumb-first operator view for relay cards, gates, blockers, and safe mobile Nerdkle intake.</p>
            <Link className="button button-outline" href="/skypooka">Open SkyPooka</Link>
          </article>
          <article className="ops-card">
            <div className="card-heading">
              <p>Kind Sir</p>
              <h2>Compliance and site finishing queue</h2>
            </div>
            <p>Georgia SOS status, payment readback, and KindSir.com hygiene live here.</p>
            <Link className="button button-outline" href="/operator/kind-sir">Open Kind Sir Ops</Link>
          </article>
        </section>
      </main>
    </CockpitShell>
  );
}
