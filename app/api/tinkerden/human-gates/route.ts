import { NextResponse } from "next/server";

import {
  classifyHumanGateAction,
  createHumanGateReview,
  readHumanGateDashboard,
  refreshAllHumanGateArtifacts,
  recordHumanGateDecision,
  validateHumanGateDecisionInput,
  writeCurrentGateReviewIndex,
  writeCurrentGatePacket,
  writeAgentHandoff,
  writeHumanGateHealthReport,
  writeHumanGateManifest,
  writeHumanGateQueueSnapshot,
  writeOperatorBrief
} from "@/lib/tinkerden/human-gates";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await readHumanGateDashboard());
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "HUMAN_GATES_READ_FAILED" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "create_gate";

    if (action === "record_decision") {
      return NextResponse.json(await recordHumanGateDecision(body));
    }

    if (action === "validate_decision_phrase") {
      return NextResponse.json(await validateHumanGateDecisionInput(body));
    }

    if (action === "classify_action") {
      return NextResponse.json(classifyHumanGateAction(body));
    }

    if (action === "refresh_all_artifacts") {
      return NextResponse.json(await refreshAllHumanGateArtifacts());
    }

    if (action === "write_queue_snapshot") {
      return NextResponse.json(await writeHumanGateQueueSnapshot());
    }

    if (action === "write_current_gate_index") {
      return NextResponse.json(await writeCurrentGateReviewIndex());
    }

    if (action === "write_health_report") {
      return NextResponse.json(await writeHumanGateHealthReport());
    }

    if (action === "write_manifest") {
      return NextResponse.json(await writeHumanGateManifest());
    }

    if (action === "write_current_gate_packet") {
      return NextResponse.json(await writeCurrentGatePacket());
    }

    if (action === "write_operator_brief") {
      return NextResponse.json(await writeOperatorBrief());
    }

    if (action === "write_agent_handoff") {
      return NextResponse.json(await writeAgentHandoff());
    }

    if (action === "create_gate") {
      return NextResponse.json(await createHumanGateReview(body));
    }

    return NextResponse.json({ ok: false, error: "VALID_ACTION_REQUIRED" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "HUMAN_GATES_WRITE_FAILED" },
      { status: 500 }
    );
  }
}
