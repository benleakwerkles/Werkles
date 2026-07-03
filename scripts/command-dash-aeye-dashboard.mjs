import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { extname, join, relative, resolve } from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEFAULT_PORT = 4328;
const HOST = "127.0.0.1";
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist"]);

const PATHS = {
  manifest: "foreman/artifacts/aeye_relay_manifest.json",
  packetInbox: "foreman/artifacts/packet_inbox.json",
  packetStatus: "foreman/artifacts/packet_status.json",
  packetLifecycle: "foreman/artifacts/packet_lifecycle.json",
  evidence: "foreman/artifacts/aeye_relay_evidence.json",
  routeMap: "tinkarden/relay/aeye_routes.json",
  dispatchLog: "data/organism/aeye_dispatch.jsonl",
  aeyeEvents: "data/organism/aeye_events.jsonl",
  answerPickup: "data/organism/aeye_answer_pickup.jsonl",
  originBus: "data/organism/origin_response_bus.jsonl",
  originResponses: "foreman/artifacts/origin_dash_responses.json",
  commandDashState: "tinkarden/command_dash/dashboard_state.json",
  thinkitAnswers: "foreman/artifacts/thinkit_answers.json",
  canary: "foreman/artifacts/aeye_loop_canary.json",
  receiptProvenance: "foreman/artifacts/receipt_provenance.json",
  externalProofStatus: "foreman/artifacts/external_aeye_proof_intake_status.json",
  externalProofTemplate: "foreman/artifacts/external_aeye_proof_template.json",
  thinkit: "foreman/artifacts/thinkit_questions.json",
  commandDashInbox: "tinkarden/command_dash/inbox",
  tinkardenCommands: "tinkarden/dispatch/commands",
  tinkerdenCommands: "tinkerden/dispatch/commands",
  canonicalPackets: "tinkerden/dispatch/packets",
  mirrorPackets: "tinkarden/dispatch/packets",
  aeyeRoot: "tinkarden/aeyes",
};

function rel(path) {
  return relative(ROOT, path).replace(/\\/g, "/");
}

function abs(path) {
  return resolve(ROOT, path);
}

function safeRepoPath(input) {
  const fullPath = resolve(ROOT, String(input || ""));
  if (fullPath !== ROOT && !fullPath.startsWith(`${ROOT}\\`) && !fullPath.startsWith(`${ROOT}/`)) {
    throw new Error("path escapes workspace root");
  }
  return fullPath;
}

async function readText(path, fallback = "") {
  return readFile(abs(path), "utf8").catch(() => fallback);
}

async function readJson(path, fallback) {
  const raw = await readText(path, "");
  if (!raw.trim()) return fallback;
  return JSON.parse(raw);
}

async function readJsonl(path) {
  const raw = await readText(path, "");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { parse_error: true, raw: line };
      }
    });
}

async function listFiles(path, extensions = [".json"]) {
  const root = abs(path);
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(rel(fullPath), extensions));
      continue;
    }
    if (extensions.includes(extname(entry.name).toLowerCase())) {
      files.push(rel(fullPath));
    }
  }

  return files.sort();
}

async function packetObjects(files) {
  const packets = [];
  for (const path of files) {
    const parsed = await readJson(path, null);
    if (parsed && typeof parsed === "object") {
      packets.push({ path, ...parsed });
    }
  }
  return packets;
}

function targetRows(manifest) {
  const targets = manifest?.targets && typeof manifest.targets === "object" ? manifest.targets : {};
  return Object.entries(targets).map(([address, packets]) => ({
    address,
    packet_count: Array.isArray(packets) ? packets.length : 0,
    packets: Array.isArray(packets) ? packets : [],
  }));
}

