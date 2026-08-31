import type { SquibbRecommendation } from "@/lib/squibb/recommendations";
import { RECOMMENDATION_KIND_LABELS } from "@/lib/squibb/recommendations";
import { SiteIcon } from "@/components/foundry/site-icon";
import type { SiteIconId } from "@/lib/site-icons";

type RecommendationCardProps = {
  recommendation: SquibbRecommendation;
  selected: boolean;
  compact?: boolean;
  onSelect: (id: string) => void;
};

export function recommendationIconId(kind: SquibbRecommendation["kind"]): SiteIconId {
  switch (kind) {
    case "translate_need":
      return "step-fit";
    case "verify_proof":
      return "product-proof";
    case "stage_intro_candidate":
    case "find_partner":
      return "product-intros";
    case "find_equipment":
      return "icon-armory";
    case "find_banker":
    case "find_credit_union":
    case "raise_capital":
      return "lane-backer";
    case "find_better_job":
    case "stay_current_job":
      return "lane-operator";
    case "relocate":
      return "lane-connector";
    case "get_training":
      return "check-license";
  }
}

export function RecommendationCard({
  recommendation,
  selected,
  compact = false,
  onSelect
}: RecommendationCardProps) {
  const { id, rank, title, headline, humanGates } = recommendation;
  const approvalRequired = humanGates.some((g) => g.benMustApprove);
  const blocked = humanGates.some((g) => g.severity === "blocker");
  const icon = recommendationIconId(recommendation.kind);

  return (
    <button
      type="button"
      className={`squibb-rec-card${selected ? " squibb-rec-card--selected" : ""}${compact ? " squibb-rec-card--compact" : ""}`}
      onClick={() => onSelect(id)}
      onFocus={(event) => event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" })}
      aria-pressed={selected}
      aria-labelledby={`squibb-rec-title-${id}`}
    >
      <div className="squibb-rec-card__topline">
        <span className="squibb-rec-card__medallion" aria-hidden="true">
          <SiteIcon icon={icon} size="sm" />
        </span>
        <div className="squibb-rec-card__meta">
          {rank > 0 ? <span className="squibb-rec-card__rank">#{rank}</span> : null}
          <span className="squibb-rec-card__kind">{RECOMMENDATION_KIND_LABELS[recommendation.kind]}</span>
        </div>
      </div>
      <h4 id={`squibb-rec-title-${id}`}>{title}</h4>
      {!compact ? <p>{headline}</p> : null}
      <div className="squibb-rec-card__flags">
        {approvalRequired ? <span className="squibb-rec-card__flag">Review before relying on it</span> : null}
        {blocked ? <span className="squibb-rec-card__flag squibb-rec-card__flag--blocker">Missing information</span> : null}
      </div>
      <span className="squibb-rec-card__action" aria-hidden="true">
        {selected ? "Selected" : "Read more"}
        <span aria-hidden="true">→</span>
      </span>
    </button>
  );
}
