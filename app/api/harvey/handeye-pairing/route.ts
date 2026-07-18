import { NextResponse } from "next/server";

import { parseEphemeralRsaEnvelope } from "@/lib/harvey/ephemeral-rsa";
import {
  approveBetsyHandeyePairing,
  readBetsyHandeyePairingStatus,
  readOperatorBetsyHandeyePairings,
  recordBetsyHandeyePageReady,
  redeemBetsyHandeyePairing,
  requestBetsyHandeyePairing
} from "@/lib/harvey/handeye-pairing";
import { HarveyControlError } from "@/lib/harvey/machine-control";
import {
  authenticateOperatorRequest,
  harveyErrorResponse,
  readHarveyWriteBody
} from "@/lib/harvey/machine-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = {
  "cache-control": "no-store, max-age=0",
  "x-content-type-options": "nosniff"
};

function assertExactFields(body: Record<string, unknown>, allowed: string[]) {
  const unexpected = Object.keys(body).filter((key) => !allowed.includes(key));
  if (unexpected.length || allowed.some((key) => !(key in body))) {
    throw new HarveyControlError("HANDEYE_PAIRING_BODY_FIELDS_INVALID", 400);
  }
}

function assertShellRequest(request: Request) {
  if (request.headers.get("origin") || request.headers.get("referer")) {
    throw new HarveyControlError("HANDEYE_PAIRING_BROWSER_REQUEST_FORBIDDEN", 403);
  }
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    throw new HarveyControlError("HANDEYE_PAIRING_CONTENT_TYPE_INVALID", 415);
  }
}

function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  let originUrl: URL;
  try { originUrl = new URL(origin); }
  catch { throw new HarveyControlError("HANDEYE_PAGE_READY_ORIGIN_INVALID", 403); }
  const requestUrl = new URL(request.url);
  const requestHost = (request.headers.get("host") ?? requestUrl.host).toLowerCase();
  const [requestName, requestPort = "80"] = requestHost.split(":");
  const originName = originUrl.hostname.toLowerCase();
  const originPort = originUrl.port || "80";
  const loopback = new Set(["127.0.0.1", "localhost"]);
  const nameMatches = originName === requestName || (loopback.has(originName) && loopback.has(requestName));
  if (originUrl.protocol !== "http:" || !nameMatches || originPort !== requestPort) {
    throw new HarveyControlError("HANDEYE_PAGE_READY_ORIGIN_INVALID", 403);
  }
}

export async function POST(request: Request) {
  try {
    if (new URL(request.url).search) throw new HarveyControlError("HANDEYE_PAIRING_QUERY_FORBIDDEN", 400);
    const parsed = await readHarveyWriteBody(request);
    const phase = String(parsed.body.phase ?? "");

    if (phase === "REQUEST") {
      assertShellRequest(request);
      assertExactFields(parsed.body, ["phase", "public_key_jwk"]);
      return NextResponse.json({ ok: true, pairing: await requestBetsyHandeyePairing(parsed.body) }, { headers: responseHeaders });
    }
    if (phase === "STATUS") {
      assertShellRequest(request);
      assertExactFields(parsed.body, ["phase", "pairing_id"]);
      return NextResponse.json({ ok: true, pairing: await readBetsyHandeyePairingStatus(parsed.body) }, { headers: responseHeaders });
    }
    if (phase === "DETAILS") {
      assertExactFields(parsed.body, ["phase"]);
      const actor = authenticateOperatorRequest(request);
      return NextResponse.json({ ok: true, pairings: await readOperatorBetsyHandeyePairings(actor) }, { headers: responseHeaders });
    }
    if (phase === "APPROVE") {
      assertExactFields(parsed.body, ["phase", "pairing_id", "pairing_code"]);
      const actor = authenticateOperatorRequest(request);
      return NextResponse.json({ ok: true, pairing: await approveBetsyHandeyePairing(parsed.body, actor) }, { headers: responseHeaders });
    }
    if (phase === "REDEEM") {
      assertShellRequest(request);
      assertExactFields(parsed.body, ["phase", "pairing_id"]);
      const envelope = parseEphemeralRsaEnvelope(request);
      return NextResponse.json({
        ok: true,
        pairing: await redeemBetsyHandeyePairing(parsed.body, request, parsed.rawBody, envelope)
      }, { headers: responseHeaders });
    }
    if (phase === "PAGE_READY") {
      assertSameOrigin(request);
      assertExactFields(parsed.body, ["phase", "pairing_id", "page_capability", "page_instance_id", "time_origin", "navigation_count"]);
      return NextResponse.json({ ok: true, pairing: await recordBetsyHandeyePageReady(parsed.body) }, { headers: responseHeaders });
    }
    throw new HarveyControlError("HANDEYE_PAIRING_PHASE_INVALID", 400);
  } catch (error) {
    const failure = harveyErrorResponse(error, "HANDEYE_PAIRING_WRITE_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status, headers: responseHeaders });
  }
}
