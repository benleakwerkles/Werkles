import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productGateRolloutReadinessItems } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Rollout Readiness | Werkles",
  description: "Production rollout and rollback readiness checklist for Werkles Human Gates.",
  robots: { index: false, follow: false }
};

export default function RolloutReadinessPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Rollout readiness navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/live-checkout-smoke">Live Checkout Smoke</Link>
          <Link href="/operator/gate-knockout/decision-packet">Decision Packet</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Last gate only</p>
            <h1>Rollout Readiness</h1>
          </div>
          <p>
            Production rollout for tier-A env custody completed 2026-07-05. Use this page for rollback notes and any
            future rollout — live Stripe and lane merges stay gated.
          </p>
          <div className="gate-list" aria-label="Rollout readiness hard stops">
            <span>Tier-A env redeploy: completed 2026-07-05</span>
            <span>Live Stripe keys still gated</span>
            <span>No deploy from local prep without new phrase</span>
            <span>No SQL mutation</span>
            <span>Rollback note required for future rollouts</span>
          </div>
        </section>

        <section className="crucible-state-grid" aria-label="Rollout readiness items">
          {productGateRolloutReadinessItems.map((item) => (
            <article className="ops-card crucible-state-card" key={item.title}>
              <h2>{item.title}</h2>
              <p>Proof: {item.proof}</p>
              <p>Rollback: {item.rollback}</p>
              <p className="status-line">Stop condition: {item.stopCondition}</p>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
