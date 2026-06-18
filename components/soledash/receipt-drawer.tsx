"use client";

import { useMemo } from "react";

import type { DecisionReceipt, ReceiptCenterEntry } from "@/protocol/index";
import type { RelayCardView } from "@/lib/soledash/automatica-relay/types";
import { AdvancedDetails } from "@/components/soledash/advanced-details";
import { OperatorSurfaceLines } from "@/components/soledash/operator-surface-lines";
import { buildDrawerSections, drawerAttentionCount } from "@/lib/soledash/receipt-drawer/build-sections";
import { dispositionLabel } from "@/lib/soledash/receipt-drawer/recommendations";
import { ProvenanceLabel } from "@/components/soledash/provenance-label";
import { useReceiptDrawer } from "@/lib/soledash/receipt-drawer/use-receipt-drawer";
import type { DrawerAction, DrawerReceipt, DrawerSectionId } from "@/lib/soledash/receipt-drawer/types";

const SECTIONS: { id: DrawerSectionId; title: string; hint: string; empty: string }[] = [
  {
    id: "new",
    title: "New Receipts",
    hint: "Fresh proof — review before approving.",
    empty: "No new receipts."
  },
  {
    id: "needs_review",
    title: "Needs Review",
    hint: "Failures and follow-ups needing eyes.",
    empty: "Nothing waiting for review."
  },
  {
    id: "approved",
    title: "Approved",
    hint: "Accepted proof — closed from queue.",
    empty: "No approved receipts yet."
  },
  {
    id: "archived",
    title: "Archived",
    hint: "Rejected or retired.",
    empty: "No archived receipts."
  }
];

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

function receiptProofLine(receipt: DrawerReceipt): string {
  if (receipt.receiptLink) return receipt.artifact;
  return receipt.artifact !== "—" ? receipt.artifact : receipt.result;
}

