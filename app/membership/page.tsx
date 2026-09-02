"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { SiteIcon } from "@/components/foundry/site-icon";
import { Tier2PageVisual } from "@/components/foundry/tier2-page-visual";
import { copy } from "@/lib/copy";
import { pricing } from "@/lib/pricing";
import { routeAtmosphere } from "@/lib/workshop-facets";
import { isAuthStripeTestBlocked, isFoundryDuesCheckoutPaused } from "@/lib/app-infra-preview";
import { shouldUseDevPreviewAuth } from "@/lib/dev-preview-auth";
import { getClientAccessToken } from "@/lib/client-auth";
import {
  WERKLES_MEMBERSHIP_PROMISE,
  WERKLES_TERMS,
  WERKLES_VALUE_LADDER
} from "@/lib/membership-value-ladder";

type Plan = "monthly" | "annual";

type OwnerState = {
  hasIntake: boolean;
  answeredCount: number;
  totalQuestions: number;
  candidates: { count: number; reviewRequired: number };
  duesUnlocked: string[];
  duesDoNotChange: string[];
};

const membershipFloorPreview = [
  {
    kicker: "Your Workshop",
    title: "The opening plan stays in one room.",
    body: "Keep the goal, the people, the facts still needed, and the next move where you can find them.",
    rows: ["Opening plan", "2 people to consider", "License check next"]
  },
  {
    kicker: "A thoughtful intro",
    title: "An introduction arrives with reasons.",
    body: "See why the connection may help before either person is exposed. You decide whether the door opens.",
    rows: ["Skills complement", "Same opening window", "Your call: open or pass"]
  },
  {
    kicker: "A shared Werkle",
    title: "Once the work is shared, the plan keeps moving.",
    body: "Track who is doing what, which facts still matter, and which outside help the business needs.",
    rows: ["People connected", "Facts reviewed", "Supplier options compared"]
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
          ? "Membership checkout is paused while payment setup finishes. Everything else works free."
          : "Checkout is open. Start free anytime—join only when Werkles earns it."
  );
  const [highlightPlan, setHighlightPlan] = useState<Plan | null>(null);
  const [ownerState, setOwnerState] = useState<OwnerState | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/owner/state")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.state) setOwnerState(data.state);
      })
      .catch(() => {
        /* Dues page still renders without a session readout */
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
            : `Showing ${planLabel}.`
      );
    }
  }, [previewBlocked, devPreview]);

  async function startCheckout(plan: Plan) {
    if (paymentsPaused) {
      setStatus("Membership checkout is paused while payment setup finishes.");
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
      setStatus("Log in before starting membership.");
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
      <main className={`dashboard-main membership-page route-room route-room--membership ${routeAtmosphere.membership}`}>

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

      <section className="ops-card membership-language" aria-labelledby="membership-language-title">
        <div className="card-heading">
          <p>One person, then shared work</p>
          <h2 id="membership-language-title">A Workshop is yours. A Werkle is what you build together.</h2>
        </div>
        <div className="membership-language__grid">
          <article>
            <span>Start here</span>
            <h3>{WERKLES_TERMS.workshop.term}</h3>
            <p>{WERKLES_TERMS.workshop.definition}</p>
          </article>
          <article>
            <span>Connect when it fits</span>
            <h3>{WERKLES_TERMS.werkle.term}</h3>
            <p>{WERKLES_TERMS.werkle.definition}</p>
          </article>
        </div>
      </section>

      <section className="ops-card membership-ladder" aria-labelledby="membership-ladder-title">
        <div className="card-heading">
          <p>Use it before you buy it</p>
          <h2 id="membership-ladder-title">Free should be useful. Membership should feel like a steal.</h2>
        </div>
        <p className="membership-ladder__promise">{WERKLES_MEMBERSHIP_PROMISE}</p>
        <div className="membership-ladder__grid">
          {WERKLES_VALUE_LADDER.map((step) => (
            <article className={`membership-ladder__step membership-ladder__step--${step.id}`} key={step.id}>
              <p>{step.status}</p>
              <h3>{step.label}</h3>
              <strong>{step.price}</strong>
              <ul>
                {step.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
            </article>
          ))}
        </div>
        <p className="membership-ladder__truth" role="note">
          You can use Intake, recommendations, matching, and a browser-local practice Werkle today. Real member-to-member sharing and account-saved Werkle records are still being built.
        </p>
      </section>

      {ownerState ? (
        <section className="ops-card" aria-labelledby="membership-standing-title">
          <div className="card-heading">
            <p>Where you actually stand</p>
            <h2 id="membership-standing-title">
              {ownerState.hasIntake
                ? `Intake on file · ${ownerState.answeredCount} of ${ownerState.totalQuestions} answered · ${ownerState.candidates.count} ranked candidates`
                : "No intake on file yet"}
            </h2>
          </div>
          {ownerState.hasIntake ? (
            <ul className="workshop-list">
              {ownerState.duesUnlocked.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p>
              Membership buys ongoing tools, not outcomes. Run the Intake first—it is free, and it is what
              every other surface reads from.
            </p>
          )}
          <ul className="workshop-list">
            {ownerState.duesDoNotChange.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className="member-selected-surface__actions">
            <Link className="button button-outline" href="/bellows/intake">
              {ownerState.hasIntake ? "Update intake" : "Run intake"}
            </Link>
            <Link className="button button-outline" href="/dashboard/blueprints">
              Open workshop
            </Link>
            <Link className="button button-outline" href="/dashboard/billing">
              Manage membership
            </Link>
          </div>
        </section>
      ) : null}

      <section className="ops-card membership-floor" aria-labelledby="membership-floor-title">
        <div className="card-heading membership-floor__heading">
          <p>Step onto the floor</p>
          <h2 id="membership-floor-title">See what membership adds.</h2>
        </div>
        <p className="membership-floor__intro">
          Membership keeps your Workshop moving and gives a shared Werkle more room to work: a living plan, thoughtful
          introductions, and useful tools gathered around the business instead of scattered across tabs and texts.
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
          <Link className="button button-outline" href="/dashboard/blueprints">
            Visit the member Workshop
          </Link>
        </div>
      </section>

      <section className="ops-card membership-trust" aria-label="Try before joining">
        <div className="card-heading">
          <p>Before you pay</p>
          <h2>Use the free path to see whether Werkles helps.</h2>
        </div>
        <p>
          Start with a free account and let Werkles solve something real. Join only when the time saved, included
          packets, and shared tools are clearly worth more than $9.99 a month.
        </p>
        <div className="member-selected-surface__actions">
          <Link className="button button-dark" href="/signup">
            Start free
          </Link>
          <Link className="button button-outline" href="/proof">
            See how checks work
          </Link>
          <Link className="button button-outline" href="/pricing">
            Review pricing
          </Link>
        </div>
      </section>

      <section className="membership-grid" aria-label="Werkles membership plans">
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
            <p>Werkles membership</p>
            <h2>Payments are paused while operator setup finishes.</h2>
          </div>
          <p>
            Werkles still works on the free path: account, Intake, recommendations, and matching stay open. Membership
            checkout returns when payment wiring is cleared—not because the Workshop stopped.
          </p>
          <div className="member-selected-surface__actions">
            <Link className="button button-dark" href="/dashboard">
              Go to member home
            </Link>
            <Link className="button button-outline" href="/dashboard/profile">
              Update profile
            </Link>
            <Link className="button button-outline" href="/proof">
              See how checks work
            </Link>
          </div>
        </section>
      ) : null}
      </main>
    </CockpitShell>
  );
}
