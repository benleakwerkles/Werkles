import type { DecisionSurfacePayload } from "@/protocol/index";
import { SOLEDASH_PROTOCOL_VERSION } from "@/protocol/index";

/** MOCK ONLY — Dink/Doss replaces via DECISION_SURFACE.json */
export function buildMockDecisionSurfacePayload(): DecisionSurfacePayload {
  const now = new Date().toISOString();

  return {
    schema_version: SOLEDASH_PROTOCOL_VERSION,
    generated_at: now,
    generated_by: "maker-mock-placeholder",
    current_blocker: {
      headline: "Dink has not yet supplied live DECISION_SURFACE.json",
      detail:
        "No live receipt transport exists yet. SoleDash logs MOCK receipts locally until Dink wires persistence and cousin dispatch.",
      mock: true
    },
    receipt_center: [],
    mission: {
      id: "phase0_mule_elimination",
      label: "Phase 0 · Mule Elimination",
      summary: "Ben commands, SoleDash transports — mock until Dink writes live payload"
    },
    current_churn: {
      summary: "MOCK: Cousin paste loops + manual cousin-surface opens still burn Operator cycles",
      current_threat: "MOCK: Attention fragmentation — decisions compete without Dink frontier policy",
      next_decision: "Workstation Uniformization — operator override active"
    },
    thread_health: {
      status: "degraded",
      detail: "MOCK: Protocol stub live; Dink owns thread refresh policy"
    },
    queue_brain: {
      active_owner: "MOCK: Operator override — Dink Queue Override Protocol pending live wire",
      waiting_report: "MOCK: Machine rank vs operator rank divergence visible",
      blocker: "MOCK: DECISION_SURFACE.json not yet written by Dink",
      recommended_next_action: "MOCK: Wire live queue override from Dink"
    },
    frontier_override: {
      machine_recommends: {
        action_code: "P0-A002",
        proposal_id: "mock_prop_doss_stability",
        title: "Doss Stability Investigation"
      },
      operator_selected: {
        action_code: "P0-A001",
        proposal_id: "mock_prop_workstation_uniform",
        title: "Workstation Uniformization"
      },
      current_source: "OPERATOR",
      queue_badge: "MIXED",
      machine_why_number_one:
        "Highest machine score (0.92) — Doss sleep/MWB instability threatens cousin lane throughput; Dink ranks investigation before surface polish."
    },
    proposal: {
      id: "mock_prop_workstation_uniform",
      action_code: "P0-A001",
      title: "Workstation Uniformization",
      summary:
        "Standardize Betsy workstation layout — SoleDash, cousins, and foreman paths in one operator surface.",
      queue_behind: 3,
      evidence_status: "OBSERVED"
    },
    frontier_queue: [
      {
        rank: 1,
        final_rank: 1,
        machine_rank: 2,
        operator_rank: 1,
        rank_source: "OPERATOR",
        action_code: "P0-A001",
        proposal_id: "mock_prop_workstation_uniform",
        title: "Workstation Uniformization",
        evidence_status: "OBSERVED",
        weight: 0.78,
        score: 0.78,
        owner: "Maker @ Betsy",
        weight_label: "frontier"
      },
      {
        rank: 2,
        final_rank: 2,
        machine_rank: 1,
        operator_rank: 2,
        rank_source: "MACHINE",
        action_code: "P0-A002",
        proposal_id: "mock_prop_doss_stability",
        title: "Doss Stability Investigation",
        evidence_status: "HYPOTHESIS",
        weight: 0.92,
        score: 0.92,
        owner: "Dink / Doss",
        weight_label: "queued"
      },
      {
        rank: 3,
        final_rank: 3,
        machine_rank: 3,
        operator_rank: 3,
        rank_source: "MACHINE",
        action_code: "P0-A003",
        proposal_id: "mock_prop_response_capture",
        title: "Response Capture Automation",
        evidence_status: "OBSERVED",
        weight: 0.71,
        score: 0.71,
        owner: "Maker @ Betsy",
        weight_label: "queued"
      },
      {
        rank: 4,
        final_rank: 4,
        machine_rank: 4,
        operator_rank: 4,
        rank_source: "MACHINE",
        action_code: "P0-A004",
        proposal_id: "mock_prop_kind_sir_sue",
        title: "Kind Sir SUE vs Grading Review",
        evidence_status: "SUSPECTED",
        weight: 0.54,
        score: 0.54,
        owner: "Ender lane",
        weight_label: "queued"
      }
    ],
    action_lifecycle: {
      phase: "idle",
      action: null,
      action_id: null,
      proposal_id: null,
      updated_at: now,
      message: null,
      route_owner: null,
      mock: false,
      failure_reason: null
    },
    rationale: {
      why_this_exists: "MOCK: Operator overrode machine frontier — uniform surface reduces mule friction.",
      assumption: "MOCK: One layout beats chasing Doss while workstation is fragmented.",
      evidence: "MOCK: Override visible — machine still recommends Doss (P0-A002).",
      alternative_rejected: "MOCK: Follow machine rank (Doss first)",
      why_rejected: "MOCK: Ben chose workstation uniformization as frontier.",
      risk: "medium — override delays Doss investigation",
      why_now: "MOCK: Queue Override UI proof — Dink wires live policy next.",
      test: "MOCK: Override controls reorder queue; frontier source badge updates.",
      owner: "Operator (Ben) — override",
      confidence: "MOCK: high — surface renders machine vs operator divergence"
    },
    human_gate: {
      classification: "transport_gap",
      operator_prompt: "Gate classification (Dink supplies prompt)",
      operator_line: "MOCK: Operator override active — not Maker doctrine.",
      detail: "If YEA: SoleDash writes packet; external auto-send not wired yet.",
      transport_gap: {
        headline: "MOCK transport gap",
        reason: "SoleDash cannot post to external chat until Dink wires send policy.",
        manual_step: "One manual cousin open after YEA until protocol closes gap.",
        cousin_url: null
      }
    },
    decision: {
      buttons: [
        { id: "yea", label: "YEA", enabled: true, reason_disabled: null, route_owner: null },
        { id: "nay", label: "NAY", enabled: true, reason_disabled: null, route_owner: null },
        {
          id: "needs_research",
          label: "NEEDS RESEARCH",
          enabled: true,
          reason_disabled: null,
          route_owner: "Thufir"
        },
        {
          id: "kill_test",
          label: "KILL TEST",
          enabled: true,
          reason_disabled: null,
          route_owner: "Bean"
        },
        {
          id: "human_reality",
          label: "HUMAN REALITY",
          enabled: true,
          reason_disabled: null,
          route_owner: "Ender"
        },
        { id: "more_info", label: "EXPAND WHY", enabled: true, reason_disabled: null, route_owner: null }
      ],
      if_clicked:
        "MOCK: YEA dispatches when live. NAY drops. Route buttons → Thufir / Bean / Ender."
    },
    decision_receipt: {
      receipt_id: null,
      kind: null,
      last_action: null,
      outcome: null,
      next_state: null,
      written_to: null
    },
    operator_chat: {
      placeholder: "Type intent — try “next” for structured OperatorIntent (mock)…",
      entries: [],
      pending_route: null
    },
    throughput_log: [
      { label: "Data source", detail: "maker-mock-placeholder" },
      { label: "Protocol", detail: SOLEDASH_PROTOCOL_VERSION },
      { label: "Receipt center", detail: "MOCK — client log until Dink persistence" },
      { label: "Awaiting", detail: "Dink DECISION_SURFACE.json + live receipt transport" }
    ]
  };
}
