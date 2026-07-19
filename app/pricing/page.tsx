import Link from "next/link";
import { isFoundryDuesCheckoutPaused } from "@/lib/app-infra-preview";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { PublicTrustFooter } from "@/components/foundry/public-trust-footer";
import { Tier2PageVisual } from "@/components/foundry/tier2-page-visual";
import { PricingTable } from "@/components/pricing/pricing-table";
import { copy } from "@/lib/copy";
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
            ? "Paid checkout is paused. Compare plans or continue free; live payments remain behind a human gate."
            : "Checkout preview is available. No live payment is taken; live payments remain behind a human gate."}
        </p>
      </section>

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
      <PublicTrustFooter />
    </CockpitShell>
  );
}
