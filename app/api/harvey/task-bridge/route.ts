import { NextResponse } from "next/server";

import { HarveyControlError } from "@/lib/harvey/machine-control";
import { authenticateOperatorRequest, harveyErrorResponse, readHarveyWriteBody } from "@/lib/harvey/machine-security";
import { authenticateSallyOperatorRequest } from "@/lib/harvey/sally-witness";
import { createHarveyTaskDispatch, readHarveyTaskBridgeProjection } from "@/lib/harvey/task-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = {
  "cache-control": "no-store, max-age=0",
  "x-content-type-options": "nosniff",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'"
};

async function authenticateTaskBridgeRoute(request: Request) {
  const actor = request.headers.has("authorization")
    ? await authenticateOperatorRequest(request)
    : await authenticateSallyOperatorRequest(request);
  return actor.operator_id.startsWith("sally-browser:") ? "SALLY_PAIRED_SESSION" : "DOSS_LOOPBACK";
}

function viewer(route: string) {
  return { route, binding_scope: "ALLOWLISTED_TASK_IDS", task_identity_proven_by: "CODEX_THREAD_STARTED_EVENT" };
}

export async function GET(request: Request) {
  try {
    const route = await authenticateTaskBridgeRoute(request);
    return NextResponse.json({ ok: true, viewer: viewer(route), bridge: await readHarveyTaskBridgeProjection() }, { headers: responseHeaders });
  } catch (error) {
    const failure = harveyErrorResponse(error, "TASK_BRIDGE_READ_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status, headers: responseHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const route = await authenticateTaskBridgeRoute(request);
    const parsed = await readHarveyWriteBody(request);
    const expected = ["binding_id", "body", "submission_id"];
    const actual = Object.keys(parsed.body).sort();
    if (actual.length !== expected.length || actual.some((field, index) => field !== expected[index])) throw new HarveyControlError("TASK_BRIDGE_INPUT_FIELDS_INVALID");
    const dispatch = await createHarveyTaskDispatch(parsed.body);
    return NextResponse.json({ ok: true, viewer: viewer(route), dispatch, bridge: await readHarveyTaskBridgeProjection() }, { status: 202, headers: responseHeaders });
  } catch (error) {
    const failure = harveyErrorResponse(error, "TASK_BRIDGE_WRITE_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status, headers: responseHeaders });
  }
}
