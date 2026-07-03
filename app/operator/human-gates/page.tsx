import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productGateOperatorSurfaces } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Human Gate Hub | Werkles",
  description: "Operator hub for Werkles product Human Gate surfaces.",
  robots: { index: false, follow: false }
};

export default function HumanGateHubPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Human Gate hub navigation">
          <Link href="/pricing">Pricing</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Operator hub</p>
            <h1>Product Human Gates</h1>
          </div>
          <p>
            This is the local index for Werkles payment, provider, background-check, and production gates. It is
            review-only and does not approve or perform any live action.
          </p>
          <div className="gate-list" aria-label="Hub boundaries">
            <span>No secrets</span>
            <span>No live Stripe actions</span>
            <span>No provider sessions</span>
            <span>No background checks</span>
            <span>No production rollout</span>
          </div>
        </section>

        <section className="crucible-state-grid" aria-label="Human Gate operator surfaces">
          {productGateOperatorSurfaces.map((surface) => (
            <article className="ops-card crucible-state-card" key={surface.href}>
              <h2>{surface.title}</h2>
              <p>{surface.purpose}</p>
              <p className="muted">Use when: {surface.useWhen}</p>
              <p>
                <Link className="button button-outline" href={surface.href}>
                  Open {surface.title}
                </Link>
              </p>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
