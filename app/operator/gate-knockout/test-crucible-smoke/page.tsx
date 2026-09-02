import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { crucibleProviderRuntimeSnapshot } from "@/lib/crucible-provider-runtime";
import {
  productGateCruciblePreflight,
  productGateCrucibleSmokeSteps
} from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Test Crucible Smoke | Werkles",
  description: "Gate 2 Crucible identity and funds provider test checklist for Werkles Human Gates.",
  robots: { index: false, follow: false }
};

export default function TestCrucibleSmokePage() {
  const providerRuntime = crucibleProviderRuntimeSnapshot();
  const plaidConnected = providerRuntime.funds === "available";

  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Test crucible smoke navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/test-checkout-smoke">Test Checkout Smoke</Link>
          <Link href="/dashboard/crucible">Crucible</Link>
          <Link href="/dashboard/profile">Profile</Link>
        </nav>

        <section className="ops-card" aria-label="Before you click crucible checks">
          <div className="card-heading">
            <p>Read first</p>
            <h1>Before you click Crucible checks</h1>
          </div>
          <p>
            If you already clicked — verify profile id_status and funds_status anyway. If you have not — complete Gate 1
            membership proof first, then follow this list.
          </p>
          <ol>
            {productGateCruciblePreflight.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p className="status-line">
            Stripe Identity:{" "}
            <Link href="https://dashboard.stripe.com/test/identity/application" rel="noreferrer">
              test dashboard
            </Link>{" "}
            · Plaid sandbox only
          </p>
        </section>

        <section className="ops-card">
          <div className="card-heading">
            <p>Active Gate 2</p>
            <h2>Crucible Provider Test Smoke Plan</h2>
          </div>
          <p>
            Plaid granted Werkles sandbox access. This runtime {plaidConnected ? "has" : "does not yet have"} the
            sandbox keys connected, and Plaid is still reviewing production access. Link completion remains a demo;
            it does not create a funds proof or save a bank connection.
          </p>
          <div className="gate-list" aria-label="Crucible smoke hard stops">
            <span>Requires active Foundry membership</span>
            <span>APPROVE CRUCIBLE PROVIDER TEST after hands proof</span>
            <span>Sandbox / test mode only</span>
            <span>Background checks stay blocked</span>
          </div>
        </section>

        <section className="ops-card" aria-label="Crucible smoke steps">
          <div className="card-heading">
            <p>Sequence</p>
            <h2>Identity + Funds Proof Plan</h2>
          </div>
          <div className="crucible-state-grid">
            {productGateCrucibleSmokeSteps.map((step) => (
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
