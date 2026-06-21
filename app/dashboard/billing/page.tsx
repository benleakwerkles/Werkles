"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Tier2PageVisual } from "@/components/foundry/tier2-page-visual";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { copy } from "@/lib/copy";
import { pricing } from "@/lib/pricing";
import { routeAtmosphere } from "@/lib/workshop-facets";
import { isAuthStripeTestBlocked } from "@/lib/app-infra-preview";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type BillingProfile = {
  membership_tier?: string | null;
  subscription_status?: string | null;
  current_period_end?: string | null;
  stripe_customer_id?: string | null;
};

const PREVIEW_PROFILE: BillingProfile = {
  membership_tier: "free",
  subscription_status: "preview",
  current_period_end: null,
  stripe_customer_id: null
};

export default function BillingPage() {
  const preview = isAuthStripeTestBlocked();
  const [profile, setProfile] = useState<BillingProfile | null>(preview ? PREVIEW_PROFILE : null);
  const [status, setStatus] = useState(
    preview ? copy.dashboard.billing.disabledReason : copy.dashboard.billing.idle
  );

  useEffect(() => {
    if (preview) return;

    async function loadBilling() {
      try {
        const supabase = getSupabaseBrowser();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          setStatus(copy.dashboard.billing.loginRequired);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("membership_tier, subscription_status, current_period_end, stripe_customer_id")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (error) {
          setStatus(error.message);
          return;
        }

        setProfile(data || {});
        setStatus(copy.dashboard.billing.profileLoaded);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : copy.dashboard.billing.portalFailed);
      }
    }

    loadBilling();
  }, [preview]);

  async function openPortal() {
    if (preview) {
      setStatus(copy.dashboard.billing.disabledReason);
      return;
    }

    setStatus(copy.dashboard.billing.openingPortal);

    try {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setStatus(copy.dashboard.billing.loginRequired);
        return;
      }

      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus(payload.error || copy.dashboard.billing.portalFailed);
        return;
      }

      if (payload.url) {
        window.location.href = payload.url;
        return;
      }

      setStatus(copy.dashboard.billing.portalNoUrl);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.dashboard.billing.portalFailed);
    }
  }

  const tier = profile?.membership_tier || copy.dashboard.billing.tierFree;
  const subStatus = profile?.subscription_status || copy.dashboard.billing.statusNone;
  const customerLabel = profile?.stripe_customer_id
    ? copy.dashboard.billing.customerLinked
    : copy.dashboard.billing.customerNotLinked;

  return (
    <CockpitShell>
      <main className={`dashboard-main ${routeAtmosphere.billing}`}>
      <nav className="dashboard-nav" aria-label="Billing navigation">
        <Link href="/dashboard">{copy.nav.workbench}</Link>
        <Link href="/membership">{copy.nav.membership}</Link>
        <Link href="/pricing">{copy.nav.pricing}</Link>
        <Link href="/dashboard/crucible">{copy.nav.crucible}</Link>
      </nav>

      <div className="tier2-visual-band">
        <Tier2PageVisual page="billing" featured iconRail />
      </div>

      <section className="ops-card billing-panel">
        <div className="card-heading">
          <p>{copy.dashboard.billing.kicker}</p>
          <h1>{copy.dashboard.billing.headline}</h1>
        </div>
        <p>{copy.dashboard.billing.summary}</p>
        {preview ? <p className="muted">{copy.dashboard.billing.disabledReason}</p> : null}
        <div className="trust-state-strip">
          <span>
            {copy.dashboard.billing.tierLabel}: {tier}
          </span>
          <span>Status: {subStatus}</span>
          <span>{customerLabel}</span>
        </div>
        <p>
          Monthly Foundry Dues are {pricing.foundryDues.monthly.displayPrice}. The Long Run is{" "}
          {pricing.foundryDues.annual.displayPrice}. Membership state changes only after the
          Stripe webhook lands.
        </p>
        <p>
          Current period end:{" "}
          {profile?.current_period_end
            ? new Date(profile.current_period_end).toLocaleDateString()
            : copy.dashboard.billing.periodEndUnset}
        </p>
        <div className="billing-actions">
          <button className="button button-dark" type="button" disabled={preview}>
            {copy.dashboard.billing.checkoutCta}
          </button>
          <button className="button button-outline" type="button" onClick={openPortal} disabled={preview}>
            {copy.dashboard.billing.portalCta}
          </button>
          <button className="button button-outline" type="button" disabled={preview}>
            {copy.dashboard.billing.downloadCta}
          </button>
        </div>
        <p className="billing-squibb-hint">{copy.squibb.billing}</p>
        <p className="status-line" role="status">{status}</p>
      </section>
      </main>
    </CockpitShell>
  );
}
