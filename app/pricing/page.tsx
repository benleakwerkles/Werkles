import Link from "next/link";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { Tier2PageVisual } from "@/components/foundry/tier2-page-visual";
import { PricingTable } from "@/components/pricing/pricing-table";
import { copy } from "@/lib/copy";
import { pricing } from "@/lib/pricing";
import { routeAtmosphere } from "@/lib/workshop-facets";

export default function PricingPage() {
  return (
    <CockpitShell>
      <main className={`dashboard-main pricing-page ${routeAtmosphere.pricing}`}>
      <nav className="dashboard-nav" aria-label="Pricing navigation">
        <Link href="/">Home</Link>
        <Link href="/membership">Foundry Dues</Link>
        <Link href="/proof">Proof</Link>
        <Link href="/signup">Enter the Foundry</Link>
      </nav>

      <section className="tier2-page-header tier2-page-header--stack">
        <div className="tier2-page-header__copy membership-hero pricing-hero">
          <p className="eyebrow">{copy.pricing.eyebrow}</p>
          <h1>{copy.pricing.headline}</h1>
          <p>{copy.pricing.subhead} Source of truth: {pricing.source}.</p>
        </div>
      </section>

      <div className="tier2-visual-band">
        <Tier2PageVisual page="pricing" featured forgeBand iconRail />
      </div>

      <PricingTable />
      </main>
    </CockpitShell>
  );
}
