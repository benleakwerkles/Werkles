import { NextResponse } from "next/server";

import { claimHarveyCloudDeliveries, consumeHarveyCloudReceiverNonce } from "@/lib/harvey/cloud-relay";
import {
  authenticateMachineRequestWithNonceConsumer,
  harveyErrorResponse,
  readHarveyWriteBody
} from "@/lib/harvey/machine-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = {
  "cache-control": "no-store, max-age=0",
  "x-content-type-options": "nosniff",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'"
};

export async function POST(request: Request) {
  try {
    const parsed = await readHarveyWriteBody(request);
    const fields = Object.keys(parsed.body).sort();
    if (fields.length !== 1 || fields[0] !== "limit") throw new Error("HARVEY_CLAIM_INPUT_FIELDS_INVALID");
    const actor = await authenticateMachineRequestWithNonceConsumer(request, parsed.rawBody, consumeHarveyCloudReceiverNonce);
    const claim = await claimHarveyCloudDeliveries(actor, Number(parsed.body.limit));
    return NextResponse.json({ ok: true, claim }, { headers: responseHeaders });
  } catch (error) {
    const failure = harveyErrorResponse(error, "HARVEY_CLOUD_CLAIM_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status, headers: responseHeaders });
  }
}
