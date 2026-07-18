import type { HarveySnapshot, HarveySnapshotWorkstream } from "./snapshot";

export type HarveyWatchtowerDecision = "KEEP_GOING" | "REVIEW_WITHIN_LANE" | "TRUE_HUMAN_GATE" | "PROVED_BLOCKER";
export type HarveyInventionStatus = "CANDIDATE_REPORTED" | "SOURCE_PROOF_ATTACHED" | "RED_TEAMED" | "OFFERED_TO_ADOPTERS" | "ADOPTED_BY_NAMED_PROJECT" | "REJECTED_WITH_REASON";
export type HarveyFlockRouteState = "LOCAL_OPERATOR_ROUTE" | "RECEIVER_PROVEN" | "ROUTE_UNPROVEN" | "ROUTE_UNBOUND_OPERATOR_REPORTED";

export type HarveyWatchtowerProjectContract = {
  workstream_id: string;
  canonical_machine: string;
  owner_role: string;
  next_proof_action: string;
  flock_route_state: HarveyFlockRouteState;
  flock_route_source_id: string | null;
};

export type HarveyInventionCandidate = {
  capsule_id: string;
  source_project: string;
  source_machine: string;
  invented_by: string;
  problem_and_cause: string;
  candidate_pattern: string;
  proof_level: string;
  known_risks: string[];
  possible_adopters: string[];
  adoption_status: HarveyInventionStatus;
  source_proof_ids: string[];
  adopted_by_project?: string | null;
  adoption_receipt_id?: string | null;
};

export type HarveyWatchtowerContract = {
  schema?: string;
  updated_at?: string;
  authority?: string;
  rule_version?: string;
  role_scope_proof_available?: boolean;
  projects?: HarveyWatchtowerProjectContract[];
  candidate_inventions?: HarveyInventionCandidate[];
};

export type HarveyWatchtowerSignal = {
  code: "NO_GATE_PROVEN" | "PROOF_DRIFT" | "MACHINE_VISIBILITY_GAP" | "MACHINE_OR_SCOPE_MISMATCH" | "FLOCK_ROUTE_UNBOUND" | "FLOCK_ROUTE_UNPROVEN" | "TERMINAL_COMMAND_BLOCKER_UNTYPED" | "TRUE_HUMAN_GATE" | "PROVED_BLOCKER";
  confidence: "HIGH" | "BOUNDED" | "UNKNOWN";
  source: string;
  observed_at: string | null;
  clearing_condition: string;
};

export type HarveyWatchtowerProject = {
  workstream_id: string;
  name: string;
  machine: string;
  owner_role: string;
  flock_route_state: HarveyFlockRouteState;
  decision: HarveyWatchtowerDecision;
  headline: string;
  reason: string;
  next_proof_action: string;
  reported_status: string;
  latest_command_result: string;
  receipt_freshness: string;
  latest_receipt_at: string | null;
  signals: HarveyWatchtowerSignal[];
};

export type HarveyWatchtowerBrief = {
  schema: "werkles.harvey-watchtower-brief/v1";
  source_revision: string;
  generated_at: string;
  feed: {
    state: "CURRENT" | "DEGRADED";
    evidence_issue_count: number;
    message: string;
  };
  rules: {
    version: "20260716.1";
    source_ids: string[];
    hidden_score: false;
  };
  coverage: {
    projects_observed: number;
    live_machine_heartbeats: number;
    role_scope_proof_available: boolean;
    flock_routes_bound: number;
  };
  summary: {
    needs_ben_now: number;
    can_keep_moving: number;
    review_within_lane: number;
    proved_blockers: number;
    proof_refresh_needed: number;
  };
  projects: HarveyWatchtowerProject[];
  inventions: {
    ready_to_carry: HarveyInventionCandidate[];
    waiting_for_source_proof: HarveyInventionCandidate[];
    rejected_contract_count: number;
  };
  role_scope_proof_available: boolean;
  contract_valid: boolean;
  contract_errors: string[];
};

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const CANONICAL_MACHINES = new Set(["Doss", "Betsy", "Spanzee", "Medullina", "Sally"]);
const ROUTE_STATES = new Set<HarveyFlockRouteState>(["LOCAL_OPERATOR_ROUTE", "RECEIVER_PROVEN", "ROUTE_UNPROVEN", "ROUTE_UNBOUND_OPERATOR_REPORTED"]);
const SOURCE_ID = /^[A-Z0-9_]{1,120}$/;
const INVENTION_STATES = new Set<HarveyInventionStatus>([
  "CANDIDATE_REPORTED", "SOURCE_PROOF_ATTACHED", "RED_TEAMED", "OFFERED_TO_ADOPTERS",
  "ADOPTED_BY_NAMED_PROJECT", "REJECTED_WITH_REASON"
]);

