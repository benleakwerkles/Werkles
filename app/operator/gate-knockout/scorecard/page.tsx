import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productGateReadinessScores } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Gate Readiness Scorecard | Werkles",
  description: "Condensed readiness scorecard for Werkles product Human Gates.",
  robots: { index: false, follow: false }
};

function stateLabel(state: string) {
  if (state === "ready_to_review") return "Ready to review";
  if (state === "completed") return "Completed";
  if (state === "needs_prior_gate") return "Needs prior gate";
  if (state === "policy_blocked") return "Policy blocked";
  return "Last only";
}

export default function GateScorecardPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Gate scorecard navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/dependencies">Dependencies</Link>
          <Link href="/operator/gate-knockout/evidence">Evidence Index</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Shortest view</p>
            <h1>Gate Readiness Scorecard</h1>
          </div>
          <p>
            This is the quick status board for deciding what to review next. It does not approve any gate and does not
            replace the decision packet.
          </p>
        </section>

        <section className="crucible-state-grid" aria-label="Gate readiness scorecard">
          {productGateReadinessScores.map((score) => (
            <article className="ops-card crucible-state-card" key={score.key}>
              <p className="eyebrow">{stateLabel(score.state)}</p>
              <h2>{score.title}</h2>
              <p>{score.evidence}</p>
              <p className="muted">Blocker: {score.blocker}</p>
              <p className="status-line">Next action: {score.nextAction}</p>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
