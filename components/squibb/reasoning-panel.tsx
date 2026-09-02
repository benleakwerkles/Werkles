import type { SquibbRecommendation } from "@/lib/squibb/recommendations";

type ReasoningPanelProps = {
  reasoning: SquibbRecommendation["reasoning"];
};

export function ReasoningPanel({ reasoning }: ReasoningPanelProps) {
  return (
    <details className="squibb-reasoning squibb-rec-collapse">
      <summary className="squibb-rec-collapse__summary" id="squibbReasoningTitle">
        How Werkles reached this idea
      </summary>
      <dl className="squibb-reasoning__need">
        <div>
          <dt>Starting point</dt>
          <dd>{reasoning.statedNeed}</dd>
        </div>
        {reasoning.translatedNeed ? (
          <div>
          <dt>A practical interpretation</dt>
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
