import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productGateWebhookEvents } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Webhook Matrix | Werkles",
  description: "Stripe webhook event proof matrix for Werkles Human Gates.",
  robots: { index: false, follow: false }
};

export default function WebhookMatrixPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Webhook matrix navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/stripe-blocked">Stripe Blocker</Link>
          <Link href="/operator/gate-knockout/live-checkout-smoke">Live Checkout Smoke</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Webhook source of truth</p>
            <h1>Stripe Webhook Matrix</h1>
          </div>
          <p>
            Checkout success is not enough. Membership and billing state must be backed by Stripe webhook events in the
            correct mode before a checkout gate can pass.
          </p>
          <div className="gate-list" aria-label="Webhook matrix hard stops">
            <span>Test proof before live proof</span>
            <span>Webhook before membership state</span>
            <span>Redact customer/payment identifiers</span>
            <span>Stop if mode is ambiguous</span>
          </div>
        </section>

        <section className="crucible-state-grid" aria-label="Webhook event matrix">
          {productGateWebhookEvents.map((event) => (
            <article className="ops-card crucible-state-card" key={`${event.mode}:${event.eventName}`}>
              <p className="eyebrow">{event.mode.toUpperCase()} mode</p>
              <h2>{event.eventName}</h2>
              <p>{event.purpose}</p>
              <p className="muted">Required for: {event.requiredFor.join(", ")}</p>
              <p>Proof: {event.proof}</p>
              <p className="status-line">Stop if missing: {event.stopIfMissing}</p>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
