import http from "node:http";
import { pathToFileURL } from "node:url";

const DEFAULT_ALLOWED_ORIGINS = ["http://127.0.0.1:3000", "http://localhost:3000"];
const MAX_BODY_BYTES = 8 * 1024;
const MAX_UPSTREAM_BODY_BYTES = 64 * 1024;
const OPERATOR_POST_PATHS = new Set(["/commands", "/fleet/knock", "/sally-witness", "/sally-witness/pairings", "/sally-witness/approve"]);

function requireLoopbackUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(url.hostname)) {
    throw new Error("HARVEY_OPERATOR_UPSTREAM_MUST_BE_LOOPBACK");
  }
  return url;
}

async function readJsonBody(request) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > MAX_BODY_BYTES) throw Object.assign(new Error("OPERATOR_REQUEST_TOO_LARGE"), { status: 413 });
    chunks.push(chunk);
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("not object");
    return parsed;
  } catch (error) {
    if (error?.status) throw error;
    throw Object.assign(new Error("OPERATOR_REQUEST_INVALID_JSON"), { status: 400 });
  }
}

function writeJson(response, status, body, origin) {
  const serialized = JSON.stringify(body);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...(origin ? { "access-control-allow-origin": origin, vary: "Origin" } : {})
  });
  response.end(serialized);
}

function assertBrowserOrigin(request, allowedOrigins) {
  const origin = request.headers.origin ?? "";
  if (!allowedOrigins.has(origin)) throw Object.assign(new Error("OPERATOR_ORIGIN_FORBIDDEN"), { status: 403 });
  const fetchSite = request.headers["sec-fetch-site"];
  if (fetchSite && !["same-origin", "same-site"].includes(fetchSite)) {
    throw Object.assign(new Error("OPERATOR_FETCH_SITE_FORBIDDEN"), { status: 403 });
  }
  return origin;
}

const COMMAND_STATUSES = new Set(["QUEUED", "RECEIVED", "COMPLETED", "BLOCKER"]);
const COMMAND_ACTIONS = new Set(["PING", "KNOCK", "OPEN_URL"]);
const MACHINES = new Set(["Doss", "Betsy", "Spanzee", "Medullina", "Sally"]);

function containsSecret(value, secret, seen = new Set()) {
  if (typeof value === "string") return value.includes(secret);
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some((item) => containsSecret(item, secret, seen));
  return Object.entries(value).some(([key, item]) => key.includes(secret) || containsSecret(item, secret, seen));
}

function requireRecord(value, error = "OPERATOR_UPSTREAM_SCHEMA_INVALID") {
  if (!value || Array.isArray(value) || typeof value !== "object") throw Object.assign(new Error(error), { status: 502 });
  return value;
}

function projectCommand(value) {
  const command = requireRecord(value);
  const commandId = String(command.command_id ?? "");
  const status = String(command.status ?? "");
  if (!/^[a-zA-Z0-9_-]+$/.test(commandId) || !COMMAND_STATUSES.has(status)) {
    throw Object.assign(new Error("OPERATOR_UPSTREAM_SCHEMA_INVALID"), { status: 502 });
  }
  const projected = { command_id: commandId, status };
  if (MACHINES.has(command.machine)) projected.machine = command.machine;
  if (COMMAND_ACTIONS.has(command.action)) projected.action = command.action;
  if (/^[a-z0-9][a-z0-9-]{0,63}$/.test(String(command.workstream_id ?? ""))) projected.workstream_id = command.workstream_id;
  return projected;
}

function projectCount(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw Object.assign(new Error("OPERATOR_UPSTREAM_SCHEMA_INVALID"), { status: 502 });
  return value;
}

function projectFleet(value) {
  const fleet = requireRecord(value);
  const fleetId = String(fleet.fleet_id ?? "");
  const status = String(fleet.status ?? "");
  if (!/^harvey_fleet_[a-zA-Z0-9_-]+$/.test(fleetId) || !COMMAND_STATUSES.has(status) || typeof fleet.terminal !== "boolean") {
    throw Object.assign(new Error("OPERATOR_UPSTREAM_SCHEMA_INVALID"), { status: 502 });
  }
  return {
    fleet_id: fleetId,
    status,
    terminal: fleet.terminal,
    addressed_count: projectCount(fleet.addressed_count),
    terminal_count: projectCount(fleet.terminal_count),
    completed_count: projectCount(fleet.completed_count),
    blocker_count: projectCount(fleet.blocker_count),
    pending_count: projectCount(fleet.pending_count),
    commands: Array.isArray(fleet.commands) ? fleet.commands.map(projectCommand) : []
  };
}

