import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

import { NextResponse } from "next/server";

import { HarveyControlError } from "@/lib/harvey/machine-control";
import { harveyPrivateApiGate } from "@/lib/harvey/private-access";
import {
  assertMachineRequestEnvelope,
  authenticateMachineRequest,
  authenticateOperatorRequest,
  harveyErrorResponse,
  readHarveyWriteBody
} from "@/lib/harvey/machine-security";
import {
  approveSallyPairing,
  createSallyWitnessChallenge,
  parseWitnessCookie,
  readOperatorSallyPairings,
  readPublicSallyWitness,
  readSallyPairingStatus,
  redeemSallyPairing,
  reissueSallyWitnessChallenge,
  recordSallyBrowserCompleted,
  recordSallyHostReady,
  recordSallyPageReady,
  requestSallyPairing,
  SALLY_OPERATOR_SESSION_TTL_MS
} from "@/lib/harvey/sally-witness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "cache-control": "no-store, max-age=0", "x-content-type-options": "nosniff" };
const PINNED_WITNESS_SCRIPT_SHA256 = "3855d57e1dec7ea9949236e76376d440a53d461ad60dfa23677d862360ec93ed";

function assertExactFields(body: Record<string, unknown>, allowed: string[]) {
  const unexpected = Object.keys(body).filter((key) => !allowed.includes(key));
  if (unexpected.length) throw new HarveyControlError("CALLER_IDENTITY_FIELDS_FORBIDDEN", 400);
}

function cookieValue(request: Request, name: string) {
  const item = (request.headers.get("cookie") ?? "").split(";").map((value) => value.trim()).find((value) => value.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : undefined;
}

function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  let originUrl: URL;
  try { originUrl = new URL(origin); }
  catch { throw new HarveyControlError("SALLY_WITNESS_ORIGIN_INVALID", 403); }
  const requestHost = request.headers.get("host") ?? new URL(request.url).host;
  const [requestName, requestPort = "80"] = requestHost.toLowerCase().split(":");
  const originName = originUrl.hostname.toLowerCase();
  const originPort = originUrl.port || "80";
  const loopbackAlias = new Set(["127.0.0.1", "localhost"]);
  const hostMatches = originName === requestName || (loopbackAlias.has(originName) && loopbackAlias.has(requestName));
  if (originUrl.protocol !== "http:" || !hostMatches || originPort !== requestPort) throw new HarveyControlError("SALLY_WITNESS_ORIGIN_INVALID", 403);
  if (request.headers.get("referer")?.includes("#witness=")) throw new HarveyControlError("SALLY_WITNESS_CAPABILITY_URL_LEAK", 400);
}

function assertShellPairingRequest(request: Request) {
  if (request.headers.get("origin") || request.headers.get("referer")) throw new HarveyControlError("SALLY_PAIRING_BROWSER_REQUEST_FORBIDDEN", 403);
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) throw new HarveyControlError("SALLY_PAIRING_CONTENT_TYPE_INVALID", 415);
}

async function packetText(state: Awaited<ReturnType<typeof readPublicSallyWitness>>, scriptSha256: string) {
  if (!state) return "BLOCKER: NO_ACTIVE_SALLY_WITNESS_CHALLENGE\n";
  const base = "http://10.1.10.8:3000";
  return `# K_SALLY_HARVEY_LIVE_ACCEPTANCE\n\nChallenge: ${state.challenge_id}\nExpires: ${state.expires_at}\nWITNESS_SCRIPT_SHA256: ${scriptSha256}\n\nRun only on canonical machine Sally. The trusted K line must carry this same WITNESS_SCRIPT_SHA256. Refuse execution if it does not. This one-shot witness sends no heartbeat and creates no service.\n\n1. Fetch, hash-check, then inspect the script without executing it:\n\n\`\`\`powershell\n$expected = \"${scriptSha256}\"\n$response = Invoke-WebRequest -UseBasicParsing -Uri \"${base}/api/harvey/witness?format=script\"\n$code = $response.Content\n$sha = [System.Security.Cryptography.SHA256]::Create()\ntry { $actual = ([System.BitConverter]::ToString($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($code)))).Replace('-', '').ToLowerInvariant() } finally { $sha.Dispose() }\nif ($actual -ne $expected) { throw \"WITNESS_SCRIPT_INTEGRITY_MISMATCH\" }\n$code\n\`\`\`\n\n2. After inspection, execute the already-verified in-memory script:\n\n\`\`\`powershell\n& ([scriptblock]::Create($code)) -ChallengeId \"${state.challenge_id}\" -CockpitUrl \"${base}\"\n\`\`\`\n\n3. Keep the opened Harvey page visible. Do not refresh it. Harvey queues one Doss PING and returns BROWSER COMPLETED automatically.\n\nReturn only:\n${base}/api/harvey/witness\n`;
}