function text(value: unknown, maximum: number, fallback: string) {
  if (typeof value !== "string") return fallback;
  const normalized = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return normalized && normalized.length <= maximum ? normalized : fallback;
}

function projectSignal(
  code: HarveyWatchtowerSignal["code"],
  confidence: HarveyWatchtowerSignal["confidence"],
  source: string,
  observedAt: string | null,
  clearingCondition: string
): HarveyWatchtowerSignal {
  return { code, confidence, source, observed_at: observedAt, clearing_condition: clearingCondition };
}

function latestCommandResult(workstream: HarveySnapshotWorkstream) {
  if (workstream.execution_status === "COMMAND_COMPLETED") return "Latest bounded command completed; project completion is not implied.";
  if (workstream.execution_status === "COMMAND_BLOCKER") return "Latest bounded command returned a blocker; project cause is not typed.";
  if (workstream.execution_status === "EVIDENCE_INVALID") return "Latest project-linked command evidence was rejected.";
  return "No terminal command proof is represented.";
}

function containsPrivateShape(value: string) {
  return /(?:[A-Za-z]:\\|\\Users\\|\/Users\/|\/home\/|\bpassword\b|\bsecret\b|\btoken\b|\bcredential\b|\S+@\S+\.\S+)/i.test(value);
}

function normalizeInventions(value: unknown, profiles: Map<string, HarveyWatchtowerProjectContract>) {
  const accepted: HarveyInventionCandidate[] = [];
  let rejected = 0;
  for (const raw of Array.isArray(value) ? value : []) {
    if (!raw || typeof raw !== "object") { rejected += 1; continue; }
    const item = raw as HarveyInventionCandidate;
    const sourceProfile = profiles.get(String(item.source_project ?? ""));
    const freeText = [item.source_machine, item.invented_by, item.problem_and_cause, item.candidate_pattern, item.proof_level, ...(Array.isArray(item.known_risks) ? item.known_risks : [])].map(String);
    const candidateOnly = item.adoption_status === "CANDIDATE_REPORTED" && item.proof_level === "PACKET_ONLY_NO_RECEIVER_PROOF";
    const proofIds = Array.isArray(item.source_proof_ids) && item.source_proof_ids.length === 0;
    const adoptersValid = Array.isArray(item.possible_adopters) && item.possible_adopters.every((id) => ID.test(id) && profiles.has(id));
    if (!ID.test(String(item.capsule_id ?? "")) || !sourceProfile || sourceProfile.canonical_machine !== item.source_machine || !INVENTION_STATES.has(item.adoption_status) || !candidateOnly || !proofIds || !adoptersValid || freeText.some(containsPrivateShape)) {
      rejected += 1;
      continue;
    }
    accepted.push({
      capsule_id: item.capsule_id,
      source_project: item.source_project,
      source_machine: text(item.source_machine, 40, "UNPROVEN"),
      invented_by: text(item.invented_by, 100, "UNPROVEN"),
      problem_and_cause: text(item.problem_and_cause, 260, "Cause not yet preserved."),
      candidate_pattern: text(item.candidate_pattern, 260, "Candidate pattern not yet described."),
      proof_level: text(item.proof_level, 80, "UNPROVEN"),
      known_risks: Array.isArray(item.known_risks) ? item.known_risks.slice(0, 6).map((risk) => text(risk, 140, "Unspecified risk.")) : [],
      possible_adopters: Array.isArray(item.possible_adopters) ? item.possible_adopters.filter((id) => ID.test(id)).slice(0, 8) : [],
      adoption_status: item.adoption_status,
      source_proof_ids: item.source_proof_ids,
      adopted_by_project: item.adopted_by_project ?? null,
      adoption_receipt_id: item.adoption_receipt_id ?? null
    });
  }
  return { accepted, rejected };
}

