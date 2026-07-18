import { NextResponse } from "next/server";

import { consumeHarveyCloudReceiverNonce, recordHarveyCloudReceipt } from "@/lib/harvey/cloud-relay";
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
    const expected = ["claim_token", "delivery_id", "detail", "metadata", "reply", "state"];
    const fields = Object.keys(parsed.body).sort();
    if (fields.length !== expected.length || fields.some((field, index) => field !== expected[index])) {
      throw new Error("HARVEY_RECEIPT_INPUT_FIELDS_INVALID");
    }
    const actor = await authenticateMachineRequestWithNonceConsumer(request, parsed.rawBody, consumeHarveyCloudReceiverNonce);
    const receipt = await recordHarveyCloudReceipt(actor, parsed.body);
    return NextResponse.json({ ok: true, ...receipt }, { headers: responseHeaders });
  } catch (error) {
    const failure = harveyErrorResponse(error, "HARVEY_CLOUD_RECEIPT_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status, headers: responseHeaders });
  }
}
