import type { EvidenceItem } from "@/lib/squibb/recommendations";

const STRENGTH_LABELS: Record<EvidenceItem["strength"], string> = {
  verified: "Verified",
  self_reported: "Self-reported",
  inferred: "Inferred",
  missing: "Missing"
};

type EvidenceSectionProps = {
  items: EvidenceItem[];
};

export function EvidenceSection({ items }: EvidenceSectionProps) {
  return (
    <details className="squibb-evidence squibb-rec-collapse">
      <summary className="squibb-rec-collapse__summary">Proof and gaps</summary>
      <p className="squibb-evidence__lead">
        Squibb stays quiet when evidence is thin. Verified proof clears the path — it does not make the call for
        you.
      </p>
      <ul className="squibb-evidence__list">
        {items.map((item) => (
          <li key={item.id} className={`squibb-evidence__item squibb-evidence__item--${item.strength}`}>
            <div className="squibb-evidence__item-head">
              <span className={`squibb-evidence__strength squibb-evidence__strength--${item.strength}`}>
                {STRENGTH_LABELS[item.strength]}
              </span>
              <strong>{item.label}</strong>
            </div>
            {item.source ? <span className="squibb-evidence__source">{item.source}</span> : null}
          </li>
        ))}
      </ul>
    </details>
  );
}