async function state() {
  const [
    manifest,
    packetInbox,
    packetStatus,
    packetLifecycle,
    evidence,
    routeMap,
    dispatchLog,
    aeyeEvents,
    answerPickup,
    originBus,
    originResponses,
    commandDashState,
    thinkitAnswers,
    canary,
    receiptProvenance,
    externalProofStatus,
    thinkit,
    commandDashSources,
    tinkardenCommandSources,
    tinkerdenCommandSources,
    canonicalPacketFiles,
    mirrorPacketFiles,
    aeyeInboxFiles,
  ] = await Promise.all([
    readJson(PATHS.manifest, {}),
    readJson(PATHS.packetInbox, []),
    readJson(PATHS.packetStatus, []),
    readJson(PATHS.packetLifecycle, []),
    readJson(PATHS.evidence, defaultEvidence()),
    readJson(PATHS.routeMap, {}),
    readJsonl(PATHS.dispatchLog),
    readJsonl(PATHS.aeyeEvents),
    readJsonl(PATHS.answerPickup),
    readJsonl(PATHS.originBus),
    readJson(PATHS.originResponses, { responses: [] }),
    readJson(PATHS.commandDashState, {}),
    readJson(PATHS.thinkitAnswers, []),
    readJson(PATHS.canary, {}),
    readJson(PATHS.receiptProvenance, {}),
    readJson(PATHS.externalProofStatus, {}),
    readJson(PATHS.thinkit, []),
    listFiles(PATHS.commandDashInbox, [".json", ".md"]),
    listFiles(PATHS.tinkardenCommands, [".json", ".md"]),
    listFiles(PATHS.tinkerdenCommands, [".json", ".md"]),
    listFiles(PATHS.canonicalPackets, [".json"]),
    listFiles(PATHS.mirrorPackets, [".json"]),
    listFiles(PATHS.aeyeRoot, [".json"]),
  ]);

  const packets = await packetObjects(canonicalPacketFiles);
  const mirrors = await packetObjects(mirrorPacketFiles);
  const aeyeInboxPackets = await packetObjects(aeyeInboxFiles);

  return {
    generated_at: new Date().toISOString(),
    paths: PATHS,
    manifest,
    route_map: routeMap,
    source_counts: {
      thinkit_questions: Array.isArray(thinkit) ? thinkit.length : 0,
      command_dash_files: commandDashSources.length,
      tinkarden_command_files: tinkardenCommandSources.length,
      tinkerden_command_files: tinkerdenCommandSources.length,
    },
    packet_inbox: Array.isArray(packetInbox) ? packetInbox : [],
    packet_status: Array.isArray(packetStatus) ? packetStatus : [],
    packet_lifecycle: Array.isArray(packetLifecycle) ? packetLifecycle : [],
    evidence,
    dispatch_log: dispatchLog,
    aeye_events: aeyeEvents,
    answer_pickup: answerPickup,
    origin_bus: originBus,
    origin_responses: originResponses,
    command_dash_state: commandDashState,
    thinkit_answers: Array.isArray(thinkitAnswers) ? thinkitAnswers : [],
    canary,
    receipt_provenance: receiptProvenance,
    external_proof_status: externalProofStatus,
    targets: targetRows(manifest),
    files: {
      command_dash_sources: commandDashSources,
      tinkarden_command_sources: tinkardenCommandSources,
      tinkerden_command_sources: tinkerdenCommandSources,
      canonical_packets: canonicalPacketFiles,
      mirror_packets: mirrorPacketFiles,
      aeye_inbox_packets: aeyeInboxFiles,
    },
    packets,
    mirrors,
    aeye_inbox_packets: aeyeInboxPackets,
  };
}

function readBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10000) {
        request.destroy(new Error("request body too large"));
      }
    });
    request.on("end", () => resolveBody(body));
    request.on("error", rejectBody);
  });
}

function runNodeScript(script, args = []) {
  return new Promise((resolveRun) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: ROOT,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => resolveRun({ script, code, stdout, stderr }));
  });
}

async function runRelay({ smoke = false } = {}) {
  const relayArgs = smoke ? ["--smoke"] : [];
  const runs = [];
  runs.push(await runNodeScript("scripts/command-dash-aeye-relay.mjs", relayArgs));
  runs.push(await runNodeScript("scripts/local-aeye-daemon.mjs"));
  runs.push(await runNodeScript("scripts/origin-response-return.mjs"));
  runs.push(await runNodeScript("scripts/receipt-provenance-scan.mjs"));
  runs.push(await runNodeScript("scripts/external-aeye-proof-intake.mjs", ["--status"]));
  runs.push(await runNodeScript("scripts/build-tinkerpit-packet-inbox.mjs"));
  runs.push(await runNodeScript("scripts/build-packet-status.mjs"));
  runs.push(await runNodeScript("scripts/build-packet-inbox-lifecycle.mjs"));
  runs.push(await runNodeScript("scripts/build-aeye-relay-evidence.mjs"));
  return runs;
}

