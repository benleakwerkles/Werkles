import "server-only";

import { buildAgentInventoryRoster } from "@/lib/soledash/agent-inventory/build-roster";
import { buildDecisionSurfaceView, loadDecisionSurfacePayload } from "@/lib/soledash/decision-surface/load-contract";
import { buildDispatchMatrix } from "@/lib/soledash/dispatch-matrix/build-matrix";
import { buildMachineWallHealth } from "@/lib/soledash/machine-wall/build-health";
import type { MachineHealthLevel } from "@/lib/soledash/machine-wall/types";
import { readNextStepOverride } from "@/lib/soledash/next-step/storage";
import { loadPermissionFlyPanel } from "@/lib/soledash/permission-fly/actions";
import { loadPetraStatus } from "@/lib/soledash/petra-status/load-petra-status";
import { drawerStorePath, readDrawerStore } from "@/lib/soledash/receipt-drawer/storage";
import { loadReceiptGraph } from "@/lib/soledash/receipt-graph/engine";
import { loadWisdomWatchPanel } from "@/lib/soledash/wisdom-watcher/actions";

import {
  SELF_KNOWLEDGE_QUESTIONS,
  type SelfKnowledgeAnswer,
  type SelfKnowledgePanel,
  type SelfKnowledgeQuestionId
} from "./types";

const AWAKE_STATUSES = new Set(["LIVE", "GREEN", "WATCH", "DEGRADED", "ACTIVE", "RUNNING", "ONLINE"]);
const BROKEN_LEVELS = new Set<MachineHealthLevel>(["stop", "quarantine", "degraded"]);

function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return false;
  const now = new Date();
  return (
    at.getFullYear() === now.getFullYear() &&
    at.getMonth() === now.getMonth() &&
    at.getDate() === now.getDate()
  );
}

function answerWhatAreWeBuilding(): SelfKnowledgeAnswer {
  const view = buildDecisionSurfaceView("Betsy");
  const payload = view.payload;
  const proposal = payload.proposal;

  return {
    id: "what_are_we_building",
    label: "What are we building?",
    endpoint: "/api/soledash/v1/state?mode=decision",
    sources: ["foreman/soledash/DECISION_SURFACE.json"],
    answer: {
      data_source: view.data_source,
      load_error: view.load_error,
      mission: payload.mission,
      proposal: proposal
        ? {
            id: proposal.id,
            title: proposal.title,
            action_code: proposal.action_code,
            summary: proposal.summary,
            evidence_status: proposal.evidence_status,
            queue_behind: proposal.queue_behind
          }
        : null,
      active_owner: payload.queue_brain?.active_owner ?? payload.active_owner ?? null,
      recommended_next_action: payload.queue_brain?.recommended_next_action ?? null,
      current_churn: payload.current_churn
    }
  };
}

function answerWhoIsAwake(): SelfKnowledgeAnswer {
  const roster = buildAgentInventoryRoster();
  const machineWall = buildMachineWallHealth();

  const entries = roster.groups.flatMap((group) =>
    group.entries.map((entry) => ({
      aeye: entry.aeye,
      aeye_id: entry.aeyeId,
      machine: entry.machine,
      machine_group: entry.machineGroup,
      status: entry.status,
      current_task: entry.currentTask,
      block_reason: entry.blockReason
    }))
  );

  const awake = entries.filter((entry) => {
    const status = entry.status.toUpperCase();
    if (status === "BLOCKED" || status === "UNKNOWN" || status === "OFFLINE") return false;
    return AWAKE_STATUSES.has(status) || !entry.block_reason;
  });

  return {
    id: "who_is_awake",
    label: "Who is awake?",
    endpoint: "/api/soledash/v1/agent-inventory",
    sources: roster.source_path ? [roster.source_path] : ["foreman/soledash/FLEET_STATE.json"],
    answer: {
      fleet_state_loaded: roster.fleet_state_loaded,
      awake,
      machine_wall: machineWall.machines.map((card) => ({
        id: card.id,
        label: card.label,
        level: card.level,
        level_label: card.levelLabel,
        active_cousins: card.activeCousins,
        current_task: card.currentTask
      })),
      machine_wall_fleet_loaded: machineWall.fleet_state_loaded,
      roster_generated_at: roster.generated_at
    }
  };
}

function answerWhatShippedToday(): SelfKnowledgeAnswer {
  const graph = loadReceiptGraph();
  const shipped = graph.nodes
    .filter((node) => isToday(node.timestamp))
    .map((node) => ({
      id: node.id,
      title: node.title,
      source: node.source,
      status: node.status,
      timestamp: node.timestamp,
      paths: node.paths
    }))
    .sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""));

  return {
    id: "what_shipped_today",
    label: "What shipped today?",
    endpoint: "/api/soledash/v1/receipt-graph",
    sources: ["foreman/soledash/**"],
    answer: {
      graph_generated_at: graph.generatedAt,
      receipt_count_today: shipped.length,
      receipts: shipped
    }
  };
}

function answerWhatNeedsBen(): SelfKnowledgeAnswer {
  const { payload } = loadDecisionSurfacePayload();
  const flyPanel = loadPermissionFlyPanel();
  const drawer = readDrawerStore();

  const permission_flies = flyPanel.flies
    .filter((fly) => fly.classification === "human_gate" || fly.classification === "unclassified")
    .map((fly) => ({
      id: fly.id,
      source: fly.source,
      classification: fly.classification,
      severity: fly.severity,
      count: fly.count,
      last_occurrence: fly.last_occurrence,
      detail: fly.detail
    }));

  return {
    id: "what_needs_ben",
    label: "What needs Ben?",
    endpoint: "/api/soledash/v1/permission-fly",
    sources: [
      "foreman/soledash/DECISION_SURFACE.json",
      "foreman/soledash/PERMISSION_FLY_REGISTRY.json",
      drawerStorePath()
    ],
    answer: {
      human_gate: payload.human_gate,
      active_permission_fly: flyPanel.active,
      permission_flies,
      drawer_approval_records: Object.values(drawer.approvals),
      queue_blocker: payload.queue_brain?.blocker ?? payload.current_blocker?.headline ?? null
    }
  };
}

