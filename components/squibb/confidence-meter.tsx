import type { ConfidenceLabel } from "@/lib/squibb/walkthrough-types";

type ConfidenceMeterProps = {
  score: number;
  label: ConfidenceLabel;
  why: string;
  variant?: "confidence" | "rules_score";
};

const SUPPORT_BAND: Record<ConfidenceLabel, string> = {
  high: "Strong input match",
  medium: "Some input match",
  low: "Thin input match"
};

const RULES_SCORE_DISCLAIMER =
  "This only measures how many of your answers support this option. It does not predict success or eligibility.";

export function ConfidenceMeter({ score, label, why, variant = "confidence" }: ConfidenceMeterProps) {
  const clamped = Math.min(100, Math.max(0, score));

  if (variant === "rules_score") {
    const band = SUPPORT_BAND[label] ?? SUPPORT_BAND.low;

    return (
      <div className="squibb-confidence" aria-labelledby="squibbRulesScoreTitle">
        <div className="squibb-confidence__header">
          <h3 id="squibbRulesScoreTitle">How Werkles ordered it</h3>
          <span className={`squibb-confidence__badge squibb-confidence__badge--${label}`}>
            {band}
          </span>
        </div>
        <p className="squibb-confidence__why">
          {why.includes("not a probability") ? why : `${why} ${RULES_SCORE_DISCLAIMER}`}
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
