"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
    preview ? copy.dashboard.billing.previewShell : copy.dashboard.billing.idle
  );

  useEffect(() => {
    if (preview) return;

    async function loadBilling() {
      try {
        const supabase = getSupabaseBrowser();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          setStatus("Log in to inspect billing.");
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
        setStatus("Billing profile loaded.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "The register is not wired yet.");
      }
    }

    loadBilling();
  }, [preview]);

  async function openPortal() {
    if (preview) {
      setStatus(copy.dashboard.billing.portalBlocked);
      return;
    }

    setStatus("Opening the billing portal.");

    try {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setStatus("Log in to open the billing portal.");
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
        setStatus(payload.error || "Billing portal could not open.");
        return;
      }

      if (payload.url) {
        window.location.href = payload.url;
        return;
      }

      setStatus("Billing portal returned no URL.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Billing portal could not open.");
    }
  }

  return (
    <CockpitShell>
      <main className={`dashboard-main ${routeAtmosphere.billing}`}>
      <nav className="dashboard-nav" aria-label="Billing navigation">
        <Link href="/dashboard">Match deck</Link>
        <Link href="/membership">Membership</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/dashboard/crucible">Crucible</Link>
      </nav>

      <section className="ops-card billing-panel">
        <div className="card-heading">
          <p>{copy.dashboard.billing.kicker}</p>
          <h1>{copy.dashboard.billing.headline}</h1>
        </div>
        {preview ? <p className="muted">{copy.dashboard.billing.previewShell}</p> : null}
        <div className="trust-state-strip">
          <span>Tier: {profile?.membership_tier || "free"}</span>
          <span>Status: {profile?.subscription_status || "none"}</span>
          <span>Customer: {profile?.stripe_customer_id ? "linked" : "not linked"}</span>
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
            : "not set"}
        </p>
        <button className="button button-outline" type="button" onClick={openPortal} disabled={preview}>
          Open billing portal
        </button>
        <p className="status-line" role="status">{status}</p>
      </section>
      </main>
    </CockpitShell>
  );
}
