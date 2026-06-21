import Link from "next/link";

import { crucibleTrustCopy } from "@/lib/crucible";
import { copy } from "@/lib/copy";

const proofChecklist = [
  { key: "identity", label: "Identity" },
  { key: "funds", label: "Funds / capital" },
  { key: "employment", label: "Work history" },
  { key: "license", label: "Licenses" },
  { key: "reference", label: "References" },
  { key: "background", label: "Background / FCRA" }
] as const;

export function ProofDoctrineSection() {
  return (
    <div className="proof-doctrine">
      <section className="proof-callout panel">
        <strong>Prototype boundary</strong>
        <p>{copy.proofDisclaimer}</p>
      </section>

      <section className="proof-warning proof-boundary panel">
        <div>
          <p className="eyebrow">{copy.proof.eyebrow}</p>
          <h2>{copy.proof.title}</h2>
        </div>
        <p>{copy.proof.intro}</p>
        <p className="muted">{copy.proofDisclaimer}</p>
      </section>

      <section className="proof-grid panel" aria-label="Proof checklist">
        {proofChecklist.map((item) => (
          <article key={item.key} className="proof-card">
            <h2>{item.label}</h2>
            <p>{copy.proof.checks[item.key]}</p>
          </article>
        ))}
      </section>

      <section className="proof-warning panel">
        <div>
          <p className="eyebrow">Crucible rules</p>
          <h2>{copy.crucible.principle}</h2>
        </div>
        <div className="gate-list" aria-label="Crucible proof rules">
          {crucibleTrustCopy.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <p className="proof-doctrine__squibb">{copy.squibb.proof}</p>
        <div className="proof-doctrine__actions">
          <Link className="button button-light" href="/dashboard/crucible">
            {copy.proof.primaryCta}
          </Link>
          <Link className="button button-outline" href="/membership">
            {copy.proof.secondaryCta}
          </Link>
        </div>
      </section>
    </div>
  );
}