async function runCanary() {
  const runs = [];
  runs.push(await runNodeScript("scripts/aeye-loop-canary.mjs"));
  runs.push(await runNodeScript("scripts/receipt-provenance-scan.mjs"));
  runs.push(await runNodeScript("scripts/external-aeye-proof-intake.mjs", ["--status"]));
  return runs;
}

function defaultEvidence() {
  return {
    artifact_id: "AEYE_RELAY_EVIDENCE_V0",
    overall_status: "FAIL_NO_COMPLETE_AEYE_LOOP_PROOF",
    success_definition: "External platform proof requires A-G evidence_scope=external_platform. Local daemon proof requires A-G evidence_scope=local_daemon or stronger.",
    criteria: [
      { id: "A", requirement: "A new chat exists in any Aeye anywhere.", status: "FAIL", evidence: [], missing: "No evidence artifact has been generated yet." },
      { id: "B", requirement: "A new query was submitted to an Aeye.", status: "FAIL", evidence: [], missing: "No evidence artifact has been generated yet." },
      { id: "C", requirement: "Activity originated from Nerdkle Organism prompting.", status: "FAIL", evidence: [], missing: "No evidence artifact has been generated yet." },
      { id: "D", requirement: "A packet left the local Command Dash / TinkerDen relay.", status: "FAIL", evidence: [], missing: "No evidence artifact has been generated yet." },
      { id: "E", requirement: "The packet was received by an Aeye.", status: "FAIL", evidence: [], missing: "No evidence artifact has been generated yet." },
      { id: "F", requirement: "The Aeye answered.", status: "FAIL", evidence: [], missing: "No evidence artifact has been generated yet." },
      { id: "G", requirement: "The answer was received back into the organism.", status: "FAIL", evidence: [], missing: "No evidence artifact has been generated yet." }
    ],
    origin_return: {
      status: "FAIL_ORIGIN_DASH_RETURN_NOT_PROVEN",
      note: "No origin return evidence artifact has been generated yet."
    },
    local_only_activity: {
      status: "UNKNOWN",
      note: "Local file movement is not external Aeye proof."
    }
  };
}

function sendJson(response, value, statusCode = 200) {
  const body = JSON.stringify(value, null, 2);
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(body);
}

function sendHtml(response, body) {
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(body);
}

