"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { RouteUnlockBanner } from "@/components/foundry/route-unlock-banner";
import { SiteIcon } from "@/components/foundry/site-icon";
import { SiteHeader } from "@/components/foundry/site-header";
import { Tier2PageVisual } from "@/components/foundry/tier2-page-visual";
import { copy } from "@/lib/copy";
import { pricing } from "@/lib/pricing";
import { routeAtmosphere } from "@/lib/workshop-facets";
import { isAuthStripeTestBlocked, isFoundryDuesCheckoutPaused } from "@/lib/app-infra-preview";
import { shouldUseDevPreviewAuth } from "@/lib/dev-preview-auth";
import { getClientAccessToken } from "@/lib/client-auth";

type Plan = "monthly" | "annual";

const membershipFloorPreview = [
  {
    kicker: "Workbench",
    title: "The opening plan stays in one room.",
    body: "Keep the ask, the people, the proof still needed, and the next move where the whole crew can see them.",
    rows: ["Opening plan", "2 possible partners", "License proof next"]
  },
  {
    kicker: "Guarded Intro",
    title: "An introduction arrives with reasons.",
    body: "See why the connection may help before either person is exposed. You decide whether the door opens.",
    rows: ["Skills complement", "Same opening window", "Your call: open or pass"]
  },
  {
    kicker: "Rolling Workshop",
    title: "Once the joints lock, the work keeps moving.",
    body: "Track the partner, the proof, and the outside help the venture needs without turning Werkles into the dealmaker.",
    rows: ["Partner found", "Proof reviewed", "Vendor options compared"]
  }
] as const;

const verificationProviders = [
  {
    name: "Stripe Identity",
    purpose: "Identity",
    status: "Test integration ready"
  },
  {
    name: "Plaid",
    purpose: "Funds",
    status: "Sandbox integration ready"
  },
  {
    name: "Twilio",
    purpose: "Phone",
    status: "Planned — not connected yet"
  }
] as const;

