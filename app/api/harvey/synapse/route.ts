import { NextResponse } from "next/server";

import { authenticateOperatorRequest, harveyErrorResponse, readHarveyWriteBody } from "@/lib/harvey/machine-security";
import { HarveyControlError } from "@/lib/harvey/machine-control";
import { authenticateSallyOperatorRequest } from "@/lib/harvey/sally-witness";
import {
  appendHarveySynapseBenFollowup,
  appendHarveySynapseRoleReply,
  createHarveySynapse,
  readHarveySynapseProjection,
  recordHarveySynapsePresentation,
  synapseSeatForRoute,
  type HarveySynapseRoute
} from "@/lib/harvey/synapse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = {
  "cache-control": "no-store, max-age=0",
  "x-content-type-options": "nosniff",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'"
};

async function authenticateSynapseRoute(request: Request): Promise<HarveySynapseRoute> {
  const actor = request.headers.has("authorization")
    ? await authenticateOperatorRequest(request)
    : await authenticateSallyOperatorRequest(request);
  return actor.operator_id.startsWith("sally-browser:") ? "SALLY_PAIRED_SESSION" : "DOSS_LOOPBACK";
}

function viewer(route: HarveySynapseRoute) {
  return {
    route,
    seat: synapseSeatForRoute(route),
    proof: route === "DOSS_LOOPBACK" ? "LOOPBACK_OPERATOR_BRIDGE" : "PAIRED_SALLY_BROWSER_SESSION",
    task_identity_proven: false
  } as const;
}

export async function GET(request: Request) {
  try {
    const route = await authenticateSynapseRoute(request);
    return NextResponse.json({ ok: true, viewer: viewer(route), projection: await readHarveySynapseProjection() }, { headers: responseHeaders });
  } catch (error) {
    const failure = harveyErrorResponse(error, "SYNAPSE_READ_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status, headers: responseHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const route = await authenticateSynapseRoute(request);
    const parsed = await readHarveyWriteBody(request);
    const action = String(parsed.body.action ?? "").toUpperCase();
    if (!action) throw new HarveyControlError("SYNAPSE_ACTION_REQUIRED");
    const expectedFields = action === "CREATE"
      ? ["action", "submission_id", "verb", "subject", "body"]
      : action === "BEN_FOLLOWUP"
        ? ["action", "synapse_id", "submission_id", "body"]
        : action === "PRESENTED"
          ? ["action", "synapse_id", "submission_id", "reply_to", "presented_entry_sha256"]
          : action === "REPLY"
            ? ["action", "synapse_id", "submission_id", "reply_to", "kind", "body"]
            : [];
    const actualFields = Object.keys(parsed.body).sort();
    const sortedExpected = [...expectedFields].sort();
    if (!expectedFields.length || actualFields.length !== sortedExpected.length || actualFields.some((field, index) => field !== sortedExpected[index])) {
      throw new HarveyControlError("SYNAPSE_INPUT_FIELDS_INVALID");
    }
    if (action === "CREATE") await createHarveySynapse(parsed.body, route);
    else if (action === "BEN_FOLLOWUP") await appendHarveySynapseBenFollowup(parsed.body, route);
    else if (action === "PRESENTED") await recordHarveySynapsePresentation(parsed.body, route);
    else if (action === "REPLY") await appendHarveySynapseRoleReply(parsed.body, route);
    else throw new HarveyControlError("SYNAPSE_ACTION_INVALID");
    return NextResponse.json({ ok: true, viewer: viewer(route), projection: await readHarveySynapseProjection() }, { headers: responseHeaders });
  } catch (error) {
    const failure = harveyErrorResponse(error, "SYNAPSE_WRITE_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status, headers: responseHeaders });
  }
}
