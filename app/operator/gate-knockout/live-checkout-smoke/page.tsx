import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productGateLiveCheckoutSmokeSteps } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Live Checkout Smoke | Werkles",
  description: "First live checkout smoke plan for Werkles Human Gates.",
  robots: { index: false, follow: false }
};

export default function LiveCheckoutSmokePage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Live checkout smoke navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/webhook-matrix">Webhook Matrix</Link>
          <Link href="/operator/gate-knockout/recap">Session Recap</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Last Stripe money switch</p>
            <h1>Live Checkout Smoke Plan</h1>
          </div>
          <p>
            This is the first-live-transaction checklist. It is not permission to run a payment. Use it only after live
            products, private secret entry, live webhooks, and the exact live checkout phrase are complete.
          </p>
          <div className="gate-list" aria-label="Live checkout smoke hard stops">
            <span>Requires APPROVE PAID CHECKOUT GO-LIVE</span>
            <span>Ben handles payment details</span>
            <span>Webhook proof required</span>
            <span>No manual state patching</span>
          </div>
        </section>

        <section className="ops-card" aria-label="Live checkout smoke steps">
          <div className="card-heading">
            <p>Sequence</p>
            <h2>First Live Transaction Proof Plan</h2>
          </div>
          <div className="crucible-state-grid">
            {productGateLiveCheckoutSmokeSteps.map((step) => (
              <article className="crucible-state-card" key={step.order}>
                <p className="eyebrow">Step {step.order} - {step.actor}</p>
                <h3>{step.title}</h3>
                <p>Proof: {step.proof}</p>
                <p className="status-line">Must not do: {step.mustNotDo}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </CockpitShell>
  );
}