function validateFleetConsistency(commands, fleet) {
  if (commands.length !== fleet.addressed_count || fleet.commands.length !== fleet.addressed_count) {
    throw Object.assign(new Error("OPERATOR_UPSTREAM_SCHEMA_INVALID"), { status: 502 });
  }
  const key = (command) => `${command.machine ?? ""}:${command.command_id}`;
  if (commands.some((command) => !MACHINES.has(command.machine)) || fleet.commands.some((command) => !MACHINES.has(command.machine))) {
    throw Object.assign(new Error("OPERATOR_UPSTREAM_SCHEMA_INVALID"), { status: 502 });
  }
  const commandKeys = commands.map(key);
  const fleetKeys = fleet.commands.map(key);
  if (new Set(commandKeys).size !== commandKeys.length || new Set(fleetKeys).size !== fleetKeys.length) {
    throw Object.assign(new Error("OPERATOR_UPSTREAM_SCHEMA_INVALID"), { status: 502 });
  }
  const commandByKey = new Map(commands.map((command) => [key(command), command]));
  if (fleet.commands.some((command) => commandByKey.get(key(command))?.status !== command.status)) {
    throw Object.assign(new Error("OPERATOR_UPSTREAM_SCHEMA_INVALID"), { status: 502 });
  }
  const completed = fleet.commands.filter((command) => command.status === "COMPLETED").length;
  const blockers = fleet.commands.filter((command) => command.status === "BLOCKER").length;
  const terminal = completed + blockers;
  const pending = fleet.addressed_count - terminal;
  const expectedTerminal = terminal === fleet.addressed_count;
  const expectedStatus = expectedTerminal
    ? (blockers > 0 ? "BLOCKER" : "COMPLETED")
    : (fleet.commands.every((command) => command.status === "QUEUED") ? "QUEUED" : "RECEIVED");
  if (
    fleet.completed_count !== completed
    || fleet.blocker_count !== blockers
    || fleet.terminal_count !== terminal
    || fleet.pending_count !== pending
    || fleet.terminal !== expectedTerminal
    || fleet.status !== expectedStatus
  ) {
    throw Object.assign(new Error("OPERATOR_UPSTREAM_SCHEMA_INVALID"), { status: 502 });
  }
}

function projectOperatorResponse(parsed, responseKind, upstreamOk) {
  const body = requireRecord(parsed);
  if (!upstreamOk) {
    return { ok: false, error: typeof body.error === "string" && body.error ? body.error : "OPERATOR_UPSTREAM_FAILED" };
  }
  if (body.ok !== true) throw Object.assign(new Error("OPERATOR_UPSTREAM_SCHEMA_INVALID"), { status: 502 });
  if (responseKind === "fleet") {
    if (!Array.isArray(body.commands)) throw Object.assign(new Error("OPERATOR_UPSTREAM_SCHEMA_INVALID"), { status: 502 });
    const commands = body.commands.map(projectCommand);
    const fleet = projectFleet(body.fleet);
    validateFleetConsistency(commands, fleet);
    return { ok: true, commands, fleet };
  }
  if (responseKind === "witness") {
    const witness = requireRecord(body.witness);
    const challengeId = String(witness.challenge_id ?? "");
    const status = String(witness.status ?? "");
    const createdAt = String(witness.created_at ?? "");
    const expiresAt = String(witness.expires_at ?? "");
    if (!/^sally_[a-f0-9]{32}$/.test(challengeId) || !["CHALLENGE_ISSUED", "PAIRING_PENDING", "PAIRING_APPROVED", "HOST_READY", "PING_QUEUED", "COMPLETED", "BLOCKER", "EXPIRED"].includes(status) || !Number.isFinite(Date.parse(createdAt)) || !Number.isFinite(Date.parse(expiresAt)) || witness.sally_live_claimed !== false) {
      throw Object.assign(new Error("OPERATOR_UPSTREAM_SCHEMA_INVALID"), { status: 502 });
    }
    return { ok: true, witness: { challenge_id: challengeId, status, created_at: createdAt, expires_at: expiresAt, sally_live_claimed: false } };
  }
  if (responseKind === "pairings") {
    if (!Array.isArray(body.pairings) || body.pairings.length > 8) throw Object.assign(new Error("OPERATOR_UPSTREAM_SCHEMA_INVALID"), { status: 502 });
    const pairings = body.pairings.map((value) => {
      const pairing = requireRecord(value);
      const requestId = String(pairing.request_id ?? "");
      const status = String(pairing.status ?? "");
      const pairingCode = String(pairing.pairing_code ?? "");
      const publicKeySha256 = String(pairing.public_key_sha256 ?? "");
      const requestedAt = String(pairing.requested_at ?? "");
      if (!/^sally_pair_[a-f0-9]{32}$/.test(requestId) || !["PENDING", "APPROVED", "REDEEMED", "REJECTED"].includes(status) || !/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(pairingCode) || !/^[a-f0-9]{64}$/.test(publicKeySha256) || !Number.isFinite(Date.parse(requestedAt))) {
        throw Object.assign(new Error("OPERATOR_UPSTREAM_SCHEMA_INVALID"), { status: 502 });
      }
      return { request_id: requestId, status, pairing_code: pairingCode, public_key_sha256: publicKeySha256, requested_at: requestedAt };
    });
    if (new Set(pairings.map((pairing) => pairing.request_id)).size !== pairings.length) throw Object.assign(new Error("OPERATOR_UPSTREAM_SCHEMA_INVALID"), { status: 502 });
    return { ok: true, pairings };
  }
  return { ok: true, command: projectCommand(body.command) };
}

