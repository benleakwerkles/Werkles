import { NextResponse } from "next/server";

import { readHarveyPasswordActionReceipt, readHarveyPasswordIncidentProjection, updateHarveyPasswordActionReceipt } from "@/lib/harvey/password-incident";
import { authenticateOperatorRequest, harveyErrorResponse, readHarveyWriteBody } from "@/lib/harvey/machine-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store, max-age=0", "x-content-type-options": "nosniff" };

export async function POST(request: Request) {
  try {
    const actor = authenticateOperatorRequest(request);
    const parsed = await readHarveyWriteBody(request);
    const projection = await readHarveyPasswordIncidentProjection();
    const actionReceipt = Object.keys(parsed.body).length === 0
      ? await readHarveyPasswordActionReceipt()
      : await updateHarveyPasswordActionReceipt(parsed.body, actor);
    return NextResponse.json({ ok: true, projection, action_receipt: actionReceipt }, { headers: noStore });
  } catch (error) {
    const failure = harveyErrorResponse(error, "PASSWORD_INCIDENT_READ_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status, headers: noStore });
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "OPERATOR_ROUTE_REQUIRED" }, { status: 404, headers: noStore });
}
