export type PearlStatus = "NEW" | "REVIEWED" | "PROMOTED" | "ARCHIVED" | "KILLED";

export type PearlDraftTask = {
  task_id: string;
  title: string;
  summary: string;
};

export type PearlV0 = {
  pearl_id: string;
  title: string;
  status: PearlStatus;
  origin: string;
  source: string;
  core_principle: string;
  linked_draft_task: PearlDraftTask | null;
  created_at: string;
  updated_at: string;
};

export type PearlShelfStore = {
  version: 0;
  pearls: PearlV0[];
};

export type PearlAction = "review" | "promote" | "archive" | "kill";

export const PEARL_STATUSES: PearlStatus[] = ["NEW", "REVIEWED", "PROMOTED", "ARCHIVED", "KILLED"];

export const TERMINAL_PEARL_STATUSES = new Set<PearlStatus>(["ARCHIVED", "KILLED"]);
