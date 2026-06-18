import type { Provenance } from "@/lib/soledash/provenance/types";
import type { ConflictVisibility } from "@/lib/soledash/conflict-visibility/types";
import type { WorkbenchSendReceiveSurface } from "./send-receive-surface";

/** Internal bucket mapping — converted to OperatorCardStatus for display. */
export type GuillotineStatus =
  | "Queued"
  | "Working"
  | "Blocked"
  | "Human Gate"
  | "Returned"
  | "Closed";

export type OperatorCardStatus =
  | "Ready to Start"
  | "Now Building"
  | "Needs Decision"
  | "Blocked by Dependency"
  | "Receipts";

export type GuillotineCard = {
  id: string;
  cardId: string;
  title: string;
  purpose: string;
  project: string;
  area: string;
  owner: string;
  machine: string;
  branch: string;
  status: OperatorCardStatus;
  nextAction: string;
  receiptReturn: string;
  receiptLink?: string | null;
  provenance: Provenance;
  /** Optional display-only conflict badge — not computed by guillotine builders. */
  conflict?: ConflictVisibility;
  /** Send/receive loop surface for Workbench cards. */
  sendReceive?: WorkbenchSendReceiveSurface;
};

export type GuillotineSections = {
  frontier: GuillotineCard | null;
  working: GuillotineCard[];
  receipts: GuillotineCard[];
};