function answerWhatIsBroken(): SelfKnowledgeAnswer {
  const wisdom = loadWisdomWatchPanel();
  const machineWall = buildMachineWallHealth();
  const petra = loadPetraStatus();

  const machine_issues = machineWall.machines
    .filter((card) => BROKEN_LEVELS.has(card.level))
    .map((card) => ({
      id: card.id,
      label: card.label,
      level: card.level,
      reason: card.reason,
      last_healthy: card.lastHealthy
    }));

  const unresolved_risks = wisdom.top_risks.filter((risk) => !wisdom.resolved_ids.includes(risk.id));

  return {
    id: "what_is_broken",
    label: "What is broken?",
    endpoint: "/api/soledash/v1/wisdom-watcher",
    sources: [
      wisdom.report.report_path,
      "foreman/soledash/FLEET_STATE.json",
      "foreman/soledash/PETRA_TRANSPORT_RECEIPTS.jsonl"
    ],
    answer: {
      wisdom_watch: {
        parked: wisdom.parked,
        parked_reason: wisdom.parked_reason,
        top_risks: unresolved_risks
      },
      machine_issues,
      petra: {
        primary: petra.primary,
        machine: petra.machine,
        last_verdict: petra.last_verdict,
        last_spof: petra.last_spof,
        heartbeat: petra.heartbeat,
        heartbeat_at: petra.heartbeat_at
      }
    }
  };
}

function answerWhereAreTheReceipts(): SelfKnowledgeAnswer {
  const graph = loadReceiptGraph();
  const drawer = readDrawerStore();

  const by_source: Record<string, number> = {};
  for (const node of graph.nodes) {
    by_source[node.source] = (by_source[node.source] ?? 0) + 1;
  }

  const sample_paths = [...new Set(graph.nodes.flatMap((node) => node.paths))].slice(0, 12);

  return {
    id: "where_are_the_receipts",
    label: "Where are the receipts?",
    endpoint: "/api/soledash/v1/receipt-graph",
    sources: [drawerStorePath(), "foreman/soledash/**"],
    answer: {
      receipt_graph: {
        generated_at: graph.generatedAt,
        receipt_count: graph.nodes.length,
        origin_count: graph.originNodes.length,
        edge_count: graph.edges.length,
        by_source
      },
      drawer_store_path: drawerStorePath(),
      drawer_approval_count: Object.keys(drawer.approvals).length,
      sample_paths
    }
  };
}

function answerWhatCanIDoNow(): SelfKnowledgeAnswer {
  const override = readNextStepOverride();
  const matrix = buildDispatchMatrix();
  const { payload } = loadDecisionSurfacePayload();

  const dispatch_now = matrix.rows
    .filter((row) => row.dispatch_recommendation.toLowerCase().includes("dispatch now"))
    .map((row) => ({
      project: row.project,
      branch_status: row.branch_status,
      dispatch_recommendation: row.dispatch_recommendation,
      available_aeyes: row.available_aeyes
    }));

  return {
    id: "what_can_i_do_now",
    label: "What can I do now?",
    endpoint: "/api/soledash/v1/next-step",
    sources: [
      "foreman/soledash/NEXT_STEP_OVERRIDE.json",
      "foreman/soledash/DECISION_SURFACE.json",
      "lib/soledash/dispatch-matrix/projects.ts"
    ],
    answer: {
      next_step_override: override,
      recommended_next_action: payload.queue_brain?.recommended_next_action ?? null,
      decision_buttons: payload.decision?.buttons ?? [],
      dispatch_now,
      aeye_resources: matrix.aeye_resources.map((resource) => ({
        id: resource.id,
        label: resource.label,
        availability: resource.availability,
        busy_on: resource.busy_on,
        source: resource.source
      }))
    }
  };
}

const BUILDERS: Record<SelfKnowledgeQuestionId, () => SelfKnowledgeAnswer> = {
  what_are_we_building: answerWhatAreWeBuilding,
  who_is_awake: answerWhoIsAwake,
  what_shipped_today: answerWhatShippedToday,
  what_needs_ben: answerWhatNeedsBen,
  what_is_broken: answerWhatIsBroken,
  where_are_the_receipts: answerWhereAreTheReceipts,
  what_can_i_do_now: answerWhatCanIDoNow
};

export function buildSelfKnowledgeAnswer(id: SelfKnowledgeQuestionId): SelfKnowledgeAnswer {
  return BUILDERS[id]();
}

export function buildSelfKnowledgePanel(questionId?: SelfKnowledgeQuestionId): SelfKnowledgePanel {
  const ids = questionId ? [questionId] : SELF_KNOWLEDGE_QUESTIONS.map((q) => q.id);
  return {
    generated_at: new Date().toISOString(),
    questions: SELF_KNOWLEDGE_QUESTIONS,
    answers: ids.map((id) => buildSelfKnowledgeAnswer(id))
  };
}

export function isSelfKnowledgeQuestionId(value: string): value is SelfKnowledgeQuestionId {
  return value in BUILDERS;
}
