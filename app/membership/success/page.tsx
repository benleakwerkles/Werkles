import Link from "next/link";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { NarrativeJourneyRail } from "@/components/narrative/narrative-journey-rail";
import { Tier2PageVisual } from "@/components/foundry/tier2-page-visual";
import { RouteUnlockBanner } from "@/components/foundry/route-unlock-banner";
import { copy } from "@/lib/copy";
import { routeAtmosphere } from "@/lib/workshop-facets";

type Props = {
  searchParams?: Promise<{ preview?: string; plan?: string }>;
};

export default async function MembershipSuccessPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const isPreview = params?.preview === "1";
  const plan = params?.plan;

  return (
    <CockpitShell>
      <main className={`dashboard-main membership-page membership-success ${routeAtmosphere.membership}`}>
        <NarrativeJourneyRail currentSlug="/proof" />
        <nav className="dashboard-nav" aria-label="Foundry navigation">
          <Link href="/">Home</Link>
          <Link href="/membership">{copy.nav.membership}</Link>
          <Link href="/dashboard/profile">Profile</Link>
        </nav>

        {isPreview ? <RouteUnlockBanner blockedDetail={copy.localPreview.membershipCheckoutMock} /> : null}

        <section className="tier2-page-header tier2-page-header--stack membership-success__hero">
          <div className="tier2-page-header__copy">
            <p className="eyebrow">{copy.membership.successEyebrow}</p>
            <h1>{copy.membership.successHeadline}</h1>
            <p>
              {isPreview && plan ? `Preview path only — no Stripe charge (${plan} plan). ` : ""}
              {copy.membership.successBody}
            </p>
            <p className="membership-squibb-hint">{copy.squibb.success}</p>
            <div className="profile-actions">
              <Link className="button button-dark" href="/dashboard">
                Member home
              </Link>
              <Link className="button button-outline" href="/dashboard/profile">
                Update profile
              </Link>
              <Link className="button button-outline" href="/dashboard/crucible">
                {copy.membership.successPrimaryCta}
              </Link>
              <Link className="button button-outline" href="/dashboard/billing">
                {copy.membership.successSecondaryCtas.billing}
              </Link>
              <Link className="button button-outline" href="/proof">
                {copy.membership.successSecondaryCtas.proof}
              </Link>
              <Link className="button button-ghost" href="/">
                {copy.membership.successSecondaryCtas.home}
              </Link>
            </div>
          </div>
          <Tier2PageVisual page="membershipSuccess" featured />
        </section>
      </main>
    </CockpitShell>
  );
}
