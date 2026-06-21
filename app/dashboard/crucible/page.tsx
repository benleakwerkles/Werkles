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
      </main>
    </CockpitShell>
  );
}
