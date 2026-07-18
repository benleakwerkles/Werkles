import { NextResponse } from "next/server";
import { listHeartbeats, writeHeartbeat } from "@/lib/harvey/machine-control";
import { assertMachineRequestEnvelope, authenticateMachineRequest, harveyErrorResponse, readHarveyWriteBody } from "@/lib/harvey/machine-security";
import { harveyPrivateApiGate } from "@/lib/harvey/private-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await harveyPrivateApiGate(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true, machines: await listHeartbeats() });
}

export async function POST(request: Request) {
  try {
    const envelope = assertMachineRequestEnvelope(request);
    const parsed = await readHarveyWriteBody(request);
    const actor = await authenticateMachineRequest(request, parsed.rawBody, envelope);
    return NextResponse.json({ ok: true, heartbeat: await writeHeartbeat(parsed.body, actor) });
  }
  catch (error) {
    const failure = harveyErrorResponse(error, "HEARTBEAT_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status });
  }
}
