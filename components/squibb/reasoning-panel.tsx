import type { SquibbRecommendation } from "@/lib/squibb/recommendations";

type ReasoningPanelProps = {
  reasoning: SquibbRecommendation["reasoning"];
};

export function ReasoningPanel({ reasoning }: ReasoningPanelProps) {
  return (
    <section className="squibb-reasoning" aria-labelledby="squibbReasoningTitle">
      <h3 id="squibbReasoningTitle">Reasoning</h3>
      <dl className="squibb-reasoning__need">
        <div>
          <dt>You said</dt>
          <dd>{reasoning.statedNeed}</dd>
        </div>
        {reasoning.translatedNeed ? (
          <div>
            <dt>Squibb reads it as</dt>
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
    </section>
  );
}
