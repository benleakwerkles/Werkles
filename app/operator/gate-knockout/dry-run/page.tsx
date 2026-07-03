import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productGateDryRunSteps } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Gate Dry Run | Werkles",
  description: "Local-only dry-run checklist for Werkles product Human Gates.",
  robots: { index: false, follow: false }
};

export default function GateDryRunPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Gate dry run navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/preflight">Preflight Matrix</Link>
          <Link href="/operator/gate-knockout/decision-packet">Decision Packet</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Local rehearsal</p>
            <h1>Gate Dry Run</h1>
          </div>
          <p>
            Walk these routes before asking for any live gate phrase. This checklist gathers local proof only; it must not
            create Stripe products, enter secrets, start provider checks, or deploy.
          </p>
          <div className="gate-list" aria-label="Dry-run boundaries">
            <span>Local preview only</span>
            <span>Mock/test proof only</span>
            <span>No live payment</span>
            <span>No provider session</span>
            <span>No production action</span>
          </div>
        </section>

        <section className="crucible-state-grid" aria-label="Gate dry-run checklist">
          {productGateDryRunSteps.map((step) => (
            <article className="ops-card crucible-state-card" key={step.order}>
              <p className="eyebrow">Step {step.order}</p>
              <h2>{step.title}</h2>
              <p>
                Route: <Link href={step.route}>{step.route}</Link>
              </p>
              <p>{step.proof}</p>
              <p className="status-line">Must not do: {step.mustNotDo}</p>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