async function readUpstreamBody(response) {
  if (!response.body) return "";
  const chunks = [];
  let bytes = 0;
  for await (const chunk of response.body) {
    bytes += chunk.length;
    if (bytes > MAX_UPSTREAM_BODY_BYTES) throw Object.assign(new Error("OPERATOR_UPSTREAM_RESPONSE_TOO_LARGE"), { status: 502 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function forwardOperatorRequest({ cockpitUrl, operatorToken, path, body, responseKind }) {
  const response = await fetch(new URL(path, cockpitUrl), {
    method: "POST",
    headers: {
      authorization: `Bearer ${operatorToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const responseText = await readUpstreamBody(response);
  let parsed;
  try { parsed = JSON.parse(responseText); }
  catch { throw Object.assign(new Error("OPERATOR_UPSTREAM_INVALID_JSON"), { status: 502 }); }
  if (containsSecret(parsed, operatorToken)) throw Object.assign(new Error("UPSTREAM_SECRET_ECHO_BLOCKED"), { status: 502 });
  return { status: response.status, body: projectOperatorResponse(parsed, responseKind, response.ok) };
}

export function createHarveyOperatorBridge(options = {}) {
  const cockpitUrl = requireLoopbackUrl(options.cockpitUrl ?? process.env.HARVEY_COCKPIT_URL ?? "http://127.0.0.1:3000");
  const operatorToken = String(options.operatorToken ?? process.env.HARVEY_OPERATOR_TOKEN ?? "").trim();
  if (!operatorToken) throw new Error("HARVEY_OPERATOR_TOKEN_NOT_AVAILABLE");
  const allowedOrigins = new Set(options.allowedOrigins ?? DEFAULT_ALLOWED_ORIGINS);

  return http.createServer(async (request, response) => {
    let origin = "";
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      if (request.method === "GET" && requestUrl.pathname === "/health") {
        origin = request.headers.origin ? assertBrowserOrigin(request, allowedOrigins) : "";
        writeJson(response, 200, { ok: true, service: "harvey-operator-bridge", bind: "loopback" }, origin);
        return;
      }
      if (request.method === "OPTIONS" && OPERATOR_POST_PATHS.has(requestUrl.pathname)) {
        origin = assertBrowserOrigin(request, allowedOrigins);
        response.writeHead(204, {
          "access-control-allow-origin": origin,
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "content-type",
          "access-control-max-age": "300",
          vary: "Origin"
        });
        response.end();
        return;
      }
      if (request.method !== "POST" || !OPERATOR_POST_PATHS.has(requestUrl.pathname)) {
        writeJson(response, 404, { ok: false, error: "OPERATOR_ROUTE_NOT_FOUND" });
        return;
      }
      origin = assertBrowserOrigin(request, allowedOrigins);
      const input = await readJsonBody(request);
      if ("authorization" in input || "token" in input || "operator_token" in input) {
        throw Object.assign(new Error("OPERATOR_SECRET_INPUT_FORBIDDEN"), { status: 400 });
      }

      let commandBody;
      let upstreamPath = "/api/harvey/commands";
      let responseKind = requestUrl.pathname === "/fleet/knock" ? "fleet" : "command";
      if (requestUrl.pathname === "/sally-witness") {
        if (Object.keys(input).length) throw Object.assign(new Error("SALLY_WITNESS_INPUT_FORBIDDEN"), { status: 400 });
        const queryKeys = [...requestUrl.searchParams.keys()];
        if (queryKeys.some((key) => key !== "reissue") || ![null, "1"].includes(requestUrl.searchParams.get("reissue"))) {
          throw Object.assign(new Error("SALLY_WITNESS_QUERY_INVALID"), { status: 400 });
        }
        commandBody = { phase: requestUrl.searchParams.get("reissue") === "1" ? "REISSUE" : "CREATE" };
        upstreamPath = "/api/harvey/witness";
        responseKind = "witness";
      } else if (requestUrl.pathname === "/sally-witness/pairings") {
        if (requestUrl.search || Object.keys(input).length) throw Object.assign(new Error("SALLY_PAIRING_DETAILS_INPUT_FORBIDDEN"), { status: 400 });
        commandBody = { phase: "PAIRING_DETAILS" };
        upstreamPath = "/api/harvey/witness";
        responseKind = "pairings";
      } else if (requestUrl.pathname === "/sally-witness/approve") {
        if (requestUrl.search || Object.keys(input).length !== 3 || !/^sally_[a-f0-9]{32}$/.test(String(input.challenge_id ?? "")) || !/^sally_pair_[a-f0-9]{32}$/.test(String(input.request_id ?? "")) || !/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(String(input.pairing_code ?? ""))) {
          throw Object.assign(new Error("SALLY_PAIRING_APPROVAL_INPUT_INVALID"), { status: 400 });
        }
        commandBody = { phase: "APPROVE_PAIRING", challenge_id: String(input.challenge_id), request_id: String(input.request_id), pairing_code: String(input.pairing_code) };
        upstreamPath = "/api/harvey/witness";
        responseKind = "witness";
      } else if (requestUrl.pathname === "/fleet/knock") {
        if ("machines" in input || "machine" in input) throw Object.assign(new Error("FLEET_MACHINE_SET_CALLER_FORBIDDEN"), { status: 400 });
        const heartbeatResponse = await fetch(new URL("/api/harvey/machines", cockpitUrl), { cache: "no-store" });
        const heartbeatBody = await heartbeatResponse.json();
        const machines = Array.isArray(heartbeatBody.machines)
          ? heartbeatBody.machines.filter((machine) => machine.live === true).map((machine) => machine.machine)
          : [];
        if (!machines.length) throw Object.assign(new Error("NO_LIVE_MACHINES"), { status: 409 });
        commandBody = { machines, action: "KNOCK", payload: {} };
      } else {
        const machine = String(input.machine ?? "");
        const action = String(input.action ?? "");
        if (!['Doss', 'Betsy', 'Spanzee', 'Medullina', 'Sally'].includes(machine)) throw Object.assign(new Error("UNKNOWN_MACHINE"), { status: 400 });
        if (!["PING", "KNOCK", "OPEN_URL"].includes(action)) throw Object.assign(new Error("ACTION_NOT_ALLOWLISTED"), { status: 400 });
        const workstreamId = input.workstream_id === undefined ? undefined : String(input.workstream_id);
        if (workstreamId !== undefined && !/^[a-z0-9][a-z0-9-]{0,63}$/.test(workstreamId)) throw Object.assign(new Error("WORKSTREAM_ID_INVALID"), { status: 400 });
        commandBody = { machine, action, ...(workstreamId ? { workstream_id: workstreamId } : {}), payload: action === "OPEN_URL" ? { url: String(input.payload?.url ?? "") } : {} };
      }
      const forwarded = await forwardOperatorRequest({
        cockpitUrl,
        operatorToken,
        path: upstreamPath,
        body: commandBody,
        responseKind
      });
      writeJson(response, forwarded.status, forwarded.body, origin);
    } catch (error) {
      writeJson(response, Number(error?.status ?? 500), { ok: false, error: error instanceof Error ? error.message : "OPERATOR_BRIDGE_FAILED" }, origin);
    }
  });
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const port = Number(process.env.HARVEY_OPERATOR_BRIDGE_PORT ?? "3002");
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("HARVEY_OPERATOR_BRIDGE_PORT_INVALID");
  const server = createHarveyOperatorBridge();
  server.listen(port, "127.0.0.1", () => {
    process.stdout.write(`HARVEY_OPERATOR_BRIDGE_READY http://127.0.0.1:${port}\n`);
  });
}
