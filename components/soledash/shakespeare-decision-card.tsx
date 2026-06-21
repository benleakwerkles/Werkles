"use client";

import { verdictSlug } from "@/lib/soledash/shakespeare/consume-verdict";
import type { ShakespeareDecisionView } from "@/lib/soledash/shakespeare/types";

function ReceiptLink({ href }: { href: string }) {
  const external = /^https?:\/\//i.test(href);
  if (external) {
    return (
      <a className="sd-shake-card__link" href={href} target="_blank" rel="noreferrer">
        Open receipt
      </a>
    );
  }
  return (
    <a className="sd-shake-card__link" href={href}>
      Open receipt
    </a>
  );
}

export function ShakespeareDecisionCard({
  view,
  compact,
  className
}: {
  view: ShakespeareDecisionView;
  compact?: boolean;
  className?: string;
}) {
  const slug = verdictSlug(view.verdict);

  return (
    <article
      className={`sd-shake-card sd-shake-card--${slug} ${compact ? "sd-shake-card--compact" : ""} ${className ?? ""}`.trim()}
      aria-label="Shakespeare decision"
    >
      <div className="sd-shake-card__head">
        <p className="sd-shake-card__eyebrow">Shakespeare verdict</p>
        <span className={`sd-shake-card__verdict sd-shake-card__verdict--${slug}`}>{view.verdict}</span>
      </div>

      <dl className="sd-shake-card__facts">
        <div className="sd-shake-card__fact sd-shake-card__fact--wide">
          <dt>Intent</dt>
          <dd>{view.intent || "—"}</dd>
        </div>
        <div>
          <dt>Verdict</dt>
          <dd>
            <span className={`sd-shake-card__verdict-inline sd-shake-card__verdict-inline--${slug}`}>
              {view.verdict}
            </span>
          </dd>
        </div>
        <div>
          <dt>Rule</dt>
          <dd>
            <code className="sd-shake-card__rule">{view.rule}</code>
          </dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>{view.confidence ?? "—"}</dd>
        </div>
        <div className="sd-shake-card__fact sd-shake-card__fact--wide">
          <dt>Receipt link</dt>
          <dd>
            {view.receiptLink ? (
              <ReceiptLink href={view.receiptLink} />
            ) : (
              <span className="sd-shake-card__muted">No receipt yet</span>
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}
