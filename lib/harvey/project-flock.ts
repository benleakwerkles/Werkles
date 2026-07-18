export type HarveyProjectFlockProject = {
  project_id: string;
  title: string;
  machine: string;
  packet_id: string;
  packet_path: string;
  execution_owner: string;
  route_state: "LOCAL_OPERATOR_ROUTE" | "ROUTE_UNPROVEN" | "ROUTE_UNBOUND_OPERATOR_REPORTED";
  autonomy_state: string;
  publication_state: "LOCAL_WORKTREE_CANDIDATE";
  delivery_state: "LOCAL_READABLE_NOT_TERMINAL" | "PREPARED_NOT_DELIVERED";
  receiver_identity: string | null;
  checkpoint: string;
  next_two_moves: [string, string];
  manifesto_alignment: "PENDING_SOURCE";
};

export type HarveyProjectFlockBrief = {
  valid: boolean;
  errors: string[];
  manifesto_status: "PENDING_SOURCE" | "INVALID";
  summary: {
    project_loops: number;
    active_local: number;
    prepared_not_delivered: number;
    receiver_proven_external: number;
  };
  projects: HarveyProjectFlockProject[];
};

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const PACKET_ID = /^F_PROJECT_[A-Z0-9_]{1,100}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const MACHINES = new Set(["Doss", "Betsy", "Spanzee", "Medullina", "Sally"]);
const ROUTES = new Set(["LOCAL_OPERATOR_ROUTE", "ROUTE_UNPROVEN", "ROUTE_UNBOUND_OPERATOR_REPORTED"]);

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function bounded(value: unknown, maximum = 260): value is string {
  return typeof value === "string" && value.trim() === value && value.length > 0 && value.length <= maximum && !/[\u0000-\u001f\u007f]/.test(value);
}

export function buildHarveyProjectFlockBrief(value: unknown): HarveyProjectFlockBrief {
  const errors: string[] = [];
  if (!record(value)) errors.push("PROJECT_INDEX_NOT_OBJECT");
  const root = record(value) ? value : {};
  if (root.schema !== "werkles.harvey-project-flock-index/v1") errors.push("PROJECT_INDEX_SCHEMA_INVALID");
  if (root.manifesto_status !== "PENDING_SOURCE") errors.push("MANIFESTO_STATUS_INVALID");
  if (root.field_artifact_ledger !== "foreman/harvey/HARVEY_PROJECT_FIELD_ARTIFACT_LEDGER_20260716.json") errors.push("PROJECT_LEDGER_POINTER_INVALID");
  const rawProjects = Array.isArray(root.projects) ? root.projects : [];
  if (rawProjects.length !== 8) errors.push("PROJECT_COUNT_INVALID");

  const projectIds = new Set<string>();
  const projects: HarveyProjectFlockProject[] = [];
  for (const raw of rawProjects) {
    if (!record(raw)) { errors.push("PROJECT_ENTRY_INVALID"); continue; }
    const projectId = String(raw.project_id ?? "");
    if (!ID.test(projectId) || projectIds.has(projectId)) errors.push("PROJECT_ID_INVALID");
    projectIds.add(projectId);
    if (!bounded(raw.title, 100) || !MACHINES.has(String(raw.machine ?? ""))) errors.push("PROJECT_IDENTITY_INVALID");
    if (!PACKET_ID.test(String(raw.packet_id ?? "")) || !bounded(raw.packet_path, 180) || !String(raw.packet_path).startsWith("foreman/handoffs/outbox/F_PROJECT_")) errors.push("PROJECT_PACKET_INVALID");
    if (!SHA256.test(String(raw.packet_sha256 ?? "")) || raw.is_current !== true) errors.push("PROJECT_CURRENT_POINTER_INVALID");
    if (raw.worktree_base_commit !== "98f8a9ff281f37b9376f2f580823076820647be4" || raw.packet_source_commit !== null || raw.publication_locator !== null) errors.push("PROJECT_PROVENANCE_INVALID");
    if (raw.coordination_lane_ref !== "foreman/LANES.md#lane-harvey-project-flock-coordination-protocol" || raw.coordination_budget_ref !== "foreman/BUDGET.md#lane-harvey-project-flock-coordination-protocol") errors.push("PROJECT_COORDINATION_AUTHORITY_INVALID");
    if (!bounded(raw.execution_owner, 100) || String(raw.execution_owner).includes(" / ")) errors.push("PROJECT_EXECUTION_OWNER_INVALID");
    if (!ROUTES.has(String(raw.route_state ?? ""))) errors.push("PROJECT_ROUTE_INVALID");
    if (raw.publication_state !== "LOCAL_WORKTREE_CANDIDATE") errors.push("PROJECT_PUBLICATION_STATE_INVALID");
    const local = raw.route_state === "LOCAL_OPERATOR_ROUTE";
    if (local && (raw.delivery_state !== "LOCAL_READABLE_NOT_TERMINAL" || !bounded(raw.receiver_identity, 100))) errors.push("LOCAL_ROUTE_DELIVERY_INVALID");
    if (!local && (raw.delivery_state !== "PREPARED_NOT_DELIVERED" || raw.receiver_identity !== null)) errors.push("REMOTE_ROUTE_DELIVERY_INVALID");
    if (local && (!bounded(raw.project_execution_lane_ref, 160) || !bounded(raw.project_execution_budget_ref, 160))) errors.push("LOCAL_EXECUTION_AUTHORITY_INVALID");
    if (!local && (raw.project_execution_lane_ref !== null || raw.project_execution_budget_ref !== null || !String(raw.autonomy_state ?? "").includes("PREPARED_ONLY"))) errors.push("REMOTE_EXECUTION_AUTHORITY_INVALID");
    if (!bounded(raw.autonomy_state, 80) || !bounded(raw.checkpoint, 220)) errors.push("PROJECT_LOOP_STATE_INVALID");
    if (!Array.isArray(raw.next_two_moves) || raw.next_two_moves.length !== 2 || !raw.next_two_moves.every((move) => bounded(move, 220))) errors.push("PROJECT_NEXT_MOVES_INVALID");
    if (raw.manifesto_alignment !== "PENDING_SOURCE") errors.push("PROJECT_MANIFESTO_STATE_INVALID");
    if (errors.length > 0) continue;
    projects.push({
      project_id: projectId,
      title: raw.title as string,
      machine: raw.machine as string,
      packet_id: raw.packet_id as string,
      packet_path: raw.packet_path as string,
      execution_owner: raw.execution_owner as string,
      route_state: raw.route_state as HarveyProjectFlockProject["route_state"],
      autonomy_state: raw.autonomy_state as string,
      publication_state: "LOCAL_WORKTREE_CANDIDATE",
      delivery_state: raw.delivery_state as HarveyProjectFlockProject["delivery_state"],
      receiver_identity: raw.receiver_identity as string | null,
      checkpoint: raw.checkpoint as string,
      next_two_moves: raw.next_two_moves as [string, string],
      manifesto_alignment: "PENDING_SOURCE"
    });
  }

  const valid = errors.length === 0 && projects.length === 8;
  const accepted = valid ? projects : [];
  return {
    valid,
    errors: [...new Set(errors)].sort(),
    manifesto_status: valid ? "PENDING_SOURCE" : "INVALID",
    summary: {
      project_loops: accepted.length,
      active_local: accepted.filter((project) => project.delivery_state === "LOCAL_READABLE_NOT_TERMINAL").length,
      prepared_not_delivered: accepted.filter((project) => project.delivery_state === "PREPARED_NOT_DELIVERED").length,
      receiver_proven_external: 0
    },
    projects: accepted
  };
}
