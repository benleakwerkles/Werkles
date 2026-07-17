import type { SquibbRecommendation } from "@/lib/squibb/recommendations";
import { RECOMMENDATION_KIND_LABELS } from "@/lib/squibb/recommendations";

type RecommendationCardProps = {
  recommendation: SquibbRecommendation;
  selected: boolean;
  compact?: boolean;
  detailId: string;
  onSelect: (id: string) => void;
};

export function RecommendationCard({
  recommendation,
  selected,
  compact = false,
  detailId,
  onSelect
}: RecommendationCardProps) {
  const { id, rank, title, headline, humanGates } = recommendation;
  const approvalRequired = humanGates.some((g) => g.benMustApprove);
  const blocked = humanGates.some((g) => g.severity === "blocker");
  const descriptionIds = [
    `squibb-rec-meta-${id}`,
    compact ? null : `squibb-rec-summary-${id}`,
    `squibb-rec-flags-${id}`
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={`squibb-rec-card${selected ? " squibb-rec-card--selected" : ""}${compact ? " squibb-rec-card--compact" : ""}`}
      onClick={() => onSelect(id)}
      aria-pressed={selected}
      aria-labelledby={`squibb-rec-title-${id}`}
      aria-describedby={descriptionIds}
      aria-controls={detailId}
    >
      <div id={`squibb-rec-meta-${id}`} className="squibb-rec-card__meta">
        {rank > 0 ? <span className="squibb-rec-card__rank">#{rank}</span> : null}
        <span className="squibb-rec-card__kind">{RECOMMENDATION_KIND_LABELS[recommendation.kind]}</span>
      </div>
      <h4 id={`squibb-rec-title-${id}`}>{title}</h4>
      {!compact ? <p id={`squibb-rec-summary-${id}`}>{headline}</p> : null}
      <div id={`squibb-rec-flags-${id}`} className="squibb-rec-card__flags">
        {approvalRequired ? <span className="squibb-rec-card__flag">Review required</span> : null}
        {blocked ? <span className="squibb-rec-card__flag squibb-rec-card__flag--blocker">Blocked</span> : null}
      </div>
    </button>
  );
}
