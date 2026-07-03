import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productGateByKey, productGateEvidenceIndex } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Gate Evidence Index | Werkles",
  description: "Acceptable proof and redaction index for Werkles product Human Gates.",
  robots: { index: false, follow: false }
};

export default function GateEvidencePage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Gate evidence navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/scorecard">Scorecard</Link>
          <Link href="/operator/gate-knockout/decision-packet">Decision Packet</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Proof map</p>
            <h1>Gate Evidence Index</h1>
          </div>
          <p>
            Use this before filing a decision packet or receipt. It separates acceptable proof from misleading proof and
            repeats the redaction rule for each gate.
          </p>
        </section>

        <section className="crucible-state-grid" aria-label="Gate evidence index">
          {productGateEvidenceIndex.map((item) => {
            const gate = productGateByKey(item.gateKey);
            return (
              <article className="ops-card crucible-state-card" key={item.label}>
                <p className="eyebrow">{gate?.title ?? item.gateKey}</p>
                <h2>{item.label}</h2>
                <p><strong>Acceptable:</strong> {item.acceptableProof}</p>
                <p><strong>Not acceptable:</strong> {item.unacceptableProof}</p>
                <p className="status-line">Redaction: {item.redactionRule}</p>
              </article>
            );
          })}
        </section>
      </main>
    </CockpitShell>
  );
}
