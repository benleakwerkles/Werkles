import type { HumanGateRequirement } from "@/lib/squibb/walkthrough-types";

type HumanGateStripProps = {
  gates: HumanGateRequirement[];
};

export function HumanGateStrip({ gates }: HumanGateStripProps) {
  const blockers = gates.filter((g) => g.severity === "blocker");
  const benGates = gates.filter((g) => g.benMustApprove);

  return (
    <section className="squibb-gates" aria-labelledby="squibbGatesTitle">
      <h3 id="squibbGatesTitle">Human gates</h3>
      {blockers.length > 0 ? (
        <p className="squibb-gates__summary" role="status">
          {blockers.length} blocker{blockers.length === 1 ? "" : "s"} — action paused until cleared.
        </p>
      ) : null}
      {benGates.length > 0 ? (
        <p className="squibb-gates__operator-note">
          Ben must approve: {benGates.map((g) => g.label).join(" · ")}
        </p>
      ) : null}
      <ul className="squibb-gates__list">
        {gates.map((gate) => (
          <li key={gate.id} className={`squibb-gate squibb-gate--${gate.severity}`}>
            <div className="squibb-gate__head">
              <span className={`squibb-gate__severity squibb-gate__severity--${gate.severity}`}>
                {gate.severity}
              </span>
              <strong>{gate.label}</strong>
              {gate.benMustApprove ? (
                <span className="squibb-gate__approval">Ben must approve</span>
              ) : (
                <span className="squibb-gate__approval squibb-gate__approval--auto">No Operator gate</span>
              )}
            </div>
            <p>{gate.reason}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
