import type { HumanGateRequirement } from "@/lib/squibb/walkthrough-types";

type HumanGateStripProps = {
  gates: HumanGateRequirement[];
  variant?: "default" | "compact";
};

export function HumanGateStrip({ gates, variant = "default" }: HumanGateStripProps) {
  const visibleGates =
    variant === "compact"
      ? gates.filter((g) => g.benMustApprove || g.severity === "blocker")
      : gates;

  const blockers = visibleGates.filter((g) => g.severity === "blocker");
  const benGates = visibleGates.filter((g) => g.benMustApprove);

  if (variant === "compact") {
    return (
      <section className="squibb-gates squibb-gates--compact" aria-labelledby="squibbGatesTitle">
        <h3 id="squibbGatesTitle">Human gates</h3>
        {blockers.length > 0 ? (
          <p className="squibb-gates__summary" role="status">
            {blockers.length} blocker{blockers.length === 1 ? "" : "s"} — paused until cleared.
          </p>
        ) : null}
        <ul className="squibb-gates__list squibb-gates__list--compact">
          {visibleGates.map((gate) => (
            <li key={gate.id} className={`squibb-gate squibb-gate--${gate.severity}`}>
              <strong>{gate.label}</strong>
              <span>{gate.reason}</span>
            </li>
          ))}
        </ul>
        {benGates.length > 0 ? (
          <p className="squibb-gates__operator-note">
            Ben must approve before: {benGates.map((g) => g.label.toLowerCase()).join(", ")}.
          </p>
        ) : null}
      </section>
    );
  }

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
