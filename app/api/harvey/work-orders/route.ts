import { NextResponse } from "next/server";

import { authenticateOperatorRequest, harveyErrorResponse, readHarveyWriteBody } from "@/lib/harvey/machine-security";
import { enqueueHarveyCloudCommand, readHarveyCloudCommand } from "@/lib/harvey/cloud-relay";
import type { HarveyOperatorActor } from "@/lib/harvey/machine-control";
import { harveyPrivateApiGate, harveyPrivateSameOrigin } from "@/lib/harvey/private-access";
import { createHarveyWorkOrder } from "@/lib/harvey/work-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const responseHeaders = { "cache-control": "no-store, max-age=0", "x-content-type-options": "nosniff" };

async function authenticateWorkOrderOperator(request: Request): Promise<{ actor: HarveyOperatorActor; cloud: boolean; denied: NextResponse | null }> {
  if (request.headers.has("authorization")) {
    return { actor: authenticateOperatorRequest(request), cloud: false, denied: null };
  }
  const denied = await harveyPrivateApiGate(request);
  return { actor: { role: "operator", operator_id: "harvey-private-browser" }, cloud: true, denied };
}

export async function GET(request: Request) {
  try {
    const { actor, cloud, denied } = await authenticateWorkOrderOperator(request);
    if (denied) return denied;
    const commandId = new URL(request.url).searchParams.get("command_id");
    if (commandId) return NextResponse.json({ ok: true, relay: await readHarveyCloudCommand(commandId) }, { headers: responseHeaders });
    return NextResponse.json({ ok: true, operator: { mode: cloud ? "HARVEY_CLOUD" : "DOSS_LOOPBACK", operator_id: actor.operator_id } }, { headers: responseHeaders });
  } catch (error) {
    const failure = harveyErrorResponse(error, "WORK_ORDER_OPERATOR_STATUS_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status, headers: responseHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const { actor, cloud, denied } = await authenticateWorkOrderOperator(request);
    if (denied) return denied;
    if (cloud && !harveyPrivateSameOrigin(request)) {
      return NextResponse.json({ ok: false, error: "REQUEST_ORIGIN_REJECTED" }, { status: 403, headers: responseHeaders });
    }
    const parsed = await readHarveyWriteBody(request);
    const workOrder = cloud
      ? await enqueueHarveyCloudCommand(parsed.body, actor)
      : await createHarveyWorkOrder(parsed.body, actor);
    return NextResponse.json({ ok: true, work_order: workOrder }, { status: cloud ? 202 : 200, headers: responseHeaders });
  } catch (error) {
    const failure = harveyErrorResponse(error, "WORK_ORDER_CREATE_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status, headers: responseHeaders });
  }
}
