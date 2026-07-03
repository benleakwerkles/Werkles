import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productProviderConsoleLinks } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Provider Queue | Werkles",
  description: "External provider console queue for Werkles Human Gates.",
  robots: { index: false, follow: false }
};

export default function ProviderQueuePage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Provider queue navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/stripe-blocked">Stripe Blocker</Link>
          <Link href="/operator/gate-knockout/risks">Risk Register</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>External consoles</p>
            <h1>Provider Queue</h1>
          </div>
          <p>
            These are the actual provider dashboards for the gates. Opening them is fine; logging in, entering secrets,
            creating live products, starting provider sessions, or approving production remains Ben-only.
          </p>
        </section>

        <section className="crucible-state-grid" aria-label="Provider console links">
          {productProviderConsoleLinks.map((link) => (
            <article className="ops-card crucible-state-card" key={`${link.provider}:${link.title}`}>
              <p className="eyebrow">{link.provider}</p>
              <h2>{link.title}</h2>
              <p>{link.purpose}</p>
              <p className="muted">Gate: {link.gate}</p>
              <p className="status-line">Blocked by: {link.blockedBy}</p>
              <p>
                <a className="button button-outline" href={link.url} rel="noreferrer">
                  Open provider console
                </a>
              </p>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
