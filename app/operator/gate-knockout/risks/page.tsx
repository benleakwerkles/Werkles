import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productGateByKey, productGateRiskRegister } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Gate Risk Register | Werkles",
  description: "Remaining risk register for Werkles product Human Gates.",
  robots: { index: false, follow: false }
};

function severityLabel(severity: string) {
  if (severity === "blocked") return "Blocked";
  if (severity === "high") return "High risk";
  return "Medium risk";
}

export default function GateRiskRegisterPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Gate risk register navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/handoff">Handoff</Link>
          <Link href="/operator/gate-knockout/scorecard">Scorecard</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Remaining risk</p>
            <h1>Gate Risk Register</h1>
          </div>
          <p>
            Use this before saying the site is ready for live gate passage. Every high or blocked risk needs a ready
            signal, scope-out decision, or explicit stop.
          </p>
        </section>

        <section className="crucible-state-grid" aria-label="Gate risk register">
          {productGateRiskRegister.map((risk) => (
            <article className="ops-card crucible-state-card" key={risk.key}>
              <p className="eyebrow">{severityLabel(risk.severity)}</p>
              <h2>{risk.title}</h2>
              <p>{risk.risk}</p>
              <h3>Applies To</h3>
              <ul>
                {risk.appliesTo.map((gateKey) => {
                  const gate = productGateByKey(gateKey);
                  return <li key={gateKey}>{gate?.title ?? gateKey}</li>;
                })}
              </ul>
              <p><strong>Mitigation:</strong> {risk.mitigation}</p>
              <p className="status-line">Ready signal: {risk.readySignal}</p>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
