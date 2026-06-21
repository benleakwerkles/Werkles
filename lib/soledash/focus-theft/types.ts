export type FocusTheftSeverity = "low" | "medium" | "high" | "critical";

export type FocusTheftReportInput = {
  source_app: string;
  notification_text: string;
  what_ben_was_doing: string;
  severity: FocusTheftSeverity;
  repeat_offender?: boolean;
};

export type FocusTheftReceipt = {
  incident_id: string;
  timestamp: string;
  source_app: string;
  notification_text: string;
  what_ben_was_doing: string;
  severity: FocusTheftSeverity;
  repeat_offender: boolean;
  reported_to: "DINK";
  receipt_path: string;
  dink_outbox_path: string | null;
  success: boolean;
};

export type FocusTheftPreset = {
  id: string;
  label: string;
  source_app: string;
  notification_text: string;
  what_ben_was_doing: string;
  severity: FocusTheftSeverity;
};
