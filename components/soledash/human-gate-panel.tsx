"use client";

import type { RedGateCard } from "@/lib/soledash/human-gate/types";
import { ProvenanceLabel } from "@/components/soledash/provenance-label";
import type { Provenance } from "@/lib/soledash/provenance/types";

export function HumanGatePanel({
  card,
  busy,
  activeAction,
  unavailable,
  provenance,
  onApprove,
  onReject,
  onDefer
}: {
  card: RedGateCard;
  busy: boolean;
  activeAction: string | null;
  unavailable: boolean;
  provenance: Provenance;
  onApprove: () => void;
  onReject: () => void;
  onDefer: () => void;
}) {
  return (
    <section className="sd-hgate" aria-label="Human gate — approval required">
      <div className="sd-hgate__signal">RED · Human gate</div>
      <ProvenanceLabel provenance={provenance} compact className="sd-hgate__prov" />
      <h2 className="sd-hgate__title">Approval required</h2>
      <p className="sd-hgate__class">{card.classification.replace(/_/g, " ")}</p>

      <div className="sd-hgate__block">
        <p className="sd-hgate__label">Why approval required</p>
        <p className="sd-hgate__body">{card.why}</p>
      </div>

      <div className="sd-hgate__block sd-hgate__block--consequence">
        <p className="sd-hgate__label">Consequence</p>
        <p className="sd-hgate__body">{card.consequence}</p>
      </div>

      {card.detail ? (
        <div className="sd-hgate__block">
          <p className="sd-hgate__label">Detail</p>
          <p className="sd-hgate__body sd-hgate__body--detail">{card.detail}</p>
        </div>
      ) : null}

      {card.transportGap ? (
        <div className="sd-hgate__gap">
          <p className="sd-hgate__gap-head">{card.transportGap.headline}</p>
          <p className="sd-hgate__gap-reason">{card.transportGap.reason}</p>
          {card.transportGap.manual_step ? (
            <p className="sd-hgate__gap-step">{card.transportGap.manual_step}</p>
          ) : null}
        </div>
      ) : null}

      <div className="sd-hgate__actions">
        <button
          type="button"
          className="sd-hgate__btn sd-hgate__btn--approve"
          disabled={busy || unavailable}
          title={unavailable ? "Live payload unavailable" : undefined}
          onClick={onApprove}
        >
          {busy && activeAction === "yea" ? "Approving…" : "Approve"}
        </button>
        <button
          type="button"
          className="sd-hgate__btn sd-hgate__btn--reject"
          disabled={busy || unavailable}
          onClick={onReject}
        >
          {busy && activeAction === "nay" ? "Rejecting…" : "Reject"}
        </button>
        <button
          type="button"
          className="sd-hgate__btn sd-hgate__btn--defer"
          disabled={busy || unavailable}
          onClick={onDefer}
        >
          {busy && activeAction === "defer" ? "Deferring…" : "Defer"}
        </button>
      </div>
    </section>
  );
}