export function buildHarveyWatchtower(snapshot: HarveySnapshot, contract: HarveyWatchtowerContract): HarveyWatchtowerBrief {
  const contractErrors: string[] = [];
  const rootKeys = new Set(["schema", "updated_at", "authority", "rule_version", "role_scope_proof_available", "projects", "candidate_inventions"]);
  if (Object.keys(contract ?? {}).some((key) => !rootKeys.has(key))) contractErrors.push("CONTRACT_ROOT_FIELD_INVALID");
  if (contract.schema !== "werkles.harvey-watchtower-contract/v1") contractErrors.push("CONTRACT_SCHEMA_INVALID");
  if (contract.authority !== "ADVISORY_ONLY") contractErrors.push("CONTRACT_AUTHORITY_INVALID");
  if (contract.rule_version !== "20260716.1") contractErrors.push("CONTRACT_RULE_VERSION_INVALID");
  if (typeof contract.updated_at !== "string" || !Number.isFinite(Date.parse(contract.updated_at))) contractErrors.push("CONTRACT_TIMESTAMP_INVALID");
  if (!Array.isArray(contract.projects)) contractErrors.push("CONTRACT_PROJECTS_INVALID");
  const candidateProfiles = Array.isArray(contract.projects) ? contract.projects : [];
  const projectKeys = new Set(["workstream_id", "canonical_machine", "owner_role", "next_proof_action", "flock_route_state", "flock_route_source_id"]);
  const profileIds = new Set<string>();
  for (const profile of candidateProfiles) {
    if (!profile || typeof profile !== "object" || Object.keys(profile).some((key) => !projectKeys.has(key))) contractErrors.push("PROJECT_CONTRACT_FIELD_INVALID");
    if (!ID.test(String(profile?.workstream_id ?? "")) || profileIds.has(profile.workstream_id)) contractErrors.push("PROJECT_CONTRACT_ID_INVALID");
    profileIds.add(String(profile?.workstream_id ?? ""));
    if (!CANONICAL_MACHINES.has(String(profile?.canonical_machine ?? ""))) contractErrors.push("PROJECT_CONTRACT_MACHINE_INVALID");
    if (!ROUTE_STATES.has(profile?.flock_route_state)) contractErrors.push("PROJECT_CONTRACT_ROUTE_STATE_INVALID");
    if (profile?.flock_route_state === "ROUTE_UNBOUND_OPERATOR_REPORTED" && !SOURCE_ID.test(String(profile?.flock_route_source_id ?? ""))) contractErrors.push("PROJECT_CONTRACT_ROUTE_SOURCE_INVALID");
    if (profile?.flock_route_state !== "ROUTE_UNBOUND_OPERATOR_REPORTED" && profile?.flock_route_source_id !== null) contractErrors.push("PROJECT_CONTRACT_ROUTE_SOURCE_INVALID");
    if (text(profile?.owner_role, 100, "") !== profile?.owner_role || text(profile?.next_proof_action, 220, "") !== profile?.next_proof_action) contractErrors.push("PROJECT_CONTRACT_TEXT_INVALID");
  }
  const contractValid = contractErrors.length === 0;
  const profiles = new Map<string, HarveyWatchtowerProjectContract>(contractValid ? candidateProfiles.map((profile) => [profile.workstream_id, profile]) : []);
  const duplicateWorkstreamIds = new Set(snapshot.workstreams.filter((stream, index, all) => all.findIndex((candidate) => candidate.workstream_id === stream.workstream_id) !== index).map((stream) => stream.workstream_id));
  const workstreams = [...snapshot.workstreams].filter((stream, index, all) => all.findIndex((candidate) => candidate.workstream_id === stream.workstream_id) === index).sort((left, right) => left.workstream_id.localeCompare(right.workstream_id));
  const projects = workstreams.map<HarveyWatchtowerProject>((workstream) => {
    const profile = profiles.get(workstream.workstream_id);
    const machine = snapshot.machines.find((candidate) => candidate.machine === workstream.machine);
    const signals: HarveyWatchtowerSignal[] = [];
    const machineOrScopeMismatch = !profile
      || duplicateWorkstreamIds.has(workstream.workstream_id)
      || profile.canonical_machine !== workstream.machine
      || (workstream.latest_command_machine !== null && workstream.latest_command_machine !== workstream.machine)
      || workstream.execution_status === "EVIDENCE_INVALID";
    const routeUnbound = profile?.flock_route_state === "ROUTE_UNBOUND_OPERATOR_REPORTED";

    if (machineOrScopeMismatch) {
      signals.push(projectSignal("MACHINE_OR_SCOPE_MISMATCH", "HIGH", `WORKSTREAM:${workstream.workstream_id}`, workstream.latest_receipt_at, "Return corrected machine-bound evidence or repair the bounded project contract."));
    }
    if (workstream.execution_status === "UNPROVEN" || workstream.receipt_freshness === "STALE" || workstream.receipt_freshness === "UNKNOWN") {
      signals.push(projectSignal("PROOF_DRIFT", "BOUNDED", `SNAPSHOT:${snapshot.revision}`, workstream.latest_receipt_at ?? workstream.reported_updated_at, "Return a current validated terminal receipt for this workstream and machine."));
    }
    if (!machine || machine.connectivity !== "LIVE") {
      signals.push(projectSignal("MACHINE_VISIBILITY_GAP", "HIGH", `SNAPSHOT:${snapshot.revision}`, machine?.heartbeat_observed_at ?? null, "Restore a machine-local authenticated heartbeat; do not infer project failure from its absence."));
    }
    if (routeUnbound) {
      signals.push(projectSignal("FLOCK_ROUTE_UNBOUND", "HIGH", `RECEIVER_REPORT:${profile.flock_route_source_id}`, snapshot.generated_at, "Bind an actual receiver or thread ID, a shared readable packet source, and a terminal receipt-return path."));
    } else if (profile?.flock_route_state === "ROUTE_UNPROVEN") {
      signals.push(projectSignal("FLOCK_ROUTE_UNPROVEN", "BOUNDED", `CONTRACT:${text(contract.updated_at, 30, "UNKNOWN")}`, snapshot.generated_at, "Return receiver-side route identity plus a terminal readback before treating Flock dispatch as available."));
    }
    signals.push(projectSignal("NO_GATE_PROVEN", "HIGH", `CONTRACT:${text(contract.updated_at, 30, "UNKNOWN")}`, snapshot.generated_at, "Continue inside the approved lane unless a future authoritative gate registry names an exact human-only action."));
    if (workstream.execution_status === "COMMAND_BLOCKER") {
      signals.push(projectSignal("TERMINAL_COMMAND_BLOCKER_UNTYPED", "BOUNDED", `COMMAND:${workstream.latest_command_id ?? "UNKNOWN"}`, workstream.latest_receipt_at, "Attach a sanitized typed blocker category and clearing condition before calling the project proved blocked."));
    }

    const decision: HarveyWatchtowerDecision = machineOrScopeMismatch
      ? "REVIEW_WITHIN_LANE"
      : routeUnbound || workstream.execution_status === "COMMAND_BLOCKER"
        ? "REVIEW_WITHIN_LANE"
        : "KEEP_GOING";
    const reason = decision === "REVIEW_WITHIN_LANE"
          ? routeUnbound
            ? "Keep real engineering moving from concrete specs, but do not issue V/P/G pull orders until the receiver, shared packet source, and return path are bound. Ben should not carry repeated bootstraps."
            : "Keep bounded work moving while the crew repairs this proof or scope mismatch; Ben is not required."
          : "No validated stop or human gate is present. Continue inside the approved lane while proof refreshes in parallel.";

    return {
      workstream_id: workstream.workstream_id,
      name: workstream.name,
      machine: workstream.machine,
      owner_role: text(profile?.owner_role, 100, "Owner not represented"),
      flock_route_state: profile?.flock_route_state ?? "ROUTE_UNPROVEN",
      decision,
      headline: decision.replaceAll("_", " "),
      reason,
      next_proof_action: text(profile?.next_proof_action, 220, "Return current machine-bound evidence and the next bounded action."),
      reported_status: workstream.reported_status,
      latest_command_result: latestCommandResult(workstream),
      receipt_freshness: workstream.receipt_freshness,
      latest_receipt_at: workstream.latest_receipt_at,
      signals
    };
  });

  const inventions = normalizeInventions(contract.candidate_inventions, profiles);
  const proofRefreshNeeded = projects.filter((project) => project.signals.some((signal) => signal.code === "PROOF_DRIFT" || signal.code === "MACHINE_VISIBILITY_GAP")).length;
  return {
    schema: "werkles.harvey-watchtower-brief/v1",
    source_revision: snapshot.revision,
    generated_at: snapshot.generated_at,
    feed: {
      state: snapshot.degraded ? "DEGRADED" : "CURRENT",
      evidence_issue_count: snapshot.errors.length,
      message: snapshot.degraded
        ? `${snapshot.errors.length} evidence issue${snapshot.errors.length === 1 ? " is" : "s are"} excluded from promotion. This does not stop unrelated projects.`
        : "Accepted Harvey-local evidence is current."
    },
    rules: {
      version: "20260716.1",
      source_ids: ["F_HARVEY_CROSS_PROJECT_WATCHTOWER_20260716", "F_HARVEY_MOMENTUM_AND_INVENTION_RETURN_20260716"],
      hidden_score: false
    },
    coverage: {
      projects_observed: projects.length,
      live_machine_heartbeats: snapshot.machines.filter((machine) => machine.connectivity === "LIVE").length,
      role_scope_proof_available: contract.role_scope_proof_available === true,
      flock_routes_bound: [...profiles.values()].filter((profile) => profile.flock_route_state === "LOCAL_OPERATOR_ROUTE" || profile.flock_route_state === "RECEIVER_PROVEN").length
    },
    summary: {
      needs_ben_now: projects.filter((project) => project.decision === "TRUE_HUMAN_GATE").length,
      can_keep_moving: projects.filter((project) => project.decision === "KEEP_GOING" || project.decision === "REVIEW_WITHIN_LANE").length,
      review_within_lane: projects.filter((project) => project.decision === "REVIEW_WITHIN_LANE").length,
      proved_blockers: projects.filter((project) => project.decision === "PROVED_BLOCKER").length,
      proof_refresh_needed: proofRefreshNeeded
    },
    projects,
    inventions: {
      ready_to_carry: [],
      waiting_for_source_proof: inventions.accepted.filter((item) => item.adoption_status === "CANDIDATE_REPORTED"),
      rejected_contract_count: inventions.rejected
    },
    role_scope_proof_available: contract.role_scope_proof_available === true,
    contract_valid: contractValid,
    contract_errors: [...new Set(contractErrors)].sort()
  };
}