function sendText(response, body, statusCode = 200) {
  response.writeHead(statusCode, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(body);
}

function page() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Aeye Relay Evidence Console</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f4;
      --ink: #17211c;
      --muted: #5c675f;
      --line: #cfd8d2;
      --panel: #ffffff;
      --accent: #0f766e;
      --accent-2: #8b3a3a;
      --accent-3: #315f91;
      --warn: #9b6418;
      --ok: #17693a;
      --fail: #9d2525;
      --shadow: 0 1px 3px rgba(23, 33, 28, 0.10);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: var(--bg);
      color: var(--ink);
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 22px;
      border-bottom: 1px solid var(--line);
      background: #ffffff;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    h1 {
      margin: 0;
      font-size: 21px;
      line-height: 1.2;
      font-weight: 750;
      letter-spacing: 0;
    }
    .subhead {
      margin-top: 4px;
      font-size: 13px;
      color: var(--muted);
    }
    .controls {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
    }
    button {
      border: 1px solid var(--line);
      background: #fff;
      color: var(--ink);
      border-radius: 6px;
      padding: 8px 11px;
      font: inherit;
      font-size: 13px;
      cursor: pointer;
      min-height: 36px;
    }
    button.primary {
      border-color: var(--accent);
      background: var(--accent);
      color: #fff;
    }
    button:disabled {
      cursor: wait;
      opacity: 0.65;
    }
    main {
      padding: 18px 22px 28px;
      max-width: 1440px;
      margin: 0 auto;
    }
    .status-line {
      display: grid;
      grid-template-columns: repeat(5, minmax(140px, 1fr));
      gap: 10px;
      margin-bottom: 16px;
    }
    .metric {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
      box-shadow: var(--shadow);
      min-height: 76px;
    }
    .metric strong {
      display: block;
      font-size: 25px;
      line-height: 1.1;
    }
    .metric span {
      color: var(--muted);
      font-size: 12px;
    }
    .grid {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(360px, 0.65fr);
      gap: 14px;
    }
    section {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
      overflow: hidden;
      margin-bottom: 14px;
    }
    section h2 {
      margin: 0;
      padding: 11px 13px;
      border-bottom: 1px solid var(--line);
      font-size: 14px;
      font-weight: 750;
      letter-spacing: 0;
      background: #fbfcfa;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th, td {
      border-bottom: 1px solid #e6ebe7;
      padding: 9px 10px;
      vertical-align: top;
      text-align: left;
      font-size: 12px;
      overflow-wrap: anywhere;
    }
    th {
      color: var(--muted);
      font-weight: 700;
      background: #fbfcfa;
    }
    tr:last-child td { border-bottom: 0; }
    .mono {
      font-family: "Cascadia Mono", Consolas, "Liberation Mono", monospace;
      font-size: 11px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 700;
      background: #fff;
      white-space: nowrap;
    }
    .pill.ok { border-color: #9fc9ae; color: var(--ok); background: #f1faf3; }
    .pill.fail { border-color: #e0a3a3; color: var(--fail); background: #fff1f1; }
    .pill.warn { border-color: #e5c58d; color: var(--warn); background: #fff8e8; }
    .pill.accent { border-color: #9bc9c5; color: var(--accent); background: #eef9f7; }
    .paths {
      display: grid;
      gap: 8px;
      padding: 12px 13px;
    }
    .path-row {
      display: grid;
      grid-template-columns: 140px minmax(0, 1fr);
      gap: 10px;
      font-size: 12px;
    }
    .path-row span:first-child {
      color: var(--muted);
      font-weight: 700;
    }
    pre {
      margin: 0;
      max-height: 360px;
      overflow: auto;
      padding: 12px;
      background: #101713;
      color: #dbe7df;
      font-size: 11px;
      line-height: 1.45;
    }
    .empty {
      padding: 18px 13px;
      color: var(--muted);
      font-size: 13px;
    }
    .log {
      min-height: 80px;
      border-top: 1px solid var(--line);
    }
    .row-action {
      padding: 5px 7px;
      min-height: 28px;
      font-size: 11px;
    }
    @media (max-width: 980px) {
      header { align-items: flex-start; flex-direction: column; }
      .controls { justify-content: flex-start; }
      .status-line { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grid { grid-template-columns: 1fr; }
      .path-row { grid-template-columns: 1fr; gap: 3px; }
    }
    @media (max-width: 560px) {
      main, header { padding-left: 12px; padding-right: 12px; }
      .status-line { grid-template-columns: 1fr; }
      th, td { padding: 8px 7px; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Command Dash -> Aeye Evidence</h1>
      <div class="subhead" id="lastUpdated">Waiting for local state</div>
    </div>
    <div class="controls">
      <span class="pill warn" id="healthPill">Checking</span>
      <button id="refreshBtn">Refresh</button>
      <button id="runBtn" class="primary">Run Relay</button>
      <button id="smokeBtn">Run Smoke</button>
      <button id="canaryBtn">Run Canary</button>
    </div>
  </header>
  <main>
    <div class="status-line" id="metrics"></div>
    <div class="grid">
      <div>
        <section>
          <h2>Packet Inbox</h2>
          <div id="packetTable"></div>
        </section>
        <section>
          <h2>Local Drop Folders</h2>
          <div id="targetTable"></div>
        </section>
        <section>
          <h2>A-G Success Criteria</h2>
          <div id="criteriaTable"></div>
        </section>
        <section>
          <h2>Origin Dash Returns</h2>
          <div id="originReturnTable"></div>
        </section>
        <section>
          <h2>Fresh Canary</h2>
          <div id="canaryTable"></div>
        </section>
        <section>
          <h2>Receipt Provenance</h2>
          <div id="receiptProvenanceTable"></div>
        </section>
        <section>
          <h2>External Proof Intake</h2>
          <div id="externalProofTable"></div>
        </section>
        <section>
          <h2>Dispatch Log</h2>
          <div id="dispatchTable"></div>
        </section>
      </div>
      <div>
        <section>
          <h2>Relay Paths</h2>
          <div class="paths" id="paths"></div>
        </section>
        <section>
          <h2>Packet Preview</h2>
          <pre id="preview">Select a packet.</pre>
        </section>
        <section>
          <h2>Run Output</h2>
          <pre id="runOutput" class="log">No run yet.</pre>
        </section>
      </div>
    </div>
  </main>
  <script>
    const $ = (id) => document.getElementById(id);
    const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));

    let currentState = null;

    function metric(label, value, tone = "") {
      return '<div class="metric"><strong class="' + tone + '">' + esc(value) + '</strong><span>' + esc(label) + '</span></div>';
    }

    function table(headers, rows) {
      if (!rows.length) return '<div class="empty">No rows.</div>';
      return '<table><thead><tr>' + headers.map((header) => '<th>' + esc(header.label) + '</th>').join("") + '</tr></thead><tbody>' +
        rows.map((row) => '<tr>' + headers.map((header) => '<td>' + header.render(row) + '</td>').join("") + '</tr>').join("") +
        '</tbody></table>';
    }

    function packetLookup(state) {
      const byId = new Map();
      for (const packet of state.packets || []) byId.set(packet.packet_id, packet);
      for (const packet of state.aeye_inbox_packets || []) if (!byId.has(packet.packet_id)) byId.set(packet.packet_id, packet);
      return byId;
    }

    function render(state) {
      currentState = state;
      const inboxCount = state.packet_inbox.length;
      const targetCount = state.targets.length;
      const dispatchCount = state.dispatch_log.length;
      const aeyeCopies = state.files.aeye_inbox_packets.length;
      const sourceTotal = Object.values(state.source_counts).reduce((sum, count) => sum + count, 0);
      const criteria = Array.isArray(state.evidence?.criteria) ? state.evidence.criteria : [];
      const passedCriteria = criteria.filter((criterion) => String(criterion.status || "").startsWith("PASS")).length;
      const externallyProven = state.evidence?.overall_status === "PASS_EXTERNAL_PLATFORM_AEYE_LOOP_PROVEN" || state.evidence?.overall_status === "PASS_EXTERNAL_PLATFORM_FULL_RETURN_LOOP_PROVEN";
      const externalFullReturn = state.evidence?.overall_status === "PASS_EXTERNAL_PLATFORM_FULL_RETURN_LOOP_PROVEN";
      const localDaemonProven = state.evidence?.overall_status === "PASS_LOCAL_DAEMON_AEYE_LOOP_PROVEN" || state.evidence?.overall_status === "PASS_LOCAL_DAEMON_FULL_RETURN_LOOP_PROVEN";
      const localFullReturn = state.evidence?.overall_status === "PASS_LOCAL_DAEMON_FULL_RETURN_LOOP_PROVEN";
      const originReturn = state.evidence?.origin_return || {};
      const canary = state.canary || {};
      const externalProof = state.external_proof_status || {};

      $("healthPill").textContent = externalFullReturn
        ? "External full return loop proven"
        : localFullReturn
          ? "Local full return loop proven"
          : externallyProven
            ? "External platform loop proven"
            : localDaemonProven
              ? "Local Aeye daemon loop proven"
              : "FAIL - no Aeye proof";
      $("healthPill").className = "pill " + (externallyProven ? "ok" : localDaemonProven ? "accent" : "fail");
      $("lastUpdated").textContent = "State read " + new Date(state.generated_at).toLocaleString();
      $("metrics").innerHTML = [
        metric("source files/questions", sourceTotal),
        metric("packet inbox entries", inboxCount),
        metric("local drop copies", aeyeCopies),
        metric("dispatch log rows", dispatchCount),
        metric("Aeye event rows", state.aeye_events.length),
        metric("origin returns", (originReturn.origin_response_packet_count || 0) + " / " + (originReturn.answer_pickup_packet_count || 0)),
        metric("fresh canary", canary.status || "UNKNOWN"),
        metric("receipt provenance", state.receipt_provenance?.status || "UNKNOWN"),
        metric("external proof rows", externalProof.external_event_rows || 0),
        metric("A-G criteria passed", passedCriteria + " / " + criteria.length),
      ].join("");

      const packetsById = packetLookup(state);
      $("packetTable").innerHTML = table([
        { label: "Packet", render: (row) => '<span class="mono">' + esc(row.packet_id) + '</span>' },
        { label: "Action", render: (row) => esc(row.action) },
        { label: "Status", render: (row) => '<span class="pill accent">' + esc(row.status) + '</span>' },
        { label: "Target", render: (row) => esc((packetsById.get(row.packet_id) || {}).target_address || "UNKNOWN") },
        { label: "Open", render: (row) => '<button class="row-action" data-packet="' + esc(row.packet_id) + '">View</button>' },
      ], state.packet_inbox);

      $("targetTable").innerHTML = table([
        { label: "Address", render: (row) => '<strong>' + esc(row.address) + '</strong>' },
        { label: "Packets", render: (row) => esc(row.packet_count) },
        { label: "Local path", render: (row) => '<span class="mono">' + esc((row.packets[0] || {}).aeye_inbox_path || "") + '</span>' },
      ], state.targets);

      $("criteriaTable").innerHTML = table([
        { label: "Gate", render: (row) => '<strong>' + esc(row.id) + '</strong>' },
        { label: "Requirement", render: (row) => esc(row.requirement) },
        { label: "Status", render: (row) => '<span class="pill ' + (String(row.status || "").startsWith("PASS") ? "ok" : "fail") + '">' + esc(row.status) + '</span>' },
        { label: "Evidence / Missing", render: (row) => row.evidence?.length ? '<span class="mono">' + esc(JSON.stringify(row.evidence[0])) + '</span>' : esc(row.missing || "") },
      ], criteria);

      const originRows = Array.isArray(state.origin_responses?.responses) ? state.origin_responses.responses : [];
      $("originReturnTable").innerHTML = table([
        { label: "Origin", render: (row) => '<strong>' + esc(row.origin_dash || row.source_surface) + '</strong>' },
        { label: "Source", render: (row) => '<span class="mono">' + esc(row.source_id) + '</span>' },
        { label: "Packet", render: (row) => '<span class="mono">' + esc(row.packet_id) + '</span>' },
        { label: "Status", render: (row) => '<span class="pill ok">' + esc(row.origin_status || "RETURNED") + '</span>' },
        { label: "Response Path", render: (row) => '<span class="mono">' + esc(row.response_path) + '</span>' },
      ], originRows);

      $("canaryTable").innerHTML = table([
        { label: "Status", render: (row) => '<span class="pill ' + (String(row.status || "").startsWith("PASS") ? "ok" : "fail") + '">' + esc(row.status || "UNKNOWN") + '</span>' },
        { label: "Canary", render: (row) => '<span class="mono">' + esc(row.canary_id || "") + '</span>' },
        { label: "Packet", render: (row) => '<span class="mono">' + esc(row.packet_id || "") + '</span>' },
        { label: "Response", render: (row) => '<span class="mono">' + esc(row.response_path || "") + '</span>' },
      ], Object.keys(canary).length ? [canary] : []);

      const receiptCandidates = Array.isArray(state.receipt_provenance?.top_candidates) ? state.receipt_provenance.top_candidates : [];
      $("receiptProvenanceTable").innerHTML = table([
        { label: "Candidate", render: (row) => '<strong>' + esc(row.identity) + '</strong>' },
        { label: "Evidence", render: (row) => esc(row.evidence_count) },
        { label: "Receipts", render: (row) => esc((row.receipt_ids || []).length) },
        { label: "Sample File", render: (row) => '<span class="mono">' + esc((row.files || [])[0] || "") + '</span>' },
      ], receiptCandidates);

      $("externalProofTable").innerHTML = table([
        { label: "Status", render: (row) => '<span class="pill ' + (row.external_event_rows ? "ok" : "warn") + '">' + esc(row.status || "UNKNOWN") + '</span>' },
        { label: "Rows", render: (row) => esc(row.external_event_rows || 0) },
        { label: "Template", render: (row) => '<span class="mono">' + esc(row.template || state.paths.externalProofTemplate) + '</span>' },
        { label: "Events", render: (row) => esc((row.accepted_event_types || []).length) },
      ], Object.keys(externalProof).length ? [externalProof] : []);

      $("dispatchTable").innerHTML = table([
        { label: "Packet", render: (row) => '<span class="mono">' + esc(row.packet_id) + '</span>' },
        { label: "Target", render: (row) => esc(row.target_address) },
        { label: "Time", render: (row) => esc(row.dispatch_time) },
      ], state.dispatch_log);

      $("paths").innerHTML = [
        ["Command Dash", state.paths.commandDashInbox],
        ["Canonical packets", state.paths.canonicalPackets],
        ["Tinkarden mirror", state.paths.mirrorPackets],
        ["Local drop folders", state.paths.aeyeRoot],
        ["A-G evidence", state.paths.evidence],
        ["Aeye events", state.paths.aeyeEvents],
        ["Answer pickup", state.paths.answerPickup],
        ["Origin bus", state.paths.originBus],
        ["Origin responses", state.paths.originResponses],
        ["Command Dash state", state.paths.commandDashState],
        ["ThinkIt answers", state.paths.thinkitAnswers],
        ["Fresh canary", state.paths.canary],
        ["Receipt provenance", state.paths.receiptProvenance],
        ["External proof status", state.paths.externalProofStatus],
        ["External proof template", state.paths.externalProofTemplate],
        ["Dispatch log", state.paths.dispatchLog],
        ["Manifest", state.paths.manifest],
      ].map(([label, value]) => '<div class="path-row"><span>' + esc(label) + '</span><span class="mono">' + esc(value) + '</span></div>').join("");

      document.querySelectorAll("[data-packet]").forEach((button) => {
        button.addEventListener("click", () => {
          const packet = packetsById.get(button.dataset.packet);
          $("preview").textContent = packet ? JSON.stringify(packet, null, 2) : "Packet not found.";
        });
      });
    }

    async function refresh() {
      const response = await fetch("/api/state");
      render(await response.json());
    }

    async function runRelay(smoke) {
      for (const button of [$("runBtn"), $("smokeBtn"), $("canaryBtn"), $("refreshBtn")]) button.disabled = true;
      $("runOutput").textContent = smoke ? "Running smoke relay..." : "Running relay...";
      try {
        const response = await fetch("/api/run-relay", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ smoke })
        });
        const result = await response.json();
        $("runOutput").textContent = result.runs.map((run) => [
          "$ node " + run.script,
          "exit " + run.code,
          run.stdout.trim(),
          run.stderr.trim()
        ].filter(Boolean).join("\\n")).join("\\n\\n");
        render(result.state);
      } catch (error) {
        $("runOutput").textContent = String(error?.stack || error);
      } finally {
        for (const button of [$("runBtn"), $("smokeBtn"), $("canaryBtn"), $("refreshBtn")]) button.disabled = false;
      }
    }

    async function runCanary() {
      for (const button of [$("runBtn"), $("smokeBtn"), $("canaryBtn"), $("refreshBtn")]) button.disabled = true;
      $("runOutput").textContent = "Running fresh canary...";
      try {
        const response = await fetch("/api/run-canary", { method: "POST" });
        const result = await response.json();
        $("runOutput").textContent = result.runs.map((run) => [
          "$ node " + run.script,
          "exit " + run.code,
          run.stdout.trim(),
          run.stderr.trim()
        ].filter(Boolean).join("\\n")).join("\\n\\n");
        render(result.state);
      } catch (error) {
        $("runOutput").textContent = String(error?.stack || error);
      } finally {
        for (const button of [$("runBtn"), $("smokeBtn"), $("canaryBtn"), $("refreshBtn")]) button.disabled = false;
      }
    }

    $("refreshBtn").addEventListener("click", refresh);
    $("runBtn").addEventListener("click", () => runRelay(false));
    $("smokeBtn").addEventListener("click", () => runRelay(true));
    $("canaryBtn").addEventListener("click", runCanary);
    refresh().catch((error) => {
      $("healthPill").textContent = "State error";
      $("healthPill").className = "pill warn";
      $("runOutput").textContent = String(error?.stack || error);
    });
  </script>
</body>
</html>`;
}

async function handle(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || `${HOST}:${DEFAULT_PORT}`}`);

  try {
    if (request.method === "GET" && url.pathname === "/") {
      sendHtml(response, page());
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/state") {
      sendJson(response, await state());
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/file") {
      const path = url.searchParams.get("path") || "";
      const fullPath = safeRepoPath(path);
      sendText(response, await readFile(fullPath, "utf8"));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/run-relay") {
      const body = await readBody(request);
      const parsed = body.trim() ? JSON.parse(body) : {};
      const runs = await runRelay({ smoke: Boolean(parsed.smoke) });
      sendJson(response, { runs, state: await state() });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/run-canary") {
      const runs = await runCanary();
      sendJson(response, { runs, state: await state() });
      return;
    }

    sendJson(response, { error: "not found" }, 404);
  } catch (error) {
    sendJson(response, { error: String(error?.stack || error) }, 500);
  }
}

function parsePort(argv) {
  const portArg = argv.find((arg) => arg.startsWith("--port="));
  if (!portArg) return DEFAULT_PORT;
  const parsed = Number(portArg.split("=")[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

function listen(port) {
  const server = createServer(handle);
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && port < DEFAULT_PORT + 20) {
      listen(port + 1);
      return;
    }
    throw error;
  });
  server.listen(port, HOST, () => {
    console.log(`Aeye relay console: http://${HOST}:${port}/`);
  });
}

listen(parsePort(process.argv.slice(2)));
