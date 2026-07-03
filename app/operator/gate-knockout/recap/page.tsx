import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productGateRecapSections } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Gate Session Recap | Werkles",
  description: "Post-session recap template for Werkles product Human Gates.",
  robots: { index: false, follow: false }
};

export default function GateRecapPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Gate recap navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/decision-packet">Decision Packet</Link>
          <Link href="/operator/gate-knockout/handoff">Handoff</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>After Ben decides</p>
            <h1>Gate Session Recap</h1>
          </div>
          <p>
            Fill this after the gate session. It separates what passed, what stayed blocked, what was scoped out, and
            what must happen before the next session.
          </p>
        </section>

        <section className="crucible-state-grid" aria-label="Gate recap template">
          {productGateRecapSections.map((section) => (
            <article className="ops-card crucible-state-card" key={section.title}>
              <h2>{section.title}</h2>
              <ul>
                {section.fields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