export async function GET(request: Request) {
  const denied = await harveyPrivateApiGate(request);
  if (denied) return denied;
  try {
    const format = new URL(request.url).searchParams.get("format");
    const state = await readPublicSallyWitness();
    const script = await fs.readFile(path.join(process.cwd(), "scripts", "foreman", "Invoke-HarveySallyWitness.ps1"), "utf8");
    const scriptSha256 = createHash("sha256").update(script, "utf8").digest("hex");
    if (scriptSha256 !== PINNED_WITNESS_SCRIPT_SHA256) throw new HarveyControlError("SALLY_WITNESS_SCRIPT_INTEGRITY_MISMATCH", 503);
    if (format === "packet") {
      const packet = (await packetText(state, PINNED_WITNESS_SCRIPT_SHA256)).replace("K_SALLY_HARVEY_LIVE_ACCEPTANCE", "K_SALLY_HARVEY_BROWSER_ACCEPTANCE");
      return new NextResponse(packet, { status: 200, headers: { ...headers, "content-type": "text/markdown; charset=utf-8" } });
    }
    if (format === "script") {
      return new NextResponse(script, { status: 200, headers: { ...headers, "content-type": "text/plain; charset=utf-8", "x-harvey-content-sha256": scriptSha256 } });
    }
    return NextResponse.json({ ok: true, witness: state, witness_script_sha256: scriptSha256 }, { headers });
  } catch (error) {
    const failure = harveyErrorResponse(error, "SALLY_WITNESS_READ_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status, headers });
  }
}

export async function POST(request: Request) {
  try {
    if (new URL(request.url).search) throw new HarveyControlError("SALLY_WITNESS_QUERY_FORBIDDEN", 400);
    const parsed = await readHarveyWriteBody(request);
    const phase = String(parsed.body.phase ?? "");
    if (phase === "CREATE") {
      assertExactFields(parsed.body, ["phase"]);
      const actor = authenticateOperatorRequest(request);
      return NextResponse.json({ ok: true, witness: await createSallyWitnessChallenge(actor) }, { headers });
    }
    if (phase === "REISSUE") {
      assertExactFields(parsed.body, ["phase"]);
      const actor = authenticateOperatorRequest(request);
      return NextResponse.json({ ok: true, witness: await reissueSallyWitnessChallenge(actor) }, { headers });
    }
    if (phase === "HOST_READY") {
      assertExactFields(parsed.body, ["phase", "challenge_id", "initial_revision", "capability_sha256"]);
      const envelope = assertMachineRequestEnvelope(request);
      const actor = await authenticateMachineRequest(request, parsed.rawBody, envelope);
      await recordSallyHostReady(parsed.body, actor);
      return NextResponse.json({ ok: true, witness: await readPublicSallyWitness() }, { headers });
    }
    if (phase === "PAIRING_REQUEST") {
      assertShellPairingRequest(request);
      assertExactFields(parsed.body, ["phase", "challenge_id", "machine", "hostname", "agent_id", "initial_revision", "capability_sha256", "public_key_jwk"]);
      return NextResponse.json({ ok: true, pairing: await requestSallyPairing(parsed.body) }, { headers });
    }
    if (phase === "PAIRING_STATUS") {
      assertShellPairingRequest(request);
      assertExactFields(parsed.body, ["phase", "challenge_id", "request_id"]);
      return NextResponse.json({ ok: true, pairing: await readSallyPairingStatus(parsed.body) }, { headers });
    }
    if (phase === "PAIRING_REDEEM") {
      assertShellPairingRequest(request);
      assertExactFields(parsed.body, ["phase", "challenge_id", "request_id", "initial_revision", "capability_sha256", "signature"]);
      await redeemSallyPairing(parsed.body);
      return NextResponse.json({ ok: true, witness: await readPublicSallyWitness() }, { headers });
    }
    if (phase === "PAIRING_DETAILS") {
      assertExactFields(parsed.body, ["phase"]);
      const actor = authenticateOperatorRequest(request);
      return NextResponse.json({ ok: true, pairings: await readOperatorSallyPairings(actor) }, { headers });
    }
    if (phase === "APPROVE_PAIRING") {
      assertExactFields(parsed.body, ["phase", "challenge_id", "request_id", "pairing_code"]);
      const actor = authenticateOperatorRequest(request);
      await approveSallyPairing(parsed.body, actor);
      return NextResponse.json({ ok: true, witness: await readPublicSallyWitness() }, { headers });
    }
    assertSameOrigin(request);
    if (phase === "PAGE_READY") {
      assertExactFields(parsed.body, ["phase", "challenge_id", "capability", "page_instance_id", "time_origin", "navigation_count"]);
      const challengeId = String(parsed.body.challenge_id ?? "");
      const cookie = cookieValue(request, "harvey_sally_witness");
      const existingSession = cookie ? parseWitnessCookie(cookie, challengeId) : undefined;
      const result = await recordSallyPageReady(parsed.body, existingSession);
      const response = NextResponse.json({ ok: true, witness: await readPublicSallyWitness() }, { headers });
      if (result.sessionToken) {
        response.cookies.set("harvey_sally_witness", `${result.state.challenge_id}.${result.sessionToken}`, {
          httpOnly: true,
          sameSite: "strict",
          path: "/api/harvey",
          maxAge: SALLY_OPERATOR_SESSION_TTL_MS / 1000
        });
      }
      return response;
    }
    if (phase === "BROWSER_COMPLETED") {
      assertExactFields(parsed.body, ["phase", "challenge_id", "command_id", "initial_revision", "observed_revision", "page_instance_id", "time_origin", "navigation_count"]);
      const challengeId = String(parsed.body.challenge_id ?? "");
      const session = parseWitnessCookie(cookieValue(request, "harvey_sally_witness"), challengeId);
      await recordSallyBrowserCompleted(parsed.body, session);
      const response = NextResponse.json({ ok: true, witness: await readPublicSallyWitness() }, { headers });
      response.cookies.set("harvey_sally_witness", `${challengeId}.${session}`, {
        httpOnly: true,
        sameSite: "strict",
        path: "/api/harvey",
        maxAge: SALLY_OPERATOR_SESSION_TTL_MS / 1000
      });
      return response;
    }
    throw new HarveyControlError("SALLY_WITNESS_PHASE_INVALID", 400);
  } catch (error) {
    const failure = harveyErrorResponse(error, "SALLY_WITNESS_WRITE_FAILED");
    return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status, headers });
  }
}
