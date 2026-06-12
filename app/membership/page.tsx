"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { RouteUnlockBanner } from "@/components/foundry/route-unlock-banner";
import { Tier2PageVisual } from "@/components/foundry/tier2-page-visual";
import { NarrativeJourneyRail } from "@/components/narrative/narrative-journey-rail";
import { copy } from "@/lib/copy";
import { pricing } from "@/lib/pricing";
import { routeAtmosphere } from "@/lib/workshop-facets";
import { isAuthStripeTestBlocked } from "@/lib/app-infra-preview";
import { shouldUseDevPreviewAuth } from "@/lib/dev-preview-auth";
import { getClientAccessToken } from "@/lib/client-auth";

type Plan = "monthly" | "annual";

export default function MembershipPage() {
  const previewBlocked = isAuthStripeTestBlocked();
  const devPreview = shouldUseDevPreviewAuth();
  const [status, setStatus] = useState(
    previewBlocked
      ? copy.infraPreview.membershipCheckout
      : devPreview
        ? copy.localPreview.membershipIdle
        : "Choose your dues. Stripe handles the brass register."
  );
  const [highlightPlan, setHighlightPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("checkout") === "cancelled") {
      setStatus(copy.membership.cancelled);
    }
    const plan = searchParams.get("plan");
    if (plan === "monthly" || plan === "annual") {
      setHighlightPlan(plan);
      const planLabel = plan === "annual" ? copy.membership.annual : copy.membership.monthly;
      setStatus(
        previewBlocked
          ? `${copy.infraPreview.membershipCheckout} Highlighting ${planLabel}.`
          : devPreview
            ? `${copy.localPreview.membershipIdle} Highlighting ${planLabel}.`
            : `Showing ${planLabel} from dues.`
      );
    }
  }, [previewBlocked, devPreview]);

  async function startCheckout(plan: Plan) {
    if (previewBlocked) {
      setStatus(copy.infraPreview.membershipCheckout);
      return;
    }

    if (devPreview) {
      setStatus(copy.localPreview.membershipCheckoutMock);
      window.location.href = `/membership/success?preview=1&plan=${plan}`;
      return;
    }

    setStatus("Opening Stripe checkout.");
    const token = await getClientAccessToken();

    if (!token) {
      setStatus("Log in before paying dues.");
      return;
    }

    const response = await fetch("/api/membership/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ plan })
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error || "Checkout jammed. Try again.");
      return;
    }

    window.location.href = payload.url;
  }

  const monthlyFeatured = highlightPlan === null || highlightPlan === "monthly";
  const annualFeatured = highlightPlan === "annual";
  const checkoutLabel = previewBlocked
    ? "Checkout disabled (preview)"
    : devPreview
      ? "Mock checkout (preview)"
      : copy.membership.checkout;

  return (
    <CockpitShell>
      <main className={`dashboard-main membership-page ${routeAtmosphere.membership}`}>
      <NarrativeJourneyRail currentSlug="/proof" />
      <nav className="dashboard-nav" aria-label="Foundry navigation">
        <Link href="/">Home</Link>
        <Link href="/pricing">{copy.nav.pricing}</Link>
        <Link href="/login">{copy.nav.login}</Link>
        <Link href="/onboarding">Onboarding</Link>
      </nav>

      <RouteUnlockBanner blockedDetail={copy.infraPreview.membershipCheckout} />

      <section className="tier2-page-header">
        <div className="tier2-page-header__copy membership-hero">
          <p className="eyebrow">{copy.membership.eyebrow}</p>
          <h1>{copy.membership.headline}</h1>
          <p>{copy.membership.subhead}</p>
          <p className="muted">{copy.membership.disclaimer}</p>
        </div>
        <Tier2PageVisual page="membership" featured forgeBand />
      </section>

      <Tier2PageVisual page="membership" iconRail showAttribution={false} />

      <section className="ops-card membership-unlocks" aria-label="What Foundry Dues unlock">
        <h2>What membership unlocks</h2>
        <ul>
          {copy.membership.unlocks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="membership-grid" aria-label="Foundry Dues plans">
        <article className="ops-card plan-card">
          <p className="plan-kicker">{copy.membership.plans.free.kicker}</p>
          <h2>{copy.membership.plans.free.price}</h2>
          <p>{copy.membership.plans.free.body}</p>
          <Link className="button button-outline" href="/onboarding">{copy.membership.plans.free.cta}</Link>
        </article>

        <article
          className={`ops-card plan-card${monthlyFeatured ? " plan-card-featured tier2-accent--elevator" : ""}`}
        >
          <p className="plan-kicker">{copy.membership.monthly}</p>
          <h2>{pricing.foundryDues.monthly.displayPrice}</h2>
          <p>{copy.membership.plans.monthly.body}</p>
          <button
            className="button button-light"
            type="button"
            disabled={previewBlocked}
            onClick={() => startCheckout("monthly")}
          >
            {checkoutLabel}
          </button>
        </article>

        <article
          className={`ops-card plan-card${annualFeatured ? " plan-card-featured tier2-accent--elevator" : ""}`}
        >
          <p className="plan-kicker">{copy.membership.annual}</p>
          <h2>{pricing.foundryDues.annual.displayPrice}</h2>
          <p>{copy.membership.plans.annual.body}</p>
          <button
            className="button button-dark"
            type="button"
            disabled={previewBlocked}
            onClick={() => startCheckout("annual")}
          >
            {checkoutLabel}
          </button>
        </article>
      </section>

      <section className="ops-card membership-trust">
        <h2>{copy.membership.trustHeadline}</h2>
        <p>{copy.membership.trust}</p>
        <p className="membership-squibb-hint">{copy.squibb.membership}</p>
        <p className="status-line" role="status">{status}</p>
      </section>
      </main>
    </CockpitShell>
  );
}
