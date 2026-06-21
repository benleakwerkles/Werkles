import type { DecisionReceipt, ReceiptCenterEntry } from "@/protocol/index";

import type { RelayCardView } from "@/lib/soledash/automatica-relay/types";



import type { Provenance } from "@/lib/soledash/provenance/types";



export type DrawerDisposition = "approved" | "rejected" | "follow_up";



export type DrawerSectionId = "new" | "needs_review" | "approved" | "archived";



export type DrawerReceiptSource = "transport" | "relay" | "decision";



export type DrawerReceipt = {

  id: string;

  cardId: string;

  source: DrawerReceiptSource;

  owner: string;

  machine: string;

  timestamp: string;

  artifact: string;

  result: string;

  nextRecommendation: string;

  title: string;

  disposition: DrawerDisposition | null;

  dispositionRecord: DrawerDispositionRecord | null;

  simulated: boolean;

  receiptLink: string | null;

  provenance: Provenance;

};



export type DrawerSection = {

  id: DrawerSectionId;

  title: string;

  hint: string;

  receipts: DrawerReceipt[];

};



export type DrawerSections = {

  new: DrawerReceipt[];

  needs_review: DrawerReceipt[];

  approved: DrawerReceipt[];

  archived: DrawerReceipt[];

  counts: Record<DrawerSectionId, number>;

  uniqueApprovedCount: number;

};



export type DrawerDispositionRecord = {

  card_id: string;

  receipt_id: string;

  disposition: DrawerDisposition;

  acted_at: string;

  acted_by: string;

  note: string | null;

  duplicate_ignored?: boolean;

};



export type DrawerStoreV1 = {

  version: 1;

  entries: Record<string, Omit<DrawerDispositionRecord, "card_id" | "receipt_id">>;

};



export type DrawerStore = {

  version: 2;

  /** Unique key `${card_id}:${approver}` */

  approvals: Record<string, DrawerDispositionRecord>;

};



export type ApprovalCounter = {

  uniqueApproved: number;

};



export type BuildDrawerInput = {

  machineLabel: string;

  payloadUpdatedAt: string;

  receipts: ReceiptCenterEntry[];

  relayCards: RelayCardView[];

  decisionReceipt: DecisionReceipt;

  approvals: Record<string, DrawerDispositionRecord>;

  approver: string;

};



export type DrawerAction = "approve" | "reject" | "follow_up";



export const DEFAULT_DRAWER_APPROVER = "Ben";



export function approvalStoreKey(cardId: string, approver: string): string {

  return `${cardId.trim()}:${approver.trim()}`;

}



export function parseCardIdFromReceiptId(receiptId: string): string {

  const trimmed = receiptId.trim();

  if (!trimmed) return trimmed;



  const parts = trimmed.split(":");

  if (parts[0] === "relay" && parts[1]) return parts[1];

  if (parts[0] === "transport" && parts[1]) return parts[1];

  if (parts[0] === "decision" && parts[1]) return parts[1];



  return trimmed;

}



export function duplicateApprovalMessage(record: DrawerDispositionRecord): string {

  const when = new Date(record.acted_at).toLocaleString(undefined, {

    month: "short",

    day: "numeric",

    hour: "2-digit",

    minute: "2-digit"

  });

  return `Already approved by ${record.acted_by} at ${when}. No action taken.`;

}
