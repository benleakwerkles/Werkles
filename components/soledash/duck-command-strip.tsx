"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import type {
  ActionLifecycle,
  DecisionButton,
  DecisionReceipt,
  DecisionSurfaceView,
  FrontierQueueItem,
  Proposal,
  ReceiptCenterEntry
} from "@/protocol/index";

import { FailureRetryGate } from "@/components/soledash/failure-retry-gate";
import { AdvancedDetails } from "@/components/soledash/advanced-details";
import { OperatorSurfaceLines } from "@/components/soledash/operator-surface-lines";
import { RelayResultPanel } from "@/components/soledash/relay-result-panel";
import { NextStepPanel } from "@/components/soledash/next-step-panel";
import { ReceiptDrawer } from "@/components/soledash/receipt-drawer";
import { ProvenanceLabel } from "@/components/soledash/provenance-label";
import { formatRelayReceiptReadable } from "@/lib/soledash/automatica-relay/relay-receipt-format";
import type { RelayCardActionKind } from "@/lib/soledash/automatica-relay/artifact-types";
import { useRelayCards } from "@/lib/soledash/automatica-relay/use-relay-cards";
import type { RelayCardView } from "@/lib/soledash/automatica-relay/types";
import { buildGuillotineSections } from "@/lib/soledash/guillotine/build-sections";
import { DEFAULT_CARD_CONTEXT } from "@/lib/soledash/guillotine/card-context";
import { buildDrawerSections, drawerAttentionCount } from "@/lib/soledash/receipt-drawer/build-sections";
import { provenanceFromDecisionView, provenanceFromRelayCard } from "@/lib/soledash/provenance/compute";
import { operatorStatusClass } from "@/lib/soledash/guillotine/operator-status";
import type { GateResolution } from "@/lib/soledash/human-gate/types";

