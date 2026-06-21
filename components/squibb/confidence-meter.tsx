import type { ConfidenceLabel } from "@/lib/squibb/walkthrough-types";

type ConfidenceMeterProps = {
  score: number;
  label: ConfidenceLabel;
  why: string;
};

export function ConfidenceMeter({ score, label, why }: ConfidenceMeterProps) {
  const clamped = Math.min(100, Math.max(0, score));

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
