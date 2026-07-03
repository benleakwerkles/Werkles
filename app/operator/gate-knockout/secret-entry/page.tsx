import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productGateSecretEntryItems } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Secret Entry Checklist | Werkles",
  description: "Names-only private environment entry checklist for Werkles Human Gates.",
  robots: { index: false, follow: false }
};

export default function SecretEntryChecklistPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Secret entry navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/preflight">Preflight Matrix</Link>
          <Link href="/operator/gate-knockout/decision-packet">Decision Packet</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Names only</p>
            <h1>Secret Entry Checklist</h1>
          </div>
          <p>
            This page lists names, destinations, and proof rules only. Ben enters values privately in the hosting or
            provider console. Agents must not request, read, print, save, or commit secret values.
          </p>
          <div className="gate-list" aria-label="Secret entry hard stops">
            <span>No values in chat</span>
            <span>No values in files</span>
            <span>No values in receipts</span>
            <span>No values in commits</span>
          </div>
        </section>

        <section className="crucible-state-grid" aria-label="Secret entry items">
          {productGateSecretEntryItems.map((item) => (
            <article className="ops-card crucible-state-card" key={item.name}>
              <p className="eyebrow">{item.destination}</p>
              <h2>{item.name}</h2>
              <p>{item.purpose}</p>
              <p className="muted">{item.valueRule}</p>
              <p className="status-line">Proof: {item.proof}</p>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
