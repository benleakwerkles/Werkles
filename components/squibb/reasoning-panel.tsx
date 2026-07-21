import type { SquibbRecommendation } from "@/lib/squibb/recommendations";

type ReasoningPanelProps = {
  reasoning: SquibbRecommendation["reasoning"];
  isExample?: boolean;
};

export function ReasoningPanel({ reasoning, isExample = false }: ReasoningPanelProps) {
  return (
    <details className="squibb-reasoning squibb-rec-collapse">
      <summary className="squibb-rec-collapse__summary">Why this option</summary>
      <dl className="squibb-reasoning__need">
        <div>
          <dt>{isExample ? "Example scenario" : "You said"}</dt>
          <dd>{reasoning.statedNeed}</dd>
        </div>
        {reasoning.translatedNeed ? (
          <div>
            <dt>{isExample ? "Example interpretation" : "Werkles rules read it as"}</dt>
            <dd>{reasoning.translatedNeed}</dd>
          </div>
        ) : null}
      </dl>
      <ol className="squibb-reasoning__list">
        {reasoning.rationale.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
      {reasoning.counterpoint ? (
        <p className="squibb-reasoning__counter" role="note">
          <strong>Counterpoint:</strong> {reasoning.counterpoint}
        </p>
      ) : null}
    </details>
  );
}
