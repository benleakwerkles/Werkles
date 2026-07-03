import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productStripeBlockedSteps } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Stripe Blocker | Werkles",
  description: "Operator blocker page for Stripe login/password issues.",
  robots: { index: false, follow: false }
};

export default function StripeBlockedPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Stripe blocker navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/stripe-offline">Stripe Offline Prep</Link>
          <Link href="/operator/gate-knockout/provider-queue">Provider Queue</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>External blocker</p>
            <h1>Stripe Login Blocked</h1>
          </div>
          <p>
            Stripe password, passkey, 2FA, and account recovery are Ben-only Human Gates. While access is blocked,
            keep preparing local proof and product mapping, but do not mark any live Stripe gate as passed.
          </p>
          <div className="gate-list" aria-label="Stripe blocked hard stops">
            <span>No credentials in chat</span>
            <span>No recovery codes</span>
            <span>No live price IDs invented</span>
            <span>No production rollout</span>
          </div>
        </section>

        <section className="crucible-state-grid" aria-label="Stripe blocked next actions">
          {productStripeBlockedSteps.map((step) => (
            <article className="ops-card crucible-state-card" key={step.title}>
              <h2>{step.title}</h2>
              <p>{step.action}</p>
              <p className="status-line">Must not do: {step.mustNotDo}</p>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
