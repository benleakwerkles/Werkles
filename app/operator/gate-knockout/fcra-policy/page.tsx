import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productGateFcraPolicyItems } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "FCRA Policy Gate | Werkles",
  description: "Background-check and FCRA policy blockers for Werkles Human Gates.",
  robots: { index: false, follow: false }
};

export default function FcraPolicyGatePage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="FCRA policy navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/provider-scope">Provider Scope</Link>
          <Link href="/operator/gate-knockout/risks">Risk Register</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Policy blocked</p>
            <h1>FCRA Policy Gate</h1>
          </div>
          <p>
            Background checks stay closed until counsel/provider proof exists. This page makes the missing policy
            artifacts explicit so local product work can continue without collecting consent or starting checks.
          </p>
          <div className="gate-list" aria-label="FCRA policy hard stops">
            <span>No consent collection</span>
            <span>No report orders</span>
            <span>No pass/fail labels</span>
            <span>No result storage</span>
          </div>
        </section>

        <section className="crucible-state-grid" aria-label="FCRA policy items">
          {productGateFcraPolicyItems.map((item) => (
            <article className="ops-card crucible-state-card" key={item.topic}>
              <p className="eyebrow">{item.owner}</p>
              <h2>{item.topic}</h2>
              <p>Required proof: {item.requiredProof}</p>
              <p className="status-line">Blocked action: {item.blockedAction}</p>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
