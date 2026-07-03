import type { SquibbRecommendation } from "@/lib/squibb/recommendations";
import { RECOMMENDATION_KIND_LABELS } from "@/lib/squibb/recommendations";

type RecommendationCardProps = {
  recommendation: SquibbRecommendation;
  selected: boolean;
  compact?: boolean;
  onSelect: (id: string) => void;
};

export function RecommendationCard({
  recommendation,
  selected,
  compact = false,
  onSelect
}: RecommendationCardProps) {
  const { id, rank, title, headline, confidence, humanGates } = recommendation;
  const benGate = humanGates.some((g) => g.benMustApprove);
  const blocked = humanGates.some((g) => g.severity === "blocker");

  return (
    <button
      type="button"
      className={`squibb-rec-card${selected ? " squibb-rec-card--selected" : ""}${compact ? " squibb-rec-card--compact" : ""}`}
      onClick={() => onSelect(id)}
      aria-pressed={selected}
      aria-labelledby={`squibb-rec-title-${id}`}
    >
      <div className="squibb-rec-card__meta">
        {rank > 0 ? <span className="squibb-rec-card__rank">#{rank}</span> : null}
        <span className="squibb-rec-card__kind">{RECOMMENDATION_KIND_LABELS[recommendation.kind]}</span>
        <span className={`squibb-rec-card__confidence squibb-rec-card__confidence--${confidence.label}`}>
          {confidence.score}%
        </span>
      </div>
      <h4 id={`squibb-rec-title-${id}`}>{title}</h4>
      {!compact ? <p>{headline}</p> : null}
      <div className="squibb-rec-card__flags">
        {benGate ? <span className="squibb-rec-card__flag">Ben must approve</span> : null}
        {blocked ? <span className="squibb-rec-card__flag squibb-rec-card__flag--blocker">Blocked</span> : null}
      </div>
    </button>
  );
}
