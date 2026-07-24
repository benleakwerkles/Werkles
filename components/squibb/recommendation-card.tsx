import type { SquibbRecommendation } from "@/lib/squibb/recommendations";
import { RECOMMENDATION_KIND_LABELS } from "@/lib/squibb/recommendations";
import { ruleSupportBand } from "@/lib/squibb/rule-support";

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
  const rulesScore = Math.max(0, Math.min(100, Math.round(recommendation.confidence.score)));
  const supportBand = ruleSupportBand(recommendation.confidence.label);
  const approvalRequired = humanGates.some((g) => g.benMustApprove);
  const blocked = humanGates.some((g) => g.severity === "blocker");
  const descriptionIds = [
    `squibb-rec-meta-${id}`,
    `squibb-rec-score-${id}`,
    approvalRequired || blocked ? `squibb-rec-flags-${id}` : null
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
      <span id={`squibb-rec-meta-${id}`} className="squibb-rec-card__meta">
        {rank > 0 ? <span className="squibb-rec-card__rank">#{rank}</span> : null}
        <span className="squibb-rec-card__kind">{RECOMMENDATION_KIND_LABELS[recommendation.kind]}</span>
      </span>
      <span id={`squibb-rec-title-${id}`} className="squibb-rec-card__title">{title}</span>
      {!compact ? <span id={`squibb-rec-summary-${id}`} className="squibb-rec-card__summary">{headline}</span> : null}
      <span
        id={`squibb-rec-score-${id}`}
        className="squibb-rec-card__score"
        aria-label={`Rules score ${rulesScore} out of 100. ${supportBand}.`}
      >
        {rulesScore}/100 <span aria-hidden="true">·</span> {supportBand}
      </span>
      <span id={`squibb-rec-flags-${id}`} className="squibb-rec-card__flags">
        {approvalRequired ? <span className="squibb-rec-card__flag">Review required</span> : null}
        {blocked ? <span className="squibb-rec-card__flag squibb-rec-card__flag--blocker">Blocked</span> : null}
      </span>
    </button>
  );
}
