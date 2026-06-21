"use client";

import type { DecisionButton, DecisionSurfaceView } from "@/protocol/index";

import { ArtifactShelfPanel } from "@/components/soledash/artifact-shelf";
import { ForgePanel } from "@/components/soledash/forge-panel";
import { GuillotineWorkingCard } from "@/components/soledash/guillotine-working-card";
import { HumanGatePanel } from "@/components/soledash/human-gate-panel";
import { MachineWallPanel } from "@/components/soledash/machine-wall-panel";
import { NextStepPanel } from "@/components/soledash/next-step-panel";
import { PearlShelfPanel } from "@/components/soledash/pearl-shelf-panel";
import { PetraStatusPanel } from "@/components/soledash/petra-status-panel";
import { PermissionSwatterReceiptLog } from "@/components/soledash/permission-swatter-receipt-log";
import { ProvenanceLabel } from "@/components/soledash/provenance-label";
import { ReceiptDrawer } from "@/components/soledash/receipt-drawer";
import { WonkaDenRoom } from "@/components/soledash/wonka-den-room";
import type { DenZoneId } from "@/lib/soledash/wonka-den-room/zones";
import type { ReactNode } from "react";
import { useRelayCards } from "@/lib/soledash/automatica-relay/use-relay-cards";
import { buildGuillotineSections } from "@/lib/soledash/guillotine/build-sections";
import { DEFAULT_CARD_CONTEXT } from "@/lib/soledash/guillotine/card-context";
import { buildDrawerSections, drawerAttentionCount } from "@/lib/soledash/receipt-drawer/build-sections";
import type { GuillotineCard } from "@/lib/soledash/guillotine/types";
import type { GateResolution } from "@/lib/soledash/human-gate/types";
import { provenanceFromDecisionView } from "@/lib/soledash/provenance/compute";

const SOLEDASH_LOGO = "/assets/soledash/branding/logo-a-transparent.png";

function WorkbenchPanel({ cards, empty }: { cards: GuillotineCard[]; empty: string }) {
  if (cards.length === 0) {
    return (
      <div className="sd-workbench">
        <p className="sd-workbench__lead">Send → receive on one card — nothing on the bench yet.</p>
        <p className="sd-guill-section__empty">{empty}</p>
      </div>
    );
  }
  return (
    <div className="sd-workbench">
      <p className="sd-workbench__lead">Send → receive on one card. Draft, Sent, Received, or Failed — response stays here, not in a mystery folder.</p>
      <div className="sd-guill-section__stack">
        {cards.map((card, index) => (
          <GuillotineWorkingCard key={card.id} card={card} conflictIndex={index} />
        ))}
      </div>
    </div>
  );
}

export function GuillotineSurface({
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
  mergedReceipts: import("@/protocol/index").ReceiptCenterEntry[];
  actionLifecycle: import("@/protocol/index").ActionLifecycle;
  decisionReceipt: import("@/protocol/index").DecisionReceipt;
  proposal: import("@/protocol/index").Proposal | null;
  frontier: import("@/protocol/index").FrontierQueueItem | null;
  blocker: import("@/protocol/index").CurrentBlocker;
  onRefresh: () => void;
  onYea: () => void;
  onNay: () => void;
  onRouteAction: (actionId: string) => void;
  onGateApprove: () => void;
  onGateReject: () => void;
  onGateDefer: () => void;
}) {
  const { cards: relayCards } = useRelayCards(onRefresh);
  const payload = view.payload;
  const surfaceProvenance = provenanceFromDecisionView(view, lastRefresh);
  const sections = buildGuillotineSections({
    payload,
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

  const blockedCount = sections.working.filter((c) => c.status === "Blocked by Dependency").length;
  const buildingCount = sections.working.filter((c) => c.status === "Now Building").length;
  const drawerPreview = buildDrawerSections({
    machineLabel: view.machine_label,
    payloadUpdatedAt: payload.updated_at ?? payload.generated_at ?? lastRefresh,
    receipts: mergedReceipts,
    relayCards,
    decisionReceipt,
    approvals: {},
    approver: "Ben"
  });
  const receiptAttention = drawerAttentionCount(drawerPreview);

  const stepTitle = proposal?.title ?? frontier?.title ?? "What do you want built?";

  const zonePanels: Record<DenZoneId, ReactNode> = {
    "main-desk": (
      <NextStepPanel
        composerOnly
        proposal={proposal}
        stepCode={frontier?.action_code ?? proposal?.action_code ?? "—"}
        stepTitle={stepTitle}
        payloadOwner={frontier?.owner ?? payload.queue_brain?.active_owner ?? payload.active_owner ?? null}
        unavailable={unavailable}
        busy={busy}
        activeAction={activeAction}
        gate={gate}
        routeButtons={routeButtons}
        surfaceProvenance={surfaceProvenance}
        onRefresh={onRefresh}
        onYea={onYea}
        onNay={onNay}
        onRouteAction={onRouteAction}
      />
    ),
    workbench: (
      <WorkbenchPanel
        cards={sections.working}
        empty="Nothing on the bench — pick Main Desk or run a safe proof."
      />
    ),
    "machine-wall": <MachineWallPanel rosterOnly />,
    "receipt-wall": (
      <ReceiptDrawer
        machineLabel={view.machine_label}
        payloadUpdatedAt={payload.updated_at ?? payload.generated_at ?? lastRefresh}
        receipts={mergedReceipts}
        relayCards={relayCards}
        decisionReceipt={decisionReceipt}
        surfaceProvenance={surfaceProvenance}
        onRefresh={onRefresh}
      />
    ),
    "artifact-shelf": <ArtifactShelfPanel receiptAttention={receiptAttention} />,
    "pearl-shelf": <PearlShelfPanel />,
    forge: <ForgePanel />,
    "permission-swatter": <PermissionSwatterReceiptLog />
  };

  return (
    <div className="sd-guill-root sd-guill-root--den">
      <header className="sd-guill-header sd-guill-header--den">
        <div className="sd-guill-header__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SOLEDASH_LOGO} alt="AEYE SoleDash" className="sd-guill-header__logo" width={140} height={42} />
        </div>
        <div className="sd-guill-header__meta">
          <PetraStatusPanel />
          <button type="button" className="sd-guill-refresh" disabled={refreshing} onClick={onRefresh}>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        <details className="sd-advanced sd-guill-header__advanced">
          <summary className="sd-advanced__summary">Advanced Details</summary>
          <div className="sd-advanced__body sd-guill-header__advanced-body">
            <ProvenanceLabel provenance={surfaceProvenance} compact />
            <span className="sd-guill-header__machine">{view.machine_label}</span>
            <span className="sd-guill-count">{buildingCount} building</span>
            <span className="sd-guill-count">{blockedCount} blocked</span>
            <span className="sd-guill-count">{receiptAttention} receipts</span>
          </div>
        </details>
      </header>

      <WonkaDenRoom
        teasers={{
          stepTitle,
          buildingCount,
          receiptAttention
        }}
        panels={zonePanels}
      />

      {proposal && gate.redCard ? (
        <HumanGatePanel
          card={gate.redCard}
          busy={busy}
          activeAction={activeAction}
          unavailable={unavailable}
          provenance={surfaceProvenance}
          onApprove={onGateApprove}
          onReject={onGateReject}
          onDefer={onGateDefer}
        />
      ) : null}
    </div>
  );
}
