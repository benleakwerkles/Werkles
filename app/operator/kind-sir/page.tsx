import Link from "next/link";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { kindSirOps } from "@/lib/kind-sir-ops";
import { routeAtmosphere } from "@/lib/workshop-facets";

function statusTone(status: string) {
  return status === "Active/Compliance" ? "status-pill status-pill--good" : "status-pill status-pill--warn";
}

export default function KindSirOperatorPage() {
  const openCount = kindSirOps.entities.filter((entity) => entity.status === "Active/Noncompliance").length;
  const clearCount = kindSirOps.entities.length - openCount;

  return (
    <CockpitShell>
      <main className={`dashboard-main operator-page kind-sir-ops-page ${routeAtmosphere.dashboard}`}>
        <nav className="dashboard-nav" aria-label="Kind Sir operator navigation">
          <Link href="/operator">Operator</Link>
          <Link href="/">Werkles</Link>
          <Link href="/thinkit">ThinkIt</Link>
          <a href={kindSirOps.source.searchUrl}>GA eCorp</a>
        </nav>

        <section className="membership-hero operator-hero">
          <p className="eyebrow">Kind Sir operations</p>
          <h1>SOS payment made. Green readback still has to arrive.</h1>
          <p>
            The Georgia record for <strong>{kindSirOps.paymentStatus.entity}</strong> was noncompliant before payment.
            Treat the entity as paid-but-pending until eCorp shows 2026 and Active/Compliance.
          </p>
        </section>

        <section className="operator-summary-grid" aria-label="Kind Sir compliance summary">
          <article className="ops-card operator-metric-card">
            <p className="plan-kicker">Needs readback or action</p>
            <h2>{openCount}</h2>
            <p>Entities still recorded as Active/Noncompliance in the last official lookup.</p>
          </article>
          <article className="ops-card operator-metric-card">
            <p className="plan-kicker">Already compliant</p>
            <h2>{clearCount}</h2>
            <p>Entities whose last annual registration year already reads 2026.</p>
          </article>
          <article className="ops-card operator-metric-card">
            <p className="plan-kicker">Paid entity</p>
            <h2>{kindSirOps.paymentStatus.controlNumber}</h2>
            <p>{kindSirOps.paymentStatus.readbackState}: {kindSirOps.paymentStatus.nextCheck}</p>
          </article>
        </section>

        <section className="ops-card operator-readback-card">
          <div className="card-heading">
            <p>Official lookup notes</p>
            <h2>Do not call it safe until the state record changes.</h2>
          </div>
          <div className="gate-list" aria-label="Kind Sir readback notes">
            {kindSirOps.notes.map((note) => (
              <span key={note}>{note}</span>
            ))}
          </div>
          <div className="operator-link-row">
            <a className="button button-outline" href={kindSirOps.source.annualRegistrationGuide}>
              Annual registration guide
            </a>
            <a className="button button-outline" href={kindSirOps.source.renewLlcGuide}>
              Renew LLC guide
            </a>
          </div>
        </section>

        <section className="ops-card operator-table-card">
          <div className="card-heading">
            <p>Georgia SOS entity queue</p>
            <h2>Current Kind Sir readback table</h2>
          </div>
          <div className="operator-table-wrap">
            <table className="operator-table">
              <thead>
                <tr>
                  <th scope="col">Entity</th>
                  <th scope="col">Control</th>
                  <th scope="col">Status</th>
                  <th scope="col">Last AR</th>
                  <th scope="col">Next move</th>
                </tr>
              </thead>
              <tbody>
                {kindSirOps.entities.map((entity) => (
                  <tr key={entity.controlNumber}>
                    <td>{entity.name}</td>
                    <td>{entity.controlNumber}</td>
                    <td><span className={statusTone(entity.status)}>{entity.status}</span></td>
                    <td>{entity.lastAnnualRegistrationYear}</td>
                    <td>{entity.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="operator-summary-grid" aria-label="KindSir.com finishing queue">
          {kindSirOps.kindSirDotComQueue.map((item) => (
            <article className="ops-card" key={item.title}>
              <div className="card-heading">
                <p>Kindsir.com</p>
                <h2>{item.title}</h2>
              </div>
              <p>{item.body}</p>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
