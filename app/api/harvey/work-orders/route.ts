import { NextResponse } from "next/server";

import { authenticateOperatorRequest, harveyErrorResponse, readHarveyWriteBody } from "@/lib/harvey/machine-security";
import { authenticateSallyOperatorRequest } from "@/lib/harvey/sally-witness";
import { createHarveyWorkOrder } from "@/lib/harvey/work-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const responseHeaders = { "cache-control": "no-store, max-age=0", "x-content-type-options": "nosniff" };

async function authenticateWorkOrderOperator(request: Request) {
  return request.headers.has("authorization")
    ? authenticateOperatorRequest(request)
    : authenticateSallyOperatorRequest(request);
}

export async function GET(request: Request) {
  try {
    const actor = await authenticateWorkOrderOperator(request);
    return NextResponse.json({ ok: true, operator: { mode: actor.operator_id.startsWith("sally-browser:") ? "SALLY_PAIRED" : "DOSS_LOOPBACK" } }, { headers: responseHeaders });
  } catch (error) {
    const failure = harveyErrorResponse(error, "WORK_ORDER_OPERATOR_STATUS_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status, headers: responseHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await authenticateWorkOrderOperator(request);
    const parsed = await readHarveyWriteBody(request);
    return NextResponse.json({ ok: true, work_order: await createHarveyWorkOrder(parsed.body, actor) }, { headers: responseHeaders });
  } catch (error) {
    const failure = harveyErrorResponse(error, "WORK_ORDER_CREATE_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status, headers: responseHeaders });
  }
}