function ReceiptCard({
  receipt,
  busy,
  compact,
  cardNotice,
  onAction
}: {
  receipt: DrawerReceipt;
  busy: boolean;
  compact?: boolean;
  cardNotice: string | null;
  onAction: (action: DrawerAction) => void;
}) {
  const disposition = dispositionLabel(receipt.disposition);
  const isApproved = receipt.disposition === "approved";
  const isRejected = receipt.disposition === "rejected";
  const showActions = !isApproved && !isRejected;
  const statusLine = `${disposition}${receipt.simulated ? " · sim" : ""} · ${receipt.result}`;

  return (
    <article className={`sd-rdraw-card ${compact ? "sd-rdraw-card--compact" : ""}`}>
      {isApproved && receipt.dispositionRecord ? (
        <p className="sd-rdraw-card__approved" role="status">
          ✓ Approved · {formatTime(receipt.dispositionRecord.acted_at)} · {receipt.dispositionRecord.acted_by}
        </p>
      ) : null}

      {cardNotice ? (
        <p className="sd-rdraw-card__notice" role="status">
          {cardNotice}
        </p>
      ) : null}

      <OperatorSurfaceLines
        intent={<strong className="sd-op-surface__intent-title">{receipt.title}</strong>}
        status={statusLine}
        receipt={
          receipt.receiptLink ? (
            <code className="sd-rdraw-card__artifact">{receiptProofLine(receipt)}</code>
          ) : (
            receiptProofLine(receipt)
          )
        }
      />

      <AdvancedDetails className="sd-rdraw-card__advanced">
        <dl className="sd-rdraw-card__facts">
          <div>
            <dt>Card</dt>
            <dd>
              <code>{receipt.cardId}</code>
            </dd>
          </div>
          <div>
            <dt>Owner</dt>
            <dd>{receipt.owner}</dd>
          </div>
          <div>
            <dt>Machine</dt>
            <dd>{receipt.machine}</dd>
          </div>
          <div>
            <dt>Timestamp</dt>
            <dd>{formatTime(receipt.timestamp)}</dd>
          </div>
          <div className="sd-rdraw-card__wide">
            <dt>Next Recommendation</dt>
            <dd className="sd-rdraw-card__rec">{receipt.nextRecommendation}</dd>
          </div>
        </dl>
        <ProvenanceLabel provenance={receipt.provenance} compact className="sd-rdraw-card__prov" />
      </AdvancedDetails>

      {showActions ? (
        <div className="sd-rdraw-card__actions" aria-label="Receipt actions">
          <button
            type="button"
            className="sd-rdraw-btn sd-rdraw-btn--approve"
            disabled={busy || isApproved}
            onClick={() => onAction("approve")}
          >
            {busy ? "…" : "Approve"}
          </button>
          <button
            type="button"
            className="sd-rdraw-btn sd-rdraw-btn--reject"
            disabled={busy}
            onClick={() => onAction("reject")}
          >
            {busy ? "…" : "Reject"}
          </button>
          <button
            type="button"
            className="sd-rdraw-btn sd-rdraw-btn--follow"
            disabled={busy}
            onClick={() => onAction("follow_up")}
          >
            {busy ? "…" : "Follow-Up"}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function DrawerSectionView({
  id,
  title,
  hint,
  empty,
  receipts,
  busyId,
  compact,
  cardNotices,
  onAction
}: {
  id: DrawerSectionId;
  title: string;
  hint: string;
  empty: string;
  receipts: DrawerReceipt[];
  busyId: string | null;
  compact?: boolean;
  cardNotices: Record<string, string>;
  onAction: (receiptId: string, cardId: string, action: DrawerAction) => void;
}) {
  return (
    <section className="sd-rdraw-section" aria-labelledby={`rdraw-${id}`}>
      <div className="sd-rdraw-section__head">
        <h2 id={`rdraw-${id}`} className="sd-rdraw-section__title">
          {title}
          <span className="sd-rdraw-section__count">{receipts.length}</span>
        </h2>
        <p className="sd-rdraw-section__hint">{hint}</p>
      </div>
      {receipts.length === 0 ? (
        <p className="sd-rdraw-section__empty">{empty}</p>
      ) : (
        <div className="sd-rdraw-section__stack">
          {receipts.map((receipt) => (
            <ReceiptCard
              key={receipt.id}
              receipt={receipt}
              busy={busyId === receipt.id}
              compact={compact}
              cardNotice={cardNotices[receipt.id] ?? null}
              onAction={(action) => onAction(receipt.id, receipt.cardId, action)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function ReceiptDrawer({
  machineLabel,
  payloadUpdatedAt,
  receipts,
  relayCards,
  decisionReceipt,
  surfaceProvenance,
  compact,
  onRefresh
}: {
  machineLabel: string;
  payloadUpdatedAt: string;
  receipts: ReceiptCenterEntry[];
  relayCards: RelayCardView[];
  decisionReceipt: DecisionReceipt;
  surfaceProvenance?: import("@/lib/soledash/provenance/types").Provenance;
  compact?: boolean;
  onRefresh?: () => void | Promise<void>;
}) {
  const { approvals, approver, counter, loading, busyId, cardNotices, act } = useReceiptDrawer(onRefresh);

  const sections = useMemo(
    () =>
      buildDrawerSections({
        machineLabel,
        payloadUpdatedAt,
        receipts,
        relayCards,
        decisionReceipt,
        approvals,
        approver
      }),
    [machineLabel, payloadUpdatedAt, receipts, relayCards, decisionReceipt, approvals, approver]
  );

  const attention = drawerAttentionCount(sections);

  async function handleAction(receiptId: string, cardId: string, action: DrawerAction) {
    await act(receiptId, action, cardId);
  }

  return (
    <div className={`sd-rdraw-root ${compact ? "sd-rdraw-root--compact" : ""}`}>
      <header className="sd-rdraw-header">
        <div>
          <h2 className="sd-rdraw-header__title">Receipt Drawer</h2>
          <p className="sd-rdraw-header__hint">Intent · status · proof — no hunting.</p>
        </div>
        <div className="sd-rdraw-header__badges" aria-label="Receipt queue">
          <span className="sd-rdraw-badge sd-rdraw-badge--approved" aria-label="Unique approved cards">
            {counter.uniqueApproved} approved
          </span>
          <span className="sd-rdraw-badge sd-rdraw-badge--new">{sections.counts.new} new</span>
          <span className="sd-rdraw-badge sd-rdraw-badge--review">{sections.counts.needs_review} review</span>
          {attention > 0 ? (
            <span className="sd-rdraw-badge sd-rdraw-badge--attention">{attention} need you</span>
          ) : null}
        </div>
      </header>

      {surfaceProvenance ? (
        <AdvancedDetails className="sd-rdraw-header__advanced">
          <ProvenanceLabel provenance={surfaceProvenance} compact className="sd-rdraw-header__prov" />
        </AdvancedDetails>
      ) : null}

      {loading ? <p className="sd-rdraw-status">Loading dispositions…</p> : null}

      {SECTIONS.map((section) => (
        <DrawerSectionView
          key={section.id}
          id={section.id}
          title={section.title}
          hint={section.hint}
          empty={section.empty}
          receipts={sections[section.id]}
          busyId={busyId}
          compact={compact}
          cardNotices={cardNotices}
          onAction={handleAction}
        />
      ))}
    </div>
  );
}

export { drawerAttentionCount };
