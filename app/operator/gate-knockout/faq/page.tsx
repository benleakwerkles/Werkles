import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productGateFaqs } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Gate FAQ | Werkles",
  description: "Operator FAQ for Werkles product Human Gates.",
  robots: { index: false, follow: false }
};

export default function GateFaqPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Gate FAQ navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/scorecard">Scorecard</Link>
          <Link href="/operator/gate-knockout/decision-packet">Decision Packet</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Operator troubleshooting</p>
            <h1>Gate FAQ</h1>
          </div>
          <p>
            Use this when a gate phrase, proof boundary, or scope decision is unclear. If a question involves secrets,
            provider PII, background-check artifacts, or production mutation, stop.
          </p>
        </section>

        <section className="crucible-state-grid" aria-label="Gate FAQ list">
          {productGateFaqs.map((faq) => (
            <article className="ops-card crucible-state-card" key={faq.question}>
              <h2>{faq.question}</h2>
              <p>{faq.answer}</p>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
