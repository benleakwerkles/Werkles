export type PermissionFlySeverity = "low" | "medium" | "high" | "critical";

export type PermissionFlyClassification =
  | "unclassified"
  | "human_gate"
  | "mechanical"
  | "pre_approved"
  | "keep_asking";

export type PermissionFlyActionKind =
  | "reported"
  | "send_to_dink"
  | "pre_approve"
  | "keep_asking";

export type PermissionFlyEntry = {
  id: string;
  source: string;
  count: number;
  last_occurrence: string;
  severity: PermissionFlySeverity;
  classification: PermissionFlyClassification;
  detail: string | null;
};

export type PermissionFlyReceipt = {
  fly_id: string;
  receipt_id: string;
  timestamp: string;
  action: PermissionFlyActionKind;
  source: string;
  count: number;
  last_occurrence: string;
  severity: PermissionFlySeverity;
  classification: PermissionFlyClassification;
  detail: string | null;
  receipt_path: string;
  dink_outbox_path: string | null;
  success: boolean;
};

export type PermissionFlyPanel = {
  active: PermissionFlyEntry | null;
  flies: PermissionFlyEntry[];
  last_receipt: PermissionFlyReceipt | null;
};

export type PermissionFlyPreset = {
  id: string;
  label: string;
  source: string;
  severity: PermissionFlySeverity;
  classification: PermissionFlyClassification;
  detail: string;
};
