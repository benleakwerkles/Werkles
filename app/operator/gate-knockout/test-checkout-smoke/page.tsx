import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import {
  productGateTestCheckoutPreflight,
  productGateTestCheckoutSmokeSteps
} from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Test Checkout Smoke | Werkles",
  description: "Gate 1 test-mode checkout and webhook proof checklist for Werkles Human Gates.",
  robots: { index: false, follow: false }
};

export default function TestCheckoutSmokePage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Test checkout smoke navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/webhook-matrix">Webhook Matrix</Link>
          <Link href="/operator/gate-knockout/scorecard">Scorecard</Link>
          <Link href="/membership">Membership</Link>
        </nav>

        <section className="ops-card" aria-label="Before you click checkout">
          <div className="card-heading">
            <p>Read first</p>
            <h1>Before you click Pay</h1>
          </div>
          <p>
            If you already clicked — stop and verify webhook + billing state anyway. If you have not — do these steps
            before opening Stripe Checkout.
          </p>
          <ol>
            {productGateTestCheckoutPreflight.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p className="status-line">
            Runbook:{" "}
            <Link href="/operator/gate-knockout/webhook-matrix">Webhook Matrix</Link> ·{" "}
            <Link href="https://dashboard.stripe.com/test/webhooks" rel="noreferrer">
              Stripe test webhooks
            </Link>
          </p>
        </section>

        <section className="ops-card">
          <div className="card-heading">
            <p>Active Gate 1</p>
            <h2>Test Checkout Smoke Plan</h2>
          </div>
          <p>
            Tier-A env is 8/8 and test checkout is unpaused. Use the checklist below to prove webhook-backed membership
            state before Ben gives the test-mode gate phrase. Stripe test keys only — not live money.
          </p>
          <div className="gate-list" aria-label="Test checkout smoke hard stops">
            <span>Requires APPROVE PAID CHECKOUT GO-LIVE (test mode)</span>
            <span>Webhook proof required</span>
            <span>Ben handles test payment</span>
            <span>No live Stripe keys</span>
          </div>
        </section>

        <section className="ops-card" aria-label="Test checkout smoke steps">
          <div className="card-heading">
            <p>Sequence</p>
            <h2>Test Checkout + Webhook Proof Plan</h2>
          </div>
          <div className="crucible-state-grid">
            {productGateTestCheckoutSmokeSteps.map((step) => (
              <article className="crucible-state-card" key={step.order}>
                <p className="eyebrow">
                  Step {step.order} - {step.actor}
                </p>
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