export type DuckTab = "command" | "receipts" | "gates" | "review";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm} UTC`;
  } catch {
    return iso;
  }
}

function relayCanFire(card: RelayCardView): boolean {
  return (
    card.routeConnected &&
    (card.state === "READY" ||
      card.state === "RECEIPT RETURNED" ||
      card.state === "BLOCKED" ||
      card.state === "EXPLODED")
  );
}

function DeliberateTap({
  id,
  label,
  confirmLabel,
  busyLabel,
  variant,
  disabled,
  busy,
  onConfirm
}: {
  id: string;
  label: string;
  confirmLabel: string;
  busyLabel: string;
  variant: "yea" | "fire" | "approve";
  disabled?: boolean;
  busy?: boolean;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (disabled || busy) setArmed(false);
  }, [disabled, busy]);

  if (armed) {
    return (
      <div className="sd-duck-deliberate" role="group" aria-label={`Confirm ${label}`}>
        <p className="sd-duck-deliberate__prompt">Tap again to confirm</p>
        <button
          type="button"
          className={`sd-duck-btn sd-duck-btn--${variant} sd-duck-btn--confirm`}
          disabled={disabled || busy}
          onClick={() => {
            onConfirm();
            setArmed(false);
          }}
        >
          {busy ? busyLabel : confirmLabel}
        </button>
        <button
          type="button"
          className="sd-duck-btn sd-duck-btn--ghost"
          disabled={busy}
          onClick={() => setArmed(false)}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`sd-duck-btn sd-duck-btn--${variant}`}
      disabled={disabled || busy}
      aria-describedby={`${id}-hint`}
      onClick={() => setArmed(true)}
    >
      {busy ? busyLabel : label}
    </button>
  );
}

function DuckRelayCard({
  card,
  busy,
  onFire,
  onOpenReceipt
}: {
  card: RelayCardView;
  busy: boolean;
  onFire: () => void;
  onOpenReceipt: () => void;
}) {
  const stateSlug = card.state.toLowerCase().replace(/\s+/g, "-");
  const primaryArtifact = card.artifacts[0];
  const receiptPath = card.receipt.receiptPath ?? card.receiptPath;
  const canFire = relayCanFire(card);
  const showCard = canFire || card.state !== "READY" || card.routeConnected;
  if (!showCard) return null;

  return (
    <article
      className={`sd-duck-relay sd-duck-relay--${stateSlug} ${!card.routeConnected ? "sd-duck-relay--disconnected" : ""}`}
    >
      <div className="sd-duck-relay__head">
        <h3 className="sd-duck-relay__name">{card.name}</h3>
        <span className={`sd-duck-relay__state sd-duck-relay__state--${stateSlug}`}>{card.state}</span>
      </div>
      <OperatorSurfaceLines
        intent={card.name}
        status={card.state}
        receipt={receiptPath ?? primaryArtifact?.value ?? card.expectedReceipt ?? "—"}
      />
      <AdvancedDetails className="sd-duck-relay__advanced">
        <dl className="sd-duck-relay__facts">
          <div>
            <dt>Owner</dt>
            <dd>{card.owner}</dd>
          </div>
          <div>
            <dt>Machine</dt>
            <dd>{card.targetComputer}</dd>
          </div>
        </dl>
        <ProvenanceLabel provenance={provenanceFromRelayCard(card)} compact className="sd-duck-relay__prov" />
      </AdvancedDetails>
      <RelayResultPanel
        translation={card.resultTranslation}
        compact
        canOpenReceipt={Boolean(receiptPath && card.packetId)}
        onOpenReceipt={onOpenReceipt}
      />
      {primaryArtifact?.href ? (
        <a
          href={primaryArtifact.href}
          className="sd-duck-relay__link"
          target="_blank"
          rel="noreferrer"
        >
          {primaryArtifact.label}: {primaryArtifact.value}
        </a>
      ) : null}
      {card.blocker && !card.failureContext ? (
        <p className="sd-duck-relay__blocker">{card.blocker}</p>
      ) : null}
      {!card.routeConnected && card.state === "READY" ? (
        <p className="sd-duck-relay__warn">Route not connected — no fire control.</p>
      ) : null}
      {card.failureContext ? (
        <FailureRetryGate
          context={card.failureContext}
          retryLabel="RETRY"
          busy={busy}
          renderRetry={({ ready, busy: retryBusy, onRetry }) =>
            ready && canFire ? (
              <DeliberateTap
                id={`relay-fire-${card.id}`}
                label="RETRY"
                confirmLabel="Confirm RETRY"
                busyLabel="Firing…"
                variant="fire"
                disabled={!canFire}
                busy={retryBusy}
                onConfirm={onRetry}
              />
            ) : null
          }
          onRetry={onFire}
        />
      ) : null}
      <div className="sd-duck-relay__actions">
        {canFire && !card.failureContext ? (
          <DeliberateTap
            id={`relay-fire-${card.id}`}
            label="FIRE"
            confirmLabel="Confirm FIRE"
            busyLabel="Firing…"
            variant="fire"
            disabled={!canFire}
            busy={busy}
            onConfirm={onFire}
          />
        ) : null}
        {receiptPath && card.packetId ? (
          <button type="button" className="sd-duck-relay__receipt-link" disabled={busy} onClick={onOpenReceipt}>
            Open receipt
          </button>
        ) : null}
      </div>
    </article>
  );
}

function DuckRelayList({
  cards,
  loading,
  busyId,
  runAction,
  fetchReceipt
}: {
  cards: RelayCardView[];
  loading: boolean;
  busyId: string | null;
  runAction: (cardId: string, action: RelayCardActionKind, cousin?: string) => Promise<{ ok: boolean; detail: string }>;
  fetchReceipt: (packetId: string) => Promise<Record<string, unknown> | null>;
}) {
  const [receiptModal, setReceiptModal] = useState<Record<string, unknown> | null>(null);
  const visible = cards.filter((c) => c.state !== "READY" || c.routeConnected);

  return (
    <section className="sd-duck-relay-list" aria-label="Relay cards">
      <div className="sd-duck-relay-list__head">
        <h2 className="sd-duck-relay-list__title">Relay cards</h2>
        <span className="sd-duck-relay-list__count">{visible.length}</span>
      </div>
      {loading && visible.length === 0 ? (
        <p className="sd-duck-relay-list__empty">Loading relay cards…</p>
      ) : visible.length === 0 ? (
        <p className="sd-duck-relay-list__empty">No wired relay cards ready.</p>
      ) : (
        <div className="sd-duck-relay-list__stack">
          {visible.map((card) => (
            <DuckRelayCard
              key={card.id}
              card={card}
              busy={busyId === card.id}
              onFire={() => void runAction(card.id, "approve")}
              onOpenReceipt={() => {
                if (!card.packetId) return;
                void fetchReceipt(card.packetId).then((r) => r && setReceiptModal(r));
              }}
            />
          ))}
        </div>
      )}
      {receiptModal ? (
        <div className="sd-duck-sheet-backdrop" role="presentation" onClick={() => setReceiptModal(null)}>
          <div
            className="sd-duck-sheet"
            role="dialog"
            aria-label="Relay receipt"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sd-duck-sheet__head">
              <h3>Relay receipt</h3>
              <button type="button" className="sd-duck-btn sd-duck-btn--ghost" onClick={() => setReceiptModal(null)}>
                Close
              </button>
            </div>
            <dl className="sd-duck-sheet__dl">
              {formatRelayReceiptReadable(receiptModal).map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DuckHumanGate({
  gate,
  busy,
  activeAction,
  unavailable,
  onApprove,
  onReject,
  onDefer
}: {
  gate: GateResolution;
  busy: boolean;
  activeAction: string | null;
  unavailable: boolean;
  onApprove: () => void;
  onReject: () => void;
  onDefer: () => void;
}) {
  if (!gate.redCard) {
    return (
      <section className="sd-duck-gates sd-duck-gates--clear" aria-label="Human gates">
        <p className="sd-duck-gates__tier">
          Gate tier: <strong>{gate.tier.toUpperCase()}</strong>
        </p>
        <p className="sd-duck-gates__empty">No RED human gate — mechanical proceed or receipt-after execution.</p>
        <p className="sd-duck-gates__line">{gate.gate.operator_line}</p>
      </section>
    );
  }

  const card = gate.redCard;

  return (
    <section className="sd-duck-gates sd-duck-gates--red" aria-label="Human gates">
      <div className="sd-hgate sd-hgate--duck">
        <div className="sd-hgate__signal">RED · Human gate</div>
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
      </div>
      <div className="sd-duck-gates__actions">
        <DeliberateTap
          id="gate-approve"
          label="Approve gate"
          confirmLabel="Confirm approve"
          busyLabel="Approving…"
          variant="approve"
          disabled={unavailable}
          busy={busy && activeAction === "yea"}
          onConfirm={onApprove}
        />
        <button
          type="button"
          className="sd-duck-btn sd-duck-btn--nay"
          disabled={busy || unavailable}
          onClick={onReject}
        >
          {busy && activeAction === "nay" ? "Rejecting…" : "Reject"}
        </button>
        <button
          type="button"
          className="sd-duck-btn sd-duck-btn--ghost"
          disabled={busy || unavailable}
          onClick={onDefer}
        >
          {busy && activeAction === "defer" ? "Deferring…" : "Defer"}
        </button>
      </div>
    </section>
  );
}

function DuckReviewPanel({
  view,
  sections,
  lifecycle,
  decisionReceipt,
  lastRefresh
}: {
  view: DecisionSurfaceView;
  sections: ReturnType<typeof buildGuillotineSections>;
  lifecycle: ActionLifecycle;
  decisionReceipt: DecisionReceipt;
  lastRefresh: string;
}) {
  const surfaceProvenance = provenanceFromDecisionView(view, lastRefresh);
  const blocked = sections.working.filter((c) => c.status === "Blocked by Dependency").length;
  const building = sections.working.filter((c) => c.status === "Now Building").length;

  return (
    <section className="sd-duck-review" aria-label="Review">
      <div className="sd-duck-review__counts" aria-label="Build counts">
        <span>{building} now building</span>
        <span>{blocked} blocked</span>
        <span>{sections.receipts.length} receipts</span>
      </div>
      <AdvancedDetails className="sd-duck-review__advanced">
        <ProvenanceLabel provenance={surfaceProvenance} compact />
      </AdvancedDetails>
      {sections.frontier ? (
        <article className={`sd-duck-review__card sd-duck-review__card--${operatorStatusClass(sections.frontier.status)}`}>
          <OperatorSurfaceLines
            intent={
              <>
                <strong>{sections.frontier.title}</strong>
                <p className="sd-duck-review__purpose">{sections.frontier.purpose}</p>
              </>
            }
            status={sections.frontier.status}
            receipt={sections.frontier.receiptReturn}
          />
          <AdvancedDetails className="sd-duck-review__card-advanced">
            <code className="sd-duck-review__id">{sections.frontier.cardId}</code>
            <p className="sd-duck-review__meta">
              {sections.frontier.owner} @ {sections.frontier.machine}
            </p>
          </AdvancedDetails>
        </article>
      ) : null}
      {lifecycle.phase !== "idle" ? (
        <p className="sd-duck-review__lifecycle">{lifecycle.message ?? lifecycle.phase}</p>
      ) : null}
      {decisionReceipt.outcome ? (
        <p className="sd-duck-review__outcome">{decisionReceipt.outcome}</p>
      ) : null}
      {sections.working.slice(0, 4).map((card) => (
        <article
          key={card.id}
          className={`sd-duck-review__card sd-duck-review__card--${operatorStatusClass(card.status)}`}
        >
          <OperatorSurfaceLines
            intent={
              <>
                <strong>{card.title}</strong>
                <p className="sd-duck-review__purpose">{card.purpose}</p>
              </>
            }
            status={card.status}
            receipt={card.receiptReturn}
          />
          <AdvancedDetails className="sd-duck-review__card-advanced">
            <code className="sd-duck-review__id">{card.cardId}</code>
            <p className="sd-duck-review__meta">
              {card.owner} @ {card.machine}
            </p>
          </AdvancedDetails>
        </article>
      ))}
    </section>
  );
}

function DuckThumbBar({
  tab,
  gateCount,
  receiptCount,
  onTab
}: {
  tab: DuckTab;
  gateCount: number;
  receiptCount: number;
  onTab: (t: DuckTab) => void;
}) {
  const items: { id: DuckTab; label: string; badge?: number }[] = [
    { id: "command", label: "Command" },
    { id: "receipts", label: "Receipts", badge: receiptCount > 0 ? receiptCount : undefined },
    { id: "gates", label: "Gates", badge: gateCount > 0 ? gateCount : undefined },
    { id: "review", label: "Review" }
  ];

  return (
    <nav className="sd-duck-bar" aria-label="Duck command strip">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`sd-duck-bar__tab ${tab === item.id ? "sd-duck-bar__tab--active" : ""}`}
          aria-current={tab === item.id ? "page" : undefined}
          onClick={() => onTab(item.id)}
        >
          <span className="sd-duck-bar__label">{item.label}</span>
          {item.badge != null ? (
            <span className="sd-duck-bar__badge" aria-label={`${item.badge} items`}>
              {item.badge > 9 ? "9+" : item.badge}
            </span>
          ) : null}
        </button>
      ))}
    </nav>
  );
}

export function DuckCommandStrip({
  view,
  gate,
  routeButtons,
  unavailable,
  hasBlocker,
  busy,
  activeAction,
  refreshing,
  lastRefresh,
  mergedReceipts,
  actionLifecycle,
  decisionReceipt,
  proposal,
  frontier,
  blocker,
  frontierCode,
  frontierTitle,
  onRefresh,
  onYea,
  onNay,
  onRouteAction,
  onGateApprove,
  onGateReject,
  onGateDefer
}: {
  view: DecisionSurfaceView;
  gate: GateResolution;
  routeButtons: DecisionButton[];
  unavailable: boolean;
  hasBlocker: boolean;
  busy: boolean;
  activeAction: string | null;
  refreshing: boolean;
  lastRefresh: string;
  mergedReceipts: ReceiptCenterEntry[];
  actionLifecycle: ActionLifecycle;
  decisionReceipt: DecisionReceipt;
  proposal: Proposal | null;
  frontier: FrontierQueueItem | null;
  blocker: import("@/protocol/index").CurrentBlocker;
  frontierCode: string;
  frontierTitle: string;
  onRefresh: () => void;
  onYea: () => void;
  onNay: () => void;
  onRouteAction: (actionId: string) => void;
  onGateApprove: () => void;
  onGateReject: () => void;
  onGateDefer: () => void;
}) {
  const [tab, setTab] = useState<DuckTab>("command");
  const { cards: relayCards, loading: relayLoading, busyId, runAction, fetchReceipt } = useRelayCards(onRefresh);

  const surfaceProvenance = provenanceFromDecisionView(view, lastRefresh);

  const sections = buildGuillotineSections({
    payload: view.payload,
    proposal,
    frontier,
    gate,
    lifecycle: actionLifecycle,
    decisionReceipt,
    receipts: mergedReceipts,
    relayCards,
    blocker,
    hasBlocker,
    unavailable,
    surfaceProvenance,
    context: { ...DEFAULT_CARD_CONTEXT, machineLabel: view.machine_label }
  });

  const gateCount = gate.redCard ? 1 : 0;
  const receiptCount = useMemo(
    () =>
      drawerAttentionCount(
        buildDrawerSections({
          machineLabel: view.machine_label,
          payloadUpdatedAt:
            view.payload.updated_at ?? view.payload.generated_at ?? lastRefresh,
          receipts: mergedReceipts,
          relayCards,
          decisionReceipt,
          approvals: {},
          approver: "Ben"
        })
      ),
    [view.machine_label, mergedReceipts, relayCards, decisionReceipt]
  );

  const refreshHeader = (
    <header className="sd-duck-header">
      <p className="sd-duck-header__eyebrow">SoleDash · Duck</p>
      <button type="button" className="sd-duck-header__refresh" disabled={refreshing} onClick={onRefresh}>
        {refreshing ? "…" : "Refresh"}
      </button>
      <time className="sd-duck-header__time" dateTime={lastRefresh}>
        {formatTime(lastRefresh)}
      </time>
    </header>
  );

  let panel: ReactNode;
  switch (tab) {
    case "receipts":
      panel = (
        <ReceiptDrawer
          machineLabel={view.machine_label}
          payloadUpdatedAt={
            view.payload.updated_at ?? view.payload.generated_at ?? lastRefresh
          }
          receipts={mergedReceipts}
          relayCards={relayCards}
          decisionReceipt={decisionReceipt}
          surfaceProvenance={surfaceProvenance}
          compact
          onRefresh={onRefresh}
        />
      );
      break;
    case "gates":
      panel = (
        <DuckHumanGate
          gate={gate}
          busy={busy}
          activeAction={activeAction}
          unavailable={unavailable}
          onApprove={onGateApprove}
          onReject={onGateReject}
          onDefer={onGateDefer}
        />
      );
      break;
    case "review":
      panel = (
        <DuckReviewPanel
          view={view}
          sections={sections}
          lifecycle={actionLifecycle}
          decisionReceipt={decisionReceipt}
          lastRefresh={lastRefresh}
        />
      );
      break;
    default:
      panel = (
        <>
          <NextStepPanel
            proposal={proposal}
            stepCode={frontierCode}
            stepTitle={frontierTitle}
            payloadOwner={frontier?.owner ?? view.payload.queue_brain?.active_owner ?? view.payload.active_owner ?? null}
            unavailable={unavailable}
            busy={busy}
            activeAction={activeAction}
            gate={gate}
            routeButtons={routeButtons}
            compact
            surfaceProvenance={surfaceProvenance}
            onRefresh={onRefresh}
            onYea={onYea}
            onNay={onNay}
            onRouteAction={onRouteAction}
          />
          <DuckRelayList
            cards={relayCards}
            loading={relayLoading}
            busyId={busyId}
            runAction={runAction}
            fetchReceipt={fetchReceipt}
          />
        </>
      );
  }

  return (
    <div className="sd-duck-root">
      {refreshHeader}
      <main className="sd-duck-main">{panel}</main>
      <DuckThumbBar tab={tab} gateCount={gateCount} receiptCount={receiptCount} onTab={setTab} />
    </div>
  );
}

export function useDuckViewport(): boolean {
  const [duck, setDuck] = useState(false);

  const check = useCallback(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("duck") === "1") {
      setDuck(true);
      return;
    }
    setDuck(window.matchMedia("(max-width: 768px)").matches);
  }, []);

  useEffect(() => {
    check();
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = () => check();
    mq.addEventListener("change", onChange);
    window.addEventListener("popstate", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("popstate", onChange);
    };
  }, [check]);

  return duck;
}
