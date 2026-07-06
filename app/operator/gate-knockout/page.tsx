import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import {
  productGateKnockoutSteps,
  productGateSessionBrief,
  productGateStatusLabel
} from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Gate Knockout | Werkles",
  description: "Operator runbook for Stripe, Crucible, background-check, and production Human Gates.",
  robots: { index: false, follow: false }
};

const hardStops = [
  "No secrets in chat or repo.",
  "No live Stripe products, live checkout, or live webhook promotion without Ben approval.",
  "No provider identity/funds/background check without Ben approval.",
  "No background-check consent or FCRA-sensitive flow before counsel/provider approval.",
  "No deploy, push, merge, SQL, production data mutation, or public launch without explicit approval."
];

const phraseSteps = productGateKnockoutSteps.filter((step) => step.gatePhrase);
const blockedSteps = productGateKnockoutSteps.filter((step) => step.status === "blocked");
const operatorGateCount = productGateKnockoutSteps.filter((step) => step.status === "operator_gate").length;

export default function GateKnockoutPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Gate knockout navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/membership">Foundry</Link>
          <Link href="/dashboard/billing">Billing</Link>
          <Link href="/dashboard/crucible">Crucible</Link>
          <Link href="/operator/gate-knockout/scorecard">Scorecard</Link>
          <Link href="/operator/gate-knockout/dependencies">Dependencies</Link>
          <Link href="/operator/gate-knockout/preflight">Preflight Matrix</Link>
          <Link href="/operator/gate-knockout/evidence">Evidence Index</Link>
          <Link href="/operator/gate-knockout/decision-packet">Decision Packet</Link>
          <Link href="/operator/gate-knockout/faq">FAQ</Link>
          <Link href="/operator/gate-knockout/handoff">Handoff</Link>
          <Link href="/operator/gate-knockout/risks">Risks</Link>
          <Link href="/operator/gate-knockout/stripe-blocked">Stripe Blocked</Link>
          <Link href="/operator/gate-knockout/stripe-offline">Stripe Offline</Link>
          <Link href="/operator/gate-knockout/provider-queue">Provider Queue</Link>
          <Link href="/operator/gate-knockout/sign-in-hunt">Sign-In Hunt</Link>
          <Link href="/operator/gate-knockout/secret-entry">Secret Entry</Link>
          <Link href="/operator/gate-knockout/webhook-matrix">Webhook Matrix</Link>
          <Link href="/operator/gate-knockout/live-checkout-smoke">Live Checkout Smoke</Link>
          <Link href="/operator/gate-knockout/test-checkout-smoke">Test Checkout Smoke</Link>
          <Link href="/operator/gate-knockout/provider-scope">Provider Scope</Link>
          <Link href="/operator/gate-knockout/fcra-policy">FCRA Policy</Link>
          <Link href="/operator/gate-knockout/rollout-readiness">Rollout Readiness</Link>
          <Link href="/operator/gate-knockout/recap">Recap</Link>
          <Link href="/operator/gate-knockout/scope">Scope Planner</Link>
          <Link href="/operator/gate-knockout/dry-run">Dry Run</Link>
          <Link href="/tinkerden/human-gates">Human Gates</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Operator runbook</p>
            <h1>Gate Knockout</h1>
          </div>
          <p>
            Use this page to move through the real Werkles Human Gates in order: test payment proof, live Stripe setup,
            provider tests, background-check readiness, then production rollout. This page is review-only; it does not
            approve or perform any gate.
          </p>
          <div className="gate-list" aria-label="Hard stops">
            {hardStops.map((stop) => (
              <span key={stop}>{stop}</span>
            ))}
          </div>
        </section>

        <section className="ops-card" aria-label="One-session gate summary">
          <div className="card-heading">
            <p>One-session script</p>
            <h2>Knock These Out In Order</h2>
          </div>
          <div className="trust-state-strip">
            <span>{productGateKnockoutSteps.length} total gates</span>
            <span>{operatorGateCount} Ben approval gates</span>
            <span>{blockedSteps.length} policy blockers</span>
          </div>
          <p>
            Start at Gate 1 and stop on the first missing proof. When a gate is ready, use the exact phrase shown below;
            do not skip ahead from test-mode approval to live money or production rollout.
          </p>
          <ol>
            {phraseSteps.map((step) => (
              <li key={step.key}>
                Gate {step.order}: <code>{step.gatePhrase}</code>
              </li>
            ))}
          </ol>
          {blockedSteps.map((step) => (
            <p className="muted" key={step.key}>
              Blocker: {step.title} stays closed until {step.proofRequired.join(" ")}
            </p>
          ))}
          <p>
            <Link className="button button-outline" href="/operator/gate-knockout/scorecard">
              Open scorecard
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/dependencies">
              Open dependencies
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/preflight">
              Open preflight matrix
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/evidence">
              Open evidence index
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/decision-packet">
              Open copy-safe decision packet
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/faq">
              Open FAQ
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/handoff">
              Open handoff
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/risks">
              Open risks
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/stripe-blocked">
              Open Stripe blocker
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/stripe-offline">
              Open Stripe offline prep
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/provider-queue">
              Open provider queue
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/secret-entry">
              Open secret entry
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/webhook-matrix">
              Open webhook matrix
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/test-checkout-smoke">
              Open test checkout smoke
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/live-checkout-smoke">
              Open live checkout smoke
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/provider-scope">
              Open provider scope
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/fcra-policy">
              Open FCRA policy
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/rollout-readiness">
              Open rollout readiness
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/recap">
              Open recap
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/scope">
              Open scope planner
            </Link>{" "}
            <Link className="button button-outline" href="/operator/gate-knockout/dry-run">
              Open dry run
            </Link>
          </p>
        </section>

        <section className="ops-card" aria-label="Operator session brief">
          <div className="card-heading">
            <p>Before Ben Starts</p>
            <h2>Session Brief</h2>
          </div>
          <p>
            Treat this as the checklist for one focused gate session. Gather proof as you go, but stop before any
            Ben-only action unless the matching gate phrase has been given.
          </p>
          <div className="crucible-state-grid">
            <article className="ops-card crucible-state-card">
              <h3>Preflight Tabs</h3>
              <ul>
                {productGateSessionBrief.preflight.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="ops-card crucible-state-card">
              <h3>Evidence Buckets</h3>
              <ul>
                {productGateSessionBrief.evidenceBuckets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="ops-card crucible-state-card">
              <h3>Decision Record Fields</h3>
              <ul>
                {productGateSessionBrief.decisionRecordFields.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="ops-card crucible-state-card">
              <h3>Wrap-Up Checks</h3>
              <ul>
                {productGateSessionBrief.wrapUpChecks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="crucible-state-grid" aria-label="Gate knockout sequence">
          {productGateKnockoutSteps.map((step) => (
            <article className="ops-card crucible-state-card" key={step.key}>
              <p className="eyebrow">Gate {step.order}</p>
              <h2>{step.title}</h2>
              <span className="tag">{productGateStatusLabel(step.status)}</span>
              {step.gatePhrase ? <p className="status-line">Gate phrase: {step.gatePhrase}</p> : null}
              {step.operatorUrl ? (
                <p>
                  Provider page:{" "}
                  <a href={step.operatorUrl} rel="noreferrer">
                    {step.operatorUrl}
                  </a>
                </p>
              ) : null}
              <h3>Local Readiness Routes</h3>
              <ul>
                {step.localRoutes.map((route) => (
                  <li key={route}>
                    <Link href={route}>{route}</Link>
                  </li>
                ))}
              </ul>
              <h3>Ben Does</h3>
              <p>{step.benAction}</p>
              <h3>Agents May Prepare</h3>
              <ul>
                {step.agentPrep.map((prep) => (
                  <li key={prep}>{prep}</li>
                ))}
              </ul>
              <h3>Forbidden</h3>
              <ul>
                {step.forbiddenActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
              <h3>Proof Required</h3>
              <ul>
                {step.proofRequired.map((proof) => (
                  <li key={proof}>{proof}</li>
                ))}
              </ul>
              <p className="muted">Stop condition: {step.stopCondition}</p>
              <p>{step.notes}</p>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
