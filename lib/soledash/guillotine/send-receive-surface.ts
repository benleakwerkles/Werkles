import type { ReceiptCenterEntry } from "@/protocol/index";

import type { RelayCardView } from "@/lib/soledash/automatica-relay/types";

import type { GuillotineCard, OperatorCardStatus } from "./types";
import {
  applyRelayRejectionSurface,
  detectRelayRejection,
  type RelayRejectionDetails
} from "./relay-rejection";

export type WorkbenchLoopState = "DRAFT" | "SENT" | "RECEIVED" | "FAILED" | "RELAY_REJECTED";

export type WorkbenchTechnicalLine = {
  label: string;
  value: string;
};

export type WorkbenchSendReceiveSurface = {
  loopState: WorkbenchLoopState;
  sendLabel: string | null;
  response: string | null;
  nextHint: string | null;
  technical: WorkbenchTechnicalLine[];
  relayRejection?: RelayRejectionDetails | null;
};

function routeLabel(owner: string, machine: string): string {
  const o = owner.trim();
  const m = machine.trim();
  if (o.includes("@")) return o.replace(/\s+/g, "");
  if (m.includes("@")) return m.replace(/\s+/g, "");
  const cleanO = !o || o === "—" ? "Dink" : o;
  const cleanM = !m || m === "—" ? "Betsy" : m;
  if (cleanM.toLowerCase() === cleanO.toLowerCase()) return cleanO;
  return `${cleanO}@${cleanM}`;
}

function pushTechnical(lines: WorkbenchTechnicalLine[], label: string, value: string | null | undefined) {
  if (!value || !value.trim() || value.trim() === "—") return;
  lines.push({ label, value: value.trim() });
}

export function loopStateFromOperatorStatus(
  status: OperatorCardStatus,
  failed = false
): WorkbenchLoopState {
  if (failed || status === "Blocked by Dependency") return "FAILED";
  if (status === "Ready to Start" || status === "Needs Decision") return "DRAFT";
  if (status === "Now Building") return "SENT";
  if (status === "Receipts") return "RECEIVED";
  return "DRAFT";
}

export function sendReceiveFromRelay(relay: RelayCardView): WorkbenchSendReceiveSurface {
  const route = routeLabel(
    relay.owner ?? relay.cousin ?? relay.targetAgent,
    relay.targetComputer
  );
  const technical: WorkbenchTechnicalLine[] = [];

  pushTechnical(technical, "Packet ID", relay.packetId);
  pushTechnical(technical, "Packet path", relay.packetPath);
  pushTechnical(technical, "Receipt path", relay.receiptPath);
  pushTechnical(technical, "Expected receipt", relay.expectedReceipt);
  pushTechnical(technical, "Route kind", relay.routeKind);
  for (const line of relay.resultTranslation.rawLines) {
    pushTechnical(technical, line.label, line.value);
  }

  const translation = relay.resultTranslation;
  const failure = relay.failureContext;
  const rejection =
    relay.relayRejection ??
    detectRelayRejection({
      error: failure?.error,
      blocker: failure?.blocker ?? relay.blocker,
      status: failure?.status,
      sender: relay.cousin ?? relay.owner ?? relay.targetAgent,
      expectedRecipient: route,
      packetId: relay.packetId
    });

  let surface: WorkbenchSendReceiveSurface;

  switch (relay.state) {
    case "FIRED":
    case "SENT":
    case "WORKING":
      surface = {
        loopState: "SENT",
        sendLabel: `Sent to ${route}`,
        response: translation.whatHappened,
        nextHint: translation.actionNeeded,
        technical
      };
      break;
    case "RECEIPT RETURNED":
      surface = {
        loopState: "RECEIVED",
        sendLabel: `Sent to ${route}`,
        response: [translation.whatHappened, translation.whyItMatters].filter(Boolean).join(" "),
        nextHint: translation.actionNeeded,
        technical
      };
      break;
    case "EXPLODED":
      surface = {
        loopState: "FAILED",
        sendLabel: `Sent to ${route}`,
        response: failure?.summary ?? translation.whatHappened ?? relay.blocker ?? "Dispatch failed.",
        nextHint: translation.actionNeeded,
        technical
      };
      break;
    case "BLOCKED":
      surface = {
        loopState: relay.routeConnected ? "FAILED" : "DRAFT",
        sendLabel: relay.routeConnected ? `Sent to ${route}` : null,
        response: relay.routeConnected
          ? (failure?.summary ?? translation.whatHappened ?? relay.blocker)
          : (relay.blocker ?? translation.whatHappened),
        nextHint: translation.actionNeeded,
        technical
      };
      break;
    default:
      surface = {
        loopState: "DRAFT",
        sendLabel: null,
        response: translation.whatHappened,
        nextHint: translation.actionNeeded,
        technical
      };
  }

  return rejection && (surface.loopState === "FAILED" || relay.relayRejection)
    ? applyRelayRejectionSurface(surface, rejection)
    : { ...surface, relayRejection: null };
}

