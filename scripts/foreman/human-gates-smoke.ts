import assert from "node:assert/strict";

import {
  classifyHumanGateAction,
  readHumanGateDashboard,
  refreshAllHumanGateArtifacts,
  validateHumanGateDecisionInput
} from "@/lib/tinkerden/human-gates";

async function main() {
  const nonGate = classifyHumanGateAction({
    action_text: "run local typecheck and local route smoke test",
    environment: "local",
    lane: "local proof"
  });
  assert.equal(nonGate.classification, "NON_GATE_TECHNICAL_PROOF");
  assert.equal(nonGate.stop_required, false);

  const tierOne = classifyHumanGateAction({
    action_text: "push to main and deploy production",
    environment: "production",
    lane: "release"
  });
  assert.equal(tierOne.classification, "TIER_1_HUMAN_GATE");
  assert.equal(tierOne.stop_required, true);

  const refreshed = await refreshAllHumanGateArtifacts();
  assert.equal(refreshed.ok, true);
  assert.ok(refreshed.active_queue_path);
  assert.ok(refreshed.manifest_path);
  assert.ok(refreshed.current_gate_review_path);
  assert.ok(refreshed.health_report_path);
  assert.ok(refreshed.current_gate_packet_path);
  assert.ok(refreshed.operator_brief_path);
  assert.ok(refreshed.agent_handoff_path);

  const dashboard = await readHumanGateDashboard();
  assert.equal(dashboard.ok, true);
  assert.ok(dashboard.active_gate_count >= 1);
  assert.ok(dashboard.operator_brief_path);
  assert.ok(dashboard.agent_handoff_path);

  const gate = dashboard.gates.find((item) => item.title === "ACTIVE HUMAN GATES LOCAL SURFACE REVIEW");
  assert.ok(gate, "Expected local surface review gate to exist");
  const validation = await validateHumanGateDecisionInput({
    gate_name: gate.title,
    gate_artifact_path: gate.artifact_path ?? gate.source,
    exact_ben_phrase: gate.approval_phrase,
    decision: "APPROVED",
    next_gate: "[IN PROGRESS: HUMAN_GATES_SMOKE]"
  });
  assert.equal(validation.mutation, false);
  assert.equal(validation.phrase_match, true);

  console.log(
    JSON.stringify(
      {
        ok: true,
        active_gate_count: dashboard.active_gate_count,
        health_status: refreshed.health_status,
        manifest_path: refreshed.manifest_path,
        operator_brief_path: refreshed.operator_brief_path,
        agent_handoff_path: refreshed.agent_handoff_path
      },
      null,
      2
    )
  );
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
