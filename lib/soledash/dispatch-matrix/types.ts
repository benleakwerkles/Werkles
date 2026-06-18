export type AeyeId = "MAKER" | "DINK" | "ENDER" | "BEAN" | "THUFIR" | "SKYBRO" | "PETRA";

export type ProjectBranchStatus = "GO" | "CONDITIONAL GO" | "PARKED";

export type AeyeAvailability = "available" | "busy" | "partial" | "unknown";

export type DispatchProjectDef = {
  id: string;
  project: string;
  benefit: string;
  cost: string;
  required_aeyes: AeyeId[];
  branch_status: ProjectBranchStatus;
  branch_label: string;
};

export type AeyeResourceView = {
  id: AeyeId;
  label: string;
  availability: AeyeAvailability;
  busy_on: string | null;
  source: string;
};

export type DispatchMatrixRow = DispatchProjectDef & {
  available_aeyes: AeyeId[];
  missing_aeyes: AeyeId[];
  contention_warning: string | null;
  delayed_if_dispatched: string[];
  dispatch_recommendation: string;
  selectable: boolean;
};

export type DispatchMatrixView = {
  aeye_resources: AeyeResourceView[];
  rows: DispatchMatrixRow[];
  generated_at: string;
  fleet_state_loaded: boolean;
};
