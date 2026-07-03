import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/foundry/site-header";
import { ArchetypeCardSystem } from "@/components/archetypes";
import { copy } from "@/lib/copy";

export const metadata: Metadata = {
  title: "Archetype Card System | Werkles",
  description: "Canonical six archetype cards for Spark, Builder, Operator, Worker, Connector, and Backer.",
  robots: { index: false, follow: false }
};

export default function ArchetypesPage() {
  return (
    <>
      <SiteHeader />
      <main className="archetype-preview-main">
        <section className="ops-card" style={{ margin: "1rem auto", maxWidth: "960px" }}>
          <div className="card-heading">
            <p>Lane cards</p>
            <h2>Six archetypes. One floor.</h2>
          </div>
          <p>
            Spark, Builder, Operator, Worker, Connector, and Backer share the same membership — lane choice shapes
            profile and onboarding, not price.
          </p>
          <div className="member-selected-surface__actions">
            <Link className="button button-dark" href="/onboarding">
              Pick your lane
            </Link>
            <Link className="button button-outline" href="/signup">
              Start free
            </Link>
            <Link className="button button-outline" href="/formation">
              Formation act
            </Link>
          </div>
        </section>
        <ArchetypeCardSystem />
      </main>
      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
