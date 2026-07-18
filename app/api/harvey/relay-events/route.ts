import { NextResponse } from "next/server";

import { listCrewBridgeDeliveries, recordCrewBridgeEvent } from "@/lib/harvey/crew-bridge";
import {
  assertMachineRequestEnvelope,
  authenticateMachineRequest,
  harveyErrorResponse,
  readHarveyWriteBody
} from "@/lib/harvey/machine-security";
import { harveyPrivateApiGate } from "@/lib/harvey/private-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store, max-age=0" };

export async function GET(request: Request) {
  const denied = await harveyPrivateApiGate(request);
  if (denied) return denied;
  try {
    const deliveries = await listCrewBridgeDeliveries();
    return NextResponse.json({
      ok: true,
      schema: "werkles.harvey-crew-bridge-projection/v1",
      automation: "SEND_DISABLED",
      terminal_rule: "RECEIPTED_OR_BLOCKED_ONLY",
      source_machine: "Spanzee",
      deliveries
    }, { headers: noStore });
  } catch (error) {
    const failure = harveyErrorResponse(error, "BRIDGE_READ_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status, headers: noStore });
  }
}

export async function POST(request: Request) {
  try {
    const envelope = assertMachineRequestEnvelope(request);
    const parsed = await readHarveyWriteBody(request);
    const actor = await authenticateMachineRequest(request, parsed.rawBody, envelope);
    const result = await recordCrewBridgeEvent(parsed.body, actor);
    return NextResponse.json({ ok: true, ...result }, { headers: noStore });
  } catch (error) {
    const failure = harveyErrorResponse(error, "BRIDGE_WRITE_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status, headers: noStore });
  }
}
