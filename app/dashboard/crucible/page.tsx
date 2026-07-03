import Link from "next/link";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { Tier2PageVisual } from "@/components/foundry/tier2-page-visual";
import { CruciblePanel } from "@/components/crucible/crucible-panel";
import { copy } from "@/lib/copy";
import { routeAtmosphere } from "@/lib/workshop-facets";

export default function CruciblePage() {
  return (
    <CockpitShell>
      <main className={`dashboard-main ${routeAtmosphere.crucible}`}>
      <nav className="dashboard-nav" aria-label="Crucible navigation">
        <Link href="/dashboard">{copy.nav.workbench}</Link>
        <Link href="/dashboard/profile">Profile</Link>
        <Link href="/dashboard/billing">{copy.nav.billing}</Link>
        <Link href="/pricing">{copy.nav.pricing}</Link>
      </nav>
      <div className="tier2-visual-band">
        <Tier2PageVisual page="crucible" forgeBand iconRail />
      </div>
      <CruciblePanel />

      <section className="ops-card" aria-label="How Crucible checks work">
        <div className="card-heading">
          <p>How to read checks</p>
          <h2>Optional verification. Visible signal. No fake trust.</h2>
        </div>
        <p>
          Crucible checks are separate from Foundry Dues. They show what was inspected, not what Werkles wishes were
          true. Start with profile context, then add checks only when the work actually needs them.
        </p>
        <div className="trust-state-strip" aria-label="Crucible member rules">
          <span>Checks are optional</span>
          <span>Signal stays visible</span>
          <span>No guarantee language</span>
        </div>
        <div className="member-selected-surface__actions">
          <Link className="button button-outline" href="/dashboard/profile">
            Update profile
          </Link>
          <Link className="button button-outline" href="/pricing">
            See check pricing
          </Link>
          <Link className="button button-outline" href="/proof">
            Inspect proof doctrine
          </Link>
        </div>
      </section>
      </main>
    </CockpitShell>
  );
}