export default function MembershipPage() {
  const previewBlocked = isAuthStripeTestBlocked();
  const devPreview = shouldUseDevPreviewAuth();
  const paymentsPaused = !devPreview && isFoundryDuesCheckoutPaused();
  const [status, setStatus] = useState(
    previewBlocked
      ? copy.infraPreview.membershipCheckout
      : devPreview
        ? copy.localPreview.membershipIdle
        : paymentsPaused
          ? "Foundry Dues checkout is paused while payment setup finishes. Everything else works free."
          : "Checkout is open. Start free anytime — dues only when the floor earns it."
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
    if (paymentsPaused) {
      setStatus("Foundry Dues checkout is paused while operator payment setup finishes.");
      return;
    }
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
      : paymentsPaused
        ? "Checkout paused"
        : copy.membership.checkout;
  const checkoutDisabled = previewBlocked || paymentsPaused;

  return (
    <CockpitShell showDraftBadge={false}>
      {/* Public sales page wears the standard Werkles header (owner
         walkthrough 2026-07-27); the reduced pill nav was for focused tasks
         like login. Operator preflight/runbook copy moved off this page —
         it lives at /operator/gate-knockout/test-checkout-smoke. */}
      <SiteHeader />
      <main className={`dashboard-main membership-page ${routeAtmosphere.membership}`}>

      <RouteUnlockBanner blockedDetail={copy.infraPreview.membershipCheckout} />

      <section className="tier2-page-header">
        <div className="tier2-page-header__copy membership-hero">
          <SiteIcon icon="product-membership" size="lg" className="site-icon--product product-hero-icon" />
          <p className="eyebrow">{copy.membership.eyebrow}</p>
          <h1>{copy.membership.headline}</h1>
          <p>{copy.membership.subhead}</p>
          <p className="muted">{copy.membership.disclaimer}</p>
        </div>
        <Tier2PageVisual page="membership" featured forgeBand />
      </section>

      <section className="ops-card membership-floor" aria-labelledby="membership-floor-title">
        <div className="card-heading membership-floor__heading">
          <p>Step onto the floor</p>
          <h2 id="membership-floor-title">See what membership unlocks.</h2>
        </div>
        <p className="membership-floor__intro">
          This is the shape of the real member Workshop — a working room, a guarded introduction, and the venture in
          motion. The free Workshop sandbox is the next product slice; this preview shows the floor without pretending
          it is already open.
        </p>
        <div className="membership-floor__grid">
          {membershipFloorPreview.map((surface, index) => (
            <article className="membership-floor__surface" key={surface.kicker}>
              <div className="membership-floor__surface-head">
                <span aria-hidden="true">0{index + 1}</span>
                <p>{surface.kicker}</p>
              </div>
              <h3>{surface.title}</h3>
              <p>{surface.body}</p>
              <ul aria-label={`${surface.kicker} preview`}>
                {surface.rows.map((row) => (
                  <li key={row}>{row}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="membership-floor__actions">
          <Link className="button button-dark" href="/signup">
            Start free
          </Link>
          <Link className="button button-outline" href="/dashboard">
            Visit the member Workshop
          </Link>
        </div>
      </section>

      <section className="ops-card membership-verifiers" aria-labelledby="membership-verifiers-title">
        <div className="card-heading">
          <p>Verification through names you know</p>
          <h2 id="membership-verifiers-title">Providers do the checking. Werkles keeps the receipt.</h2>
        </div>
        <p>
          Werkles is building on specialist providers instead of asking members to trust a homemade badge. Status is
          stated plainly here: test and sandbox wiring are not live verification.
        </p>
        <ul className="membership-verifiers__list">
          {verificationProviders.map((provider) => (
            <li key={provider.name}>
              <span className="membership-verifiers__name">{provider.name}</span>
              <span className="membership-verifiers__purpose">{provider.purpose}</span>
              <span className="membership-verifiers__status">{provider.status}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="ops-card membership-trust" aria-label="Try before dues">
        <div className="card-heading">
          <p>Before you pay</p>
          <h2>Use the free path to see whether Werkles helps.</h2>
        </div>
        <p>
          You should not need to pay just to understand the floor. Start with a free account, inspect the proof layer,
          and only choose dues when the workshop feels worth keeping.
        </p>
        <div className="member-selected-surface__actions">
          <Link className="button button-dark" href="/signup">
            Start free
          </Link>
          <Link className="button button-outline" href="/proof">
            Inspect proof
          </Link>
          <Link className="button button-outline" href="/pricing">
            Review pricing
          </Link>
        </div>
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
          {/* Featured card wears the violet primary; the other card goes quiet
             (Ender: button hierarchy was inverted against card hierarchy). */}
          <button
            className={`button ${monthlyFeatured ? "button-dark" : "button-light"}`}
            type="button"
            disabled={checkoutDisabled}
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
            className={`button ${annualFeatured ? "button-dark" : "button-light"}`}
            type="button"
            disabled={checkoutDisabled}
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

      {/* Only when checkout is actually paused — this rendered unconditionally
         and contradicted the "checkout is open" status line above it. */}
      {paymentsPaused ? (
        <section className="ops-card membership-trust" aria-label="Payments paused">
          <div className="card-heading">
            <p>Foundry Dues</p>
            <h2>Payments are paused while operator setup finishes.</h2>
          </div>
          <p>
            Werkles still works on the free path: account, profile, onboarding, and member surfaces stay open. Foundry
            Dues checkout returns when payment wiring is cleared — not because the workshop stopped.
          </p>
          <div className="member-selected-surface__actions">
            <Link className="button button-dark" href="/dashboard">
              Go to member home
            </Link>
            <Link className="button button-outline" href="/dashboard/profile">
              Update profile
            </Link>
            <Link className="button button-outline" href="/proof">
              Inspect proof
            </Link>
          </div>
        </section>
      ) : null}
      </main>
    </CockpitShell>
  );
}
