import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { stripeManifest } from "@/lib/stripe-manifest";

export const metadata: Metadata = {
  title: "Stripe Offline Prep | Werkles",
  description: "Offline Stripe product and environment prep for Werkles Human Gates.",
  robots: { index: false, follow: false }
};

export default function StripeOfflinePrepPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Stripe offline prep navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout/stripe-blocked">Stripe Blocker</Link>
          <Link href="/operator/gate-knockout/preflight">Preflight Matrix</Link>
          <Link href="/operator/gate-knockout/decision-packet">Decision Packet</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Names only</p>
            <h1>Stripe Offline Prep</h1>
          </div>
          <p>
            Use this while Stripe login is blocked. These are product names, modes, prices, and environment variable
            names from `lib/stripe-manifest.ts`. This page does not create Stripe products or provide live price IDs.
          </p>
          <div className="gate-list" aria-label="Stripe offline source">
            <span>Source: {stripeManifest.source}</span>
            <span>Version: {stripeManifest.pricingVersion}</span>
            <span>Approved: {stripeManifest.operatorApproved}</span>
          </div>
        </section>

        <section className="ops-card" aria-label="Stripe product manifest">
          <div className="card-heading">
            <p>Product manifest</p>
            <h2>Prepare These In Stripe When Access Returns</h2>
          </div>
          <div className="crucible-state-grid" aria-label="Stripe offline product rows">
            {stripeManifest.products.map((product) => (
              <article className="crucible-state-card" key={product.key}>
                <h3>{product.name}</h3>
                <p>Mode: {product.mode}</p>
                <p>Price: {product.displayPrice}</p>
                <p>Env var: {product.envVar}</p>
              </article>
            ))}
          </div>
          <p className="compliance-note">
            Record live price IDs only after Ben creates or verifies them in Stripe. Never invent IDs.
          </p>
        </section>
      </main>
    </CockpitShell>
  );
}