export function sendReceiveFromReceipt(
  entry: ReceiptCenterEntry,
  owner: string,
  machine: string
): WorkbenchSendReceiveSurface {
  const route = routeLabel(entry.owner ?? owner, machine);
  const technical: WorkbenchTechnicalLine[] = [];
  pushTechnical(technical, "Action ID", entry.action_id);
  pushTechnical(technical, "Receipt link", entry.receipt_link);
  pushTechnical(technical, "Transport status", entry.status);
  pushTechnical(technical, "Last update", entry.last_update);

  switch (entry.status) {
    case "drafted":
    case "queued":
      return {
        loopState: "DRAFT",
        sendLabel: null,
        response: `Ready to send to ${route}.`,
        nextHint: "Send when route is wired from Main Desk.",
        technical
      };
    case "sent":
    case "received":
    case "working":
      return {
        loopState: "SENT",
        sendLabel: `Sent to ${route}`,
        response: `Waiting for ${route} to return proof for ${entry.target}.`,
        nextHint: "Refresh — response lands on this card when cousin finishes.",
        technical
      };
    case "resolved":
      return {
        loopState: "RECEIVED",
        sendLabel: `Sent to ${route}`,
        response: `${route} returned proof for ${entry.target}.`,
        nextHint: "Review response, then move to the next frontier step.",
        technical
      };
    case "failed": {
      const rejection = detectRelayRejection({
        relayRejection: entry.relay_rejection,
        error: entry.failure_reason,
        sender: entry.relay_rejection?.sender ?? entry.owner ?? owner,
        expectedRecipient: route,
        packetId: entry.relay_rejection?.packet_id ?? entry.action_id
      });
      const surface: WorkbenchSendReceiveSurface = {
        loopState: "FAILED",
        sendLabel: `Sent to ${route}`,
        response: `Transport to ${route} failed for ${entry.target}.`,
        nextHint: "Inspect technical details, then retry from Main Desk.",
        technical
      };
      return applyRelayRejectionSurface(surface, rejection);
    }
    default:
      return {
        loopState: "DRAFT",
        sendLabel: null,
        response: null,
        nextHint: null,
        technical
      };
  }
}

export function sendReceiveFromCard(card: GuillotineCard): WorkbenchSendReceiveSurface {
  if (card.sendReceive) return card.sendReceive;

  if (card.id.startsWith("blocker:")) {
    return {
      loopState: "FAILED",
      sendLabel: null,
      response: card.purpose !== "—" ? card.purpose : "Platform blocker — nothing else moves until this clears.",
      nextHint: card.nextAction !== "—" ? card.nextAction : null,
      technical: buildTechnicalFromCard(card)
    };
  }

  const route = routeLabel(card.owner, card.machine);
  const failed = card.status === "Blocked by Dependency";
  const loopState = loopStateFromOperatorStatus(card.status, failed);
  const technical: WorkbenchTechnicalLine[] = [];
  pushTechnical(technical, "Card ID", card.cardId);
  pushTechnical(technical, "Receipt return", card.receiptReturn);
  pushTechnical(technical, "Receipt link", card.receiptLink);
  pushTechnical(technical, "Branch", card.branch);
  pushTechnical(technical, "Provenance", card.provenance.detail);

  let sendLabel: string | null = null;
  let response: string | null = null;

  switch (loopState) {
    case "DRAFT":
      response = `Draft on the bench — not sent yet.`;
      break;
    case "SENT":
      sendLabel = `Sent to ${route}`;
      response = card.nextAction !== "—" ? card.nextAction : `Waiting for ${route} to respond.`;
      break;
    case "RECEIVED":
      sendLabel = `Sent to ${route}`;
      response = card.purpose !== "—" ? card.purpose : `${route} returned proof.`;
      break;
    case "FAILED":
      sendLabel = `Sent to ${route}`;
      response = card.nextAction !== "—" ? card.nextAction : `Send to ${route} failed.`;
      break;
  }

  return {
    loopState,
    sendLabel,
    response,
    nextHint: card.nextAction !== "—" ? card.nextAction : null,
    technical
  };
}

function buildTechnicalFromCard(card: GuillotineCard): WorkbenchTechnicalLine[] {
  const technical: WorkbenchTechnicalLine[] = [];
  pushTechnical(technical, "Card ID", card.cardId);
  pushTechnical(technical, "Receipt return", card.receiptReturn);
  pushTechnical(technical, "Receipt link", card.receiptLink);
  pushTechnical(technical, "Branch", card.branch);
  pushTechnical(technical, "Provenance", card.provenance.detail);
  return technical;
}

export function workbenchCardStaysOnBench(card: GuillotineCard): boolean {
  return (
    card.id.startsWith("relay:") ||
    card.id.startsWith("receipt:") ||
    card.id.startsWith("lifecycle:") ||
    card.id.startsWith("workbench-packet:")
  );
}

export function loopStateSlug(state: WorkbenchLoopState): string {
  return state.toLowerCase().replace(/_/g, "-");
}
