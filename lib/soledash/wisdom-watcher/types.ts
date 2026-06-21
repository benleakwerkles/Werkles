export type WisdomSeverity = "low" | "medium" | "high" | "critical";

export type WisdomRisk = {
  id: string;
  summary: string;
  severity: WisdomSeverity;
  source_doctrine: string;
  conflicting_task: string;
  recommended_correction: string;
};

export type WisdomWatchReport = {
  report_id: string;
  title: string;
  generated_at: string;
  report_path: string;
  markdown_path: string;
  risks: WisdomRisk[];
};

export type WisdomWatchPanel = {
  report: WisdomWatchReport;
  top_risks: WisdomRisk[];
  parked: boolean;
  parked_reason: string | null;
  resolved_ids: string[];
};

export type WisdomWatchAction =
  | "send_petra"
  | "send_bean"
  | "mark_resolved"
  | "park";

export type WisdomWatchActionResult = {
  ok: boolean;
  action: WisdomWatchAction;
  detail: string;
  outbound_path?: string | null;
  receipt_path?: string | null;
};
