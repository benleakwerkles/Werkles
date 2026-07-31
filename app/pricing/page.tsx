import { isFoundryDuesCheckoutPaused } from "@/lib/app-infra-preview";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { SiteHeader } from "@/components/foundry/site-header";
import { Tier2PageVisual } from "@/components/foundry/tier2-page-visual";
import { PricingTable } from "@/components/pricing/pricing-table";
import { copy } from "@/lib/copy";
import { routeAtmosphere } from "@/lib/workshop-facets";

export const metadata = {
  title: "Pricing",
  description: "One floor, clear prices. Free to start; Foundry Dues from $9.99/month when the workshop earns it."
};

export default function PricingPage() {
  const checkoutPaused = isFoundryDuesCheckoutPaused();

  return (
    <CockpitShell>
      {/* Public page wears the standard header (owner walkthrough); the
         repo-path "source of truth" line and operator test-mode status were
         internal copy on a public surface — QA sweep 2026-07-29. */}
      <SiteHeader />
      <main className={`dashboard-main pricing-page ${routeAtmosphere.pricing}`}>

      {checkoutPaused ? (
        <section className="ops-card pricing-section" aria-label="Pricing note">
          <p className="muted">
            Foundry Dues checkout is paused while payment setup finishes. Pricing stays visible so you can compare
            plans before dues return.
          </p>
        </section>
      ) : null}

      <section className="tier2-page-header tier2-page-header--stack">
        <div className="tier2-page-header__copy membership-hero pricing-hero">
          <p className="eyebrow">{copy.pricing.eyebrow}</p>
          <h1>{copy.pricing.headline}</h1>
          <p>{copy.pricing.subhead}</p>
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
