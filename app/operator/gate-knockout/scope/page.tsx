import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productGateByKey, productGateScopeOptions } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Gate Scope Planner | Werkles",
  description: "Scope planner for Werkles product Human Gates.",
  robots: { index: false, follow: false }
};

function recommendationLabel(recommendation: string) {
  if (recommendation === "include_now") return "Candidate for v0";
  if (recommendation === "scope_out_for_v0") return "Scope out for v0";
  return "Blocked until policy";
}

export default function GateScopePage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Gate scope navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/dependencies">Dependencies</Link>
          <Link href="/operator/gate-knockout/decision-packet">Decision Packet</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Rollout planning</p>
            <h1>Gate Scope Planner</h1>
          </div>
          <p>
            Use this to decide what belongs in the first production scope and what stays visibly blocked or preview-only.
            Scoping something out is not approval to run it later.
          </p>
        </section>

        <section className="crucible-state-grid" aria-label="Gate scope options">
          {productGateScopeOptions.map((option) => (
            <article className="ops-card crucible-state-card" key={option.key}>
              <p className="eyebrow">{recommendationLabel(option.recommendation)}</p>
              <h2>{option.title}</h2>
              <h3>Related Gates</h3>
              <ul>
                {option.gates.map((gateKey) => {
                  const gate = productGateByKey(gateKey);
                  return <li key={gateKey}>{gate?.title ?? gateKey}</li>;
                })}
              </ul>
              <p><strong>Keep:</strong> {option.keep}</p>
              <p><strong>Cut:</strong> {option.cut}</p>
              <p className="status-line">Proof needed: {option.proofNeeded}</p>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
