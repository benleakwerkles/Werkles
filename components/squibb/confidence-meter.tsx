import type { ConfidenceLabel } from "@/lib/squibb/walkthrough-types";

type ConfidenceMeterProps = {
  score: number;
  label: ConfidenceLabel;
  why: string;
  variant?: "confidence" | "rules_score";
  isExample?: boolean;
};

const SUPPORT_BAND: Record<ConfidenceLabel, string> = {
  high: "Stronger rule support",
  medium: "Moderate rule support",
  low: "Limited rule support"
};

const LIVE_RULES_SCORE_DISCLAIMER =
  "This rules score shows how strongly the current rules support this option based on what you entered. It is not a probability of success, a measure of eligibility, or a predicted outcome.";

const EXAMPLE_RULES_SCORE_DISCLAIMER =
  "This rules score shows how strongly the current rules support this option based on the information in this example. It is not a probability of success, a measure of eligibility, or a predicted outcome.";

export function ConfidenceMeter({ score, label, why, variant = "confidence", isExample = false }: ConfidenceMeterProps) {
  const clamped = Math.min(100, Math.max(0, score));

  if (variant === "rules_score") {
    const rulesScore = Math.round(clamped);
    const band = SUPPORT_BAND[label] ?? SUPPORT_BAND.low;

    return (
      <div className="squibb-confidence" aria-labelledby="squibbRulesScoreTitle">
        <div className="squibb-confidence__header">
          <h3 id="squibbRulesScoreTitle">Rules score</h3>
          <span className={`squibb-confidence__badge squibb-confidence__badge--${label}`}>
            Support band: {band}
          </span>
          <span className="squibb-confidence__score" aria-label={`Rules score ${rulesScore} out of 100`}>
            {rulesScore} out of 100
          </span>
        </div>
        <div
          className="squibb-confidence__track"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={rulesScore}
          aria-valuetext={`${rulesScore} out of 100. ${band}. Not a probability.`}
          aria-label="Rules score"
        >
          <div className="squibb-confidence__fill" style={{ width: `${rulesScore}%` }} />
        </div>
        <p className="squibb-confidence__why">
          {why} {isExample ? EXAMPLE_RULES_SCORE_DISCLAIMER : LIVE_RULES_SCORE_DISCLAIMER}
        </p>
      </div>
    );
  }

  return (
    <div className="squibb-confidence" aria-labelledby="squibbConfidenceTitle">
      <div className="squibb-confidence__header">
        <h3 id="squibbConfidenceTitle">Confidence</h3>
        <span className={`squibb-confidence__badge squibb-confidence__badge--${label}`}>{label}</span>
        <span className="squibb-confidence__score" aria-label={`Confidence score ${clamped} out of 100`}>
          {clamped}%
        </span>
      </div>
      <div
        className="squibb-confidence__track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        aria-label="Recommendation confidence"
      >
        <div className="squibb-confidence__fill" style={{ width: `${clamped}%` }} />
      </div>
      <p className="squibb-confidence__why">{why}</p>
    </div>
  );
}
