"use client";

import type {
  ActionLifecycle,
  DecisionButton,
  DecisionReceipt,
  ReceiptCenterEntry
} from "@/protocol/index";

import { HumanGatePanel } from "@/components/soledash/human-gate-panel";
import type { GateTier, RedGateCard } from "@/lib/soledash/human-gate/types";
import type { ReactionEntry } from "@/lib/soledash/options-deck/types";

import {
  MobileCommandActions,
  MobileFrontierPanel,
  MobileLatestReceipt,
  MobileReceiptList,
  MobileRelayCardList
} from "@/components/soledash/mobile-field-command";

export function MobileSdSurface({
  frontierCode,
  frontierTitle,
  proposalSummary,
  evidenceStatus,
  waitingGatesCount,
  waitingGatesHint,
  blockerHeadline,
  reactions,
  redCard,
  gateTier,
  routeButtons,
  unavailable,
  busy,
  activeAction,
  receipts,
  lifecycle,
  receipt,
  onYea,
  onNay,
  onRouteAction,
  onGateApprove,
  onGateReject,
  onGateDefer,
  onRefresh
}: {
  frontierCode: string;
  frontierTitle: string;
  proposalSummary: string | null;
  evidenceStatus: string | null;
  waitingGatesCount: number;
  waitingGatesHint: string | null;
  blockerHeadline: string | null;
  reactions: ReactionEntry[];
  redCard: RedGateCard | null;
  gateTier: GateTier;
  routeButtons: DecisionButton[];
  unavailable: boolean;
  busy: boolean;
  activeAction: string | null;
  receipts: ReceiptCenterEntry[];
  lifecycle: ActionLifecycle;
  receipt: DecisionReceipt;
  onYea: () => void;
  onNay: () => void;
  onRouteAction: (actionId: string) => void;
  onGateApprove: () => void;
  onGateReject: () => void;
  onGateDefer: () => void;
  onRefresh?: () => void | Promise<void>;
}) {
  return (
    <div className="sd-mfc-shell" aria-label="Mobile SoleDash">
      <MobileFrontierPanel
        frontierCode={frontierCode}
        frontierTitle={frontierTitle}
        proposalSummary={proposalSummary}
        evidenceStatus={evidenceStatus}
        waitingGatesCount={waitingGatesCount}
        waitingGatesHint={waitingGatesHint}
        blockerHeadline={blockerHeadline}
        reactions={reactions}
      />

      {redCard ? (
        <HumanGatePanel
          card={redCard}
          busy={busy}
          activeAction={activeAction}
          unavailable={unavailable}
          provenance={{
            source: "UNKNOWN",
            updatedAt: new Date().toISOString(),
            detail: "mobile-sd legacy surface — not on guillotine path"
          }}
          onApprove={onGateApprove}
          onReject={onGateReject}
          onDefer={onGateDefer}
        />
      ) : null}

      {!unavailable && proposalSummary ? (
        <MobileCommandActions
          busy={busy}
          activeAction={activeAction}
          gateTier={gateTier}
          routeButtons={routeButtons}
          onYea={onYea}
          onNay={onNay}
          onRouteAction={onRouteAction}
        />
      ) : null}

      <MobileLatestReceipt entries={receipts} lifecycle={lifecycle} receipt={receipt} gateTier={gateTier} />

      <MobileRelayCardList onRefresh={onRefresh} />

      <MobileReceiptList entries={receipts} />
    </div>
  );
}
