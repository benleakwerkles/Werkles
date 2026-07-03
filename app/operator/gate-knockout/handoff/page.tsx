import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productGateHandoffItems } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Gate Handoff | Werkles",
  description: "Ben handoff packet for Werkles product Human Gates.",
  robots: { index: false, follow: false }
};

export default function GateHandoffPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Gate handoff navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/risks">Risk Register</Link>
          <Link href="/operator/gate-knockout/recap">Session Recap</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Ben-ready packet</p>
            <h1>Gate Handoff</h1>
          </div>
          <p>
            Use this when the site is almost ready for Ben to pass Human Gates. If any item below cannot be opened or
            understood, the gate session is not ready yet.
          </p>
        </section>

        <section className="crucible-state-grid" aria-label="Gate handoff checklist">
          {productGateHandoffItems.map((item) => (
            <article className="ops-card crucible-state-card" key={item.title}>
              <h2>{item.title}</h2>
              <p>{item.detail}</p>
              <p>
                <Link className="button button-outline" href={item.route}>
                  Open {item.route}
                </Link>
              </p>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
