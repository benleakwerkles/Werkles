import { NextResponse } from "next/server";
import { createCommand, createFleetCommands, listCommands, readFleetSummary, updateCommand } from "@/lib/harvey/machine-control";
import { assertMachineRequestEnvelope, authenticateMachineRequest, authenticateOperatorRequest, harveyErrorResponse, readHarveyWriteBody } from "@/lib/harvey/machine-security";
import { harveyPrivateApiGate } from "@/lib/harvey/private-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await harveyPrivateApiGate(request);
  if (denied) return denied;
  const parameters = new URL(request.url).searchParams;
  const machine = parameters.get("machine");
  const fleetId = parameters.get("fleet_id");
  try {
    const commands = await listCommands(machine, fleetId);
    return NextResponse.json({ ok: true, commands, ...(fleetId ? { fleet: await readFleetSummary(fleetId) } : {}) });
  }
  catch (error) {
    const failure = harveyErrorResponse(error, "COMMAND_READ_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status });
  }
}

export async function POST(request: Request) {
  try {
    const actor = authenticateOperatorRequest(request);
    const parsed = await readHarveyWriteBody(request);
    if (Array.isArray(parsed.body.machines)) {
      const created = await createFleetCommands(parsed.body, actor);
      return NextResponse.json({ ok: true, ...created });
    }
    return NextResponse.json({ ok: true, command: await createCommand(parsed.body, actor) });
  }
  catch (error) {
    const failure = harveyErrorResponse(error, "COMMAND_CREATE_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status });
  }
}

export async function PATCH(request: Request) {
  try {
    const envelope = assertMachineRequestEnvelope(request);
    const parsed = await readHarveyWriteBody(request);
    const actor = await authenticateMachineRequest(request, parsed.rawBody, envelope);
    return NextResponse.json({ ok: true, command: await updateCommand(parsed.body, actor) });
  }
  catch (error) {
    const failure = harveyErrorResponse(error, "COMMAND_UPDATE_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status });
  }
}
