import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import {
  productGateByKey,
  productGateDependencies,
  productGateDependencyStatusLabel
} from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Gate Dependencies | Werkles",
  description: "Skip-prevention dependency board for Werkles product Human Gates.",
  robots: { index: false, follow: false }
};

export default function GateDependenciesPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Gate dependency navigation">
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/preflight">Preflight Matrix</Link>
          <Link href="/operator/gate-knockout/decision-packet">Decision Packet</Link>
          <Link href="/pricing">Pricing</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Skip prevention</p>
            <h1>Gate Dependencies</h1>
          </div>
          <p>
            Use this board to keep test proof, live Stripe setup, provider checks, background policy, and production
            rollout in the right order. A downstream gate is not authorized just because an upstream gate passed.
          </p>
          <div className="gate-list" aria-label="Dependency hard stops">
            <span>Test approval is not live approval</span>
            <span>Live products do not authorize secret entry</span>
            <span>Secret entry does not authorize checkout go-live</span>
            <span>Provider test does not authorize background checks</span>
            <span>Production remains last</span>
          </div>
        </section>

        <section className="crucible-state-grid" aria-label="Gate dependency board">
          {productGateDependencies.map((dependency) => {
            const gate = productGateByKey(dependency.gateKey);
            return (
              <article className="ops-card crucible-state-card" key={dependency.gateKey}>
                <p className="eyebrow">{productGateDependencyStatusLabel(dependency.status)}</p>
                <h2>{gate?.title ?? dependency.gateKey}</h2>
                <p>{dependency.nextAllowedAction}</p>
                <h3>Depends On</h3>
                {dependency.dependsOn.length ? (
                  <ul>
                    {dependency.dependsOn.map((gateKey) => {
                      const dependencyGate = productGateByKey(gateKey);
                      return <li key={gateKey}>{dependencyGate?.title ?? gateKey}</li>;
                    })}
                  </ul>
                ) : (
                  <p className="muted">No prior gate required. This is the first review point.</p>
                )}
                <h3>Unlocks</h3>
                {dependency.unlocks.length ? (
                  <ul>
                    {dependency.unlocks.map((gateKey) => {
                      const unlockedGate = productGateByKey(gateKey);
                      return <li key={gateKey}>{unlockedGate?.title ?? gateKey}</li>;
                    })}
                  </ul>
                ) : (
                  <p className="muted">No automatic downstream approval.</p>
                )}
                <p className="status-line">Skip risk: {dependency.skipRisk}</p>
                {gate?.gatePhrase ? <p>Required phrase: {gate.gatePhrase}</p> : <p>Required phrase: BLOCKED.</p>}
              </article>
            );
          })}
        </section>
      </main>
    </CockpitShell>
  );
}
