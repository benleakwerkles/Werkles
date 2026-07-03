import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productGateProviderScopeItems } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Provider Test Scope | Werkles",
  description: "Provider test scope and stop conditions for Werkles Human Gates.",
  robots: { index: false, follow: false }
};

export default function ProviderScopePage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Provider scope navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/provider-queue">Provider Queue</Link>
          <Link href="/operator/gate-knockout/fcra-policy">FCRA Policy</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Provider prep only</p>
            <h1>Provider Test Scope</h1>
          </div>
          <p>
            This page defines what provider prep is allowed before Ben approves identity, funds, phone, or background
            provider work. It does not authorize account login, credential entry, paid sessions, or live checks.
          </p>
          <div className="gate-list" aria-label="Provider scope hard stops">
            <span>No provider credentials</span>
            <span>No paid/live sessions</span>
            <span>No applicant PII</span>
            <span>No clearance claims</span>
          </div>
        </section>

        <section className="crucible-state-grid" aria-label="Provider scope items">
          {productGateProviderScopeItems.map((item) => (
            <article className="ops-card crucible-state-card" key={item.provider}>
              <p className="eyebrow">{item.provider}</p>
              <h2>{item.scope}</h2>
              <p>Allowed prep: {item.allowedPrep}</p>
              <p className="muted">Approval needed: {item.approvalNeeded}</p>
              <p className="status-line">Stop condition: {item.stopCondition}</p>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
