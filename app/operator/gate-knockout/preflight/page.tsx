import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productGatePreflightMatrix } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Gate Preflight Matrix | Werkles",
  description: "Route, environment-name, provider, and production preflight matrix for Werkles Human Gates.",
  robots: { index: false, follow: false }
};

export default function GatePreflightPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Gate preflight navigation">
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/dependencies">Dependencies</Link>
          <Link href="/operator/gate-knockout/decision-packet">Decision Packet</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/membership">Foundry</Link>
          <Link href="/dashboard/crucible">Crucible</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Operator preflight</p>
            <h1>Gate Preflight Matrix</h1>
          </div>
          <p>
            Use this before a Gate Knockout session to prove routes, environment variable names, provider readiness,
            and production stops. Values stay private: this page names required fields only.
          </p>
          <div className="gate-list" aria-label="Preflight hard stops">
            <span>No secret values</span>
            <span>No provider PII</span>
            <span>No background-check artifacts</span>
            <span>No production mutation</span>
          </div>
        </section>

        <section className="crucible-state-grid" aria-label="Route preflight checks">
          {productGatePreflightMatrix.routeChecks.map((check) => (
            <article className="ops-card crucible-state-card" key={check.key}>
              <p className="eyebrow">Route proof</p>
              <h2>{check.label}</h2>
              <p>{check.proof}</p>
              <p className="muted">Gate keys: {check.gateKeys.join(", ")}</p>
              <p className="status-line">Stop if missing: {check.stopIfMissing}</p>
            </article>
          ))}
        </section>

        <section className="ops-card" aria-label="Stripe environment name matrix">
          <div className="card-heading">
            <p>Names only</p>
            <h2>Stripe Environment Names</h2>
          </div>
          <p>
            These are the names operators may point to. Ben enters private values outside chat and outside the repo.
          </p>
          <div className="pricing-table" aria-label="Stripe environment variables">
            <span>Name</span>
            <span>Purpose</span>
            <span>Source</span>
            {productGatePreflightMatrix.envNames.map((envName) => (
              <div className="pricing-row" key={envName.name}>
                <strong>{envName.name}</strong>
                <span>{envName.secretValue ? `${envName.purpose} Secret value: Ben-only.` : envName.purpose}</span>
                <span>{envName.source}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="crucible-state-grid" aria-label="Provider and policy preflight">
          {productGatePreflightMatrix.providerChecks.map((check) => (
            <article className="ops-card crucible-state-card" key={check.key}>
              <p className="eyebrow">Provider/policy proof</p>
              <h2>{check.label}</h2>
              <p>{check.proof}</p>
              <p className="muted">Gate keys: {check.gateKeys.join(", ")}</p>
              <p className="status-line">Stop if missing: {check.stopIfMissing}</p>
            </article>
          ))}
        </section>

        <section className="crucible-state-grid" aria-label="Production preflight">
          {productGatePreflightMatrix.productionChecks.map((check) => (
            <article className="ops-card crucible-state-card" key={check.key}>
              <p className="eyebrow">Production proof</p>
              <h2>{check.label}</h2>
              <p>{check.proof}</p>
              <p className="muted">Gate keys: {check.gateKeys.join(", ")}</p>
              <p className="status-line">Stop if missing: {check.stopIfMissing}</p>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
