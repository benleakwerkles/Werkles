import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import {
  productGateDecisionPacket,
  productGateDecisionTemplate,
  productGateKnockoutSteps,
  productGateStatusLabel
} from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Gate Decision Packet | Werkles",
  description: "Copy-safe decision packet template for Werkles product Human Gates.",
  robots: { index: false, follow: false }
};

export default function GateDecisionPacketPage() {
  const template = productGateDecisionTemplate();

  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Gate decision packet navigation">
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/dependencies">Dependencies</Link>
          <Link href="/operator/gate-knockout/preflight">Preflight Matrix</Link>
          <Link href="/membership">Foundry</Link>
          <Link href="/dashboard/billing">Billing</Link>
          <Link href="/dashboard/crucible">Crucible</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Decision packet</p>
            <h1>{productGateDecisionPacket.title}</h1>
          </div>
          <p>{productGateDecisionPacket.purpose}</p>
          <div className="gate-list" aria-label="Allowed gate outcomes">
            {productGateDecisionPacket.allowedOutcomes.map((outcome) => (
              <span key={outcome}>{outcome}</span>
            ))}
          </div>
        </section>

        <section className="crucible-state-grid" aria-label="Decision packet guidance">
          <article className="ops-card crucible-state-card">
            <h2>Redaction Rules</h2>
            <ul>
              {productGateDecisionPacket.redactionRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </article>
          <article className="ops-card crucible-state-card">
            <h2>Required Fields</h2>
            <ul>
              {productGateDecisionPacket.packetFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="ops-card" aria-label="Decision packet template">
          <div className="card-heading">
            <p>Copy-safe template</p>
            <h2>Session Record</h2>
          </div>
          <p>
            Fill this with proof references and outcomes only. Do not paste secret values, provider PII, background-check
            artifacts, or production credentials.
          </p>
          <pre>
            <code>{template}</code>
          </pre>
        </section>

        <section className="crucible-state-grid" aria-label="Gate outcome index">
          {productGateKnockoutSteps.map((step) => (
            <article className="ops-card crucible-state-card" key={step.key}>
              <p className="eyebrow">Gate {step.order}</p>
              <h2>{step.title}</h2>
              <span className="tag">{productGateStatusLabel(step.status)}</span>
              <p>{step.gatePhrase ? `Phrase: ${step.gatePhrase}` : "Phrase: BLOCKED until policy/provider proof exists."}</p>
              <p className="muted">Stop condition: {step.stopCondition}</p>
            </article>
          ))}
        </section>
      </main>
    </CockpitShell>
  );
}
