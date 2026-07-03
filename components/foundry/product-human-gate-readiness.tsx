import Link from "next/link";

import {
  type ProductHumanGate,
  productGateStatusLabel,
  productHumanGatesFor
} from "@/lib/product-human-gates";

type ProductHumanGateReadinessProps = {
  area: ProductHumanGate["area"];
  title: string;
  intro: string;
};

export function ProductHumanGateReadiness({ area, title, intro }: ProductHumanGateReadinessProps) {
  const gates = productHumanGatesFor(area);

  return (
    <section className="ops-card" aria-label={`${title} readiness`}>
      <div className="card-heading">
        <p>Human Gate readiness</p>
        <h2>{title}</h2>
      </div>
      <p>{intro}</p>
      <div className="crucible-state-grid" aria-label={`${title} gate list`}>
        {gates.map((gate) => (
          <article className="ops-card crucible-state-card" key={gate.key}>
            <h3>{gate.title}</h3>
            <span className="tag">{productGateStatusLabel(gate.status)}</span>
            <p>{gate.visibleProof}</p>
            <p className="muted">Blocked until: {gate.blockedUntil}</p>
            <p>{gate.operatorAction}</p>
            {gate.gatePhrase ? <p className="status-line">Gate phrase: {gate.gatePhrase}</p> : null}
          </article>
        ))}
      </div>
      <p>
        <Link className="button button-outline" href="/operator/gate-knockout">
          Open Gate Knockout runbook
        </Link>
      </p>
    </section>
  );
}
