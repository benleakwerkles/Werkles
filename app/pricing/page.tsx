import Link from "next/link";
import { isFoundryDuesCheckoutPaused } from "@/lib/app-infra-preview";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { Tier2PageVisual } from "@/components/foundry/tier2-page-visual";
import { PricingTable } from "@/components/pricing/pricing-table";
import { copy } from "@/lib/copy";
import { pricing } from "@/lib/pricing";
import { routeAtmosphere } from "@/lib/workshop-facets";

export default function PricingPage() {
  const checkoutPaused = isFoundryDuesCheckoutPaused();

  return (
    <CockpitShell>
      <main className={`dashboard-main pricing-page ${routeAtmosphere.pricing}`}>
      <nav className="dashboard-nav" aria-label="Pricing navigation">
        <Link href="/">Home</Link>
        <Link href="/signup">Start free</Link>
        <Link href="/proof">Proof</Link>
        <Link href="/membership">Foundry Dues</Link>
        <Link href="/dashboard">Member home</Link>
      </nav>

      <section className="ops-card pricing-section" aria-label="Pricing note">
        <p className="muted">
          {checkoutPaused
            ? "Foundry Dues checkout is paused while operator payment setup finishes. Pricing stays visible so you can compare plans before dues return."
            : "Test-mode Foundry Dues checkout is open on /membership. Live Stripe keys and live checkout stay gated."}
        </p>
      </section>

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
