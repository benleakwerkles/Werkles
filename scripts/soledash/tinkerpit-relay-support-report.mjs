#!/usr/bin/env node
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const EVENTS_PATH = path.join(ROOT, "data", "organism", "events.jsonl");
const PICKUP_PATH = path.join(ROOT, "data", "organism", "receipt_pickup.jsonl");
const MESSAGE_ROOT = path.join(ROOT, "foreman", "messages");
const OUTBOX_DIR = path.join(MESSAGE_ROOT, "outbox");
const INBOX_DIR = path.join(MESSAGE_ROOT, "inbox");
const RECEIPTS_DIR = path.join(MESSAGE_ROOT, "receipts");
const TINKERDEN_RECEIPTS_DIR = path.join(ROOT, "data", "tinkerden", "receipts");
const REPORT_PATH = path.join(ROOT, "foreman", "receipts", "trace_report.json");

function rel(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join("/");
}

function ensureDirs() {
  for (const dir of [path.dirname(EVENTS_PATH), OUTBOX_DIR, INBOX_DIR, RECEIPTS_DIR, TINKERDEN_RECEIPTS_DIR, path.dirname(REPORT_PATH)]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function safeStamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 17);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function readJsonl(filePath) {
  try {
    return fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function listJsonFiles(dir) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => {
        const fullPath = path.join(dir, entry.name);
        return { fullPath, stat: fs.statSync(fullPath) };
      })
      .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
  } catch {
    return [];
  }
}

function fileInfo(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return {
      exists: true,
      path: rel(filePath),
      size_bytes: stat.size,
      modified_at: stat.mtime.toISOString(),
      sha256: sha256(fs.readFileSync(filePath))
    };
  } catch {
    return { exists: false, path: rel(filePath) };
  }
}

function readReceiptStream() {
  const pickup = readJsonl(PICKUP_PATH).map((record) => ({
    receipt_id: record.receipt_id || "UNKNOWN",
    mission: record.mission || "UNKNOWN",
    producer: record.producer || "UNKNOWN",
    status_guess: record.status_guess || "UNKNOWN",
    timestamp: record.timestamp || "UNKNOWN",
    path: record.path || "UNKNOWN",
    linked_packet_id: record.linked_packet_id || "UNKNOWN",
    source: "data/organism/receipt_pickup.jsonl"
  }));

  const aeyeReceipts = listJsonFiles(RECEIPTS_DIR).map(({ fullPath }) => {
    const record = readJson(fullPath) || {};
    const fromAeye = record.from_aeye || "UNKNOWN";
    const fromMachine = record.from_machine || "UNKNOWN";
    return {
      receipt_id: record.receipt_id || path.basename(fullPath, ".json"),
      mission: record.message || "UNKNOWN",
      producer: `${fromAeye}@${fromMachine}`,
      status_guess: record.status || "UNKNOWN",
      timestamp: record.created_at || "UNKNOWN",
      path: rel(fullPath),
      linked_packet_id: record.packet_id || "UNKNOWN",
      source: "foreman/messages/receipts"
    };
  });
  const tinkerdenReceipts = listJsonFiles(TINKERDEN_RECEIPTS_DIR).map(({ fullPath }) => {
    const record = readJson(fullPath) || {};
    return {
      receipt_id: record.receipt_id || path.basename(fullPath, ".json"),
      mission: record.mission || "UNKNOWN",
      producer: record.producer || "UNKNOWN",
      status_guess: record.status_guess || "UNKNOWN",
      timestamp: record.timestamp || "UNKNOWN",
      path: record.proof_reference || rel(fullPath),
      linked_packet_id: record.linked_packet_id || "UNKNOWN",
      source: "data/tinkerden/receipts"
    };
  });

  const byKey = new Map();
  for (const receipt of [...pickup, ...aeyeReceipts, ...tinkerdenReceipts]) {
    byKey.set(`${receipt.receipt_id}:${receipt.path}`, receipt);
  }

  const receipts = [...byKey.values()].sort((a, b) => {
    const aTime = Date.parse(a.timestamp);
    const bTime = Date.parse(b.timestamp);
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });

  return {
    ok: true,
    source_paths: ["data/organism/receipt_pickup.jsonl", "foreman/messages/receipts", "data/tinkerden/receipts"],
    count: receipts.length,
    latest: receipts[0] || null
  };
}

function tracePacket(packetId, receiptIds = []) {
  const outboxPath = path.join(OUTBOX_DIR, `${packetId}.json`);
  const inboxPath = path.join(INBOX_DIR, `${packetId}.json`);
  const outboxPacket = readJson(outboxPath);
  const inboxPacket = readJson(inboxPath);
  const receipts = listJsonFiles(RECEIPTS_DIR)
    .map(({ fullPath }) => ({ fullPath, receipt: readJson(fullPath) }))
    .filter(({ receipt }) => receipt?.packet_id === packetId)
    .map(({ fullPath, receipt }) => ({
      ...fileInfo(fullPath),
      receipt_id: receipt.receipt_id,
      status: receipt.status,
      message: receipt.message,
      created_at: receipt.created_at
    }));
  const events = readJsonl(EVENTS_PATH).filter((event) => {
    const sourcePath = String(event.source_path || "");
    return sourcePath.includes(packetId) || receiptIds.some((receiptId) => sourcePath.includes(receiptId));
  });

  return {
    packet_id: packetId,
    outbox: {
      ...fileInfo(outboxPath),
      status: outboxPacket?.status || "MISSING",
      target: [outboxPacket?.target_aeye, outboxPacket?.target_machine].filter(Boolean).join("@") || "UNKNOWN"
    },
    inbox: {
      ...fileInfo(inboxPath),
      status: inboxPacket?.status || "MISSING",
      target: [inboxPacket?.target_aeye, inboxPacket?.target_machine].filter(Boolean).join("@") || "UNKNOWN"
    },
    receipts,
    events,
    verdict: outboxPacket?.status === "SENT" && inboxPacket?.status === "ACKNOWLEDGED" && receipts.length > 0
      ? "PASS"
      : "FAIL"
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(predicate, timeoutMs, label) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const result = predicate();
    if (result) return result;
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function startWatcher() {
  const child = spawn(process.execPath, ["scripts/foreman/chokidar-neurocirculymphatic-v0.mjs"], {
    cwd: ROOT,
    env: {
      ...process.env,
      CHOKIDAR_NEURO_STABILITY_MS: "100",
      CHOKIDAR_NEURO_DEDUPE_MS: "50"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  const stdoutEvents = [];
  const stderrLines = [];

  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    for (const line of chunk.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)) {
      try {
        stdoutEvents.push(JSON.parse(line));
      } catch {
        stdoutEvents.push({ raw: line });
      }
    }
  });

  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderrLines.push(...chunk.split(/\r?\n/).map((value) => value.trim()).filter(Boolean));
  });

  return { child, stdoutEvents, stderrLines };
}

async function probeReceiptHttpApi() {
  const ports = [3000, 3001, 3010, 3023];
  const results = [];

  for (const port of ports) {
    const url = `http://127.0.0.1:${port}/api/tinkerden/receipts`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      const body = await response.json();
      results.push({
        port,
        url,
        ok: response.ok && body?.ok === true,
        status: response.status,
        count: typeof body?.count === "number" ? body.count : Array.isArray(body?.receipts) ? body.receipts.length : 0,
        latest_receipt_id: body?.receipts?.[0]?.receipt_id || "NONE"
      });
    } catch (error) {
      results.push({
        port,
        url,
        ok: false,
        status: "UNAVAILABLE",
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    ok: results.some((result) => result.ok),
    results
  };
}

function createPacketFiles() {
  const stamp = safeStamp();
  const packetId = `packet_tinkerpit_trace_${stamp}`;
  const receiptId = `receipt_tinkerpit_trace_${stamp}`;
  const createdAt = new Date().toISOString();
  const payload = {
    sender: "Dink@Betsy",
    directory_source: "foreman/messages/DESTINATION_DIRECTORY.json",
    destination_id: "dink_betsy_aeye_inbox_v0",
    target: "Dink@Betsy",
    destination_type: "aeye_inbox_v0",
    mission: "TINKERPIT_RELAY_SUPPORT_V0",
    artifact: "trace_report.json",
    task_text: "Verify receipt stream, packet trace, Chokidar dispatch event, and JSONL landing."
  };
  const outboxPacket = {
    packet_id: packetId,
    origin_surface: "Tinkerpit Relay Support V0",
    origin_card_id: `origin_card_${stamp}`,
    target_aeye: "Dink",
    target_machine: "Betsy",
    payload,
    status: "SENT",
    created_at: createdAt
  };
  const inboxPacket = {
    ...outboxPacket,
    status: "ACKNOWLEDGED"
  };
  const receipt = {
    receipt_id: receiptId,
    packet_id: packetId,
    from_aeye: "Dink",
    from_machine: "Betsy",
    status: "ACKNOWLEDGED",
    message: "TINKERPIT_RELAY_SUPPORT_V0 end-to-end trace acknowledged.",
    created_at: new Date().toISOString()
  };

  writeJson(path.join(OUTBOX_DIR, `${packetId}.json`), outboxPacket);
  return { packetId, receiptId, outboxPacket, inboxPacket, receipt };
}

async function main() {
  ensureDirs();

  const report = {
    mission: "TINKERPIT_RELAY_SUPPORT_V0",
    generated_at: new Date().toISOString(),
    status: "FAIL",
    files: {
      trace_report: rel(REPORT_PATH),
      watcher: "scripts/foreman/chokidar-neurocirculymphatic-v0.mjs",
      trace_script: "scripts/soledash/tinkerden-packet-trace.mjs",
      report_script: "scripts/soledash/tinkerpit-relay-support-report.mjs",
      receipt_api: "app/api/tinkerden/receipts/route.ts",
      receipt_stream_api: "app/api/tinkerden/receipt-stream/route.ts"
    },
    receipt_stream_api: null,
    receipt_stream_http_api: null,
    dispatch_verification: null,
    trace: null,
    tests: [],
    blockers: []
  };

  const watcher = startWatcher();

  try {
    await waitFor(
      () => watcher.stdoutEvents.find((event) => event.status === "watching"),
      8000,
      "Chokidar watcher ready"
    );

    const dispatch = createPacketFiles();
    const outboxPath = rel(path.join(OUTBOX_DIR, `${dispatch.packetId}.json`));

    const dispatchEvent = await waitFor(() => {
      const stdoutMatch = watcher.stdoutEvents.find(
        (event) => event.event_type === "packet_dispatched" && event.source_path === outboxPath
      );
      if (stdoutMatch) return stdoutMatch;
      return readJsonl(EVENTS_PATH).find(
        (event) => event.event_type === "packet_dispatched" && event.source_path === outboxPath
      );
    }, 8000, "packet_dispatched event");

    writeJson(path.join(INBOX_DIR, `${dispatch.packetId}.json`), dispatch.inboxPacket);
    writeJson(path.join(RECEIPTS_DIR, `${dispatch.receiptId}.json`), dispatch.receipt);

    await waitFor(
      () => readJsonl(EVENTS_PATH).find((event) => event.event_type === "packet_delivered" && event.source_path?.includes(dispatch.packetId)),
      8000,
      "packet_delivered event"
    );
    await waitFor(
      () => readJsonl(EVENTS_PATH).find((event) => event.event_type === "packet_receipted" && event.source_path?.includes(dispatch.receiptId)),
      8000,
      "packet_receipted event"
    );

    report.receipt_stream_api = readReceiptStream();
    report.receipt_stream_http_api = await probeReceiptHttpApi();
    report.trace = tracePacket(dispatch.packetId, [dispatch.receiptId]);
    report.dispatch_verification = {
      ok: true,
      packet_id: dispatch.packetId,
      event_type: "packet_dispatched",
      jsonl_path: rel(EVENTS_PATH),
      observed_event: dispatchEvent,
      event_count_for_packet: report.trace.events.length
    };
    report.tests = [
      { name: "receipt stream API reader", status: report.receipt_stream_api.count > 0 ? "PASS" : "FAIL" },
      { name: "receipt stream HTTP API", status: report.receipt_stream_http_api.ok ? "PASS" : "FAIL" },
      { name: "packet trace chain", status: report.trace.verdict },
      { name: "Chokidar sees dispatched packet", status: report.dispatch_verification.ok ? "PASS" : "FAIL" },
      {
        name: "packet_dispatched event lands in JSONL",
        status: report.trace.events.some((event) => event.event_type === "packet_dispatched") ? "PASS" : "FAIL"
      },
      {
        name: "packet_receipted event lands in JSONL",
        status: report.trace.events.some((event) => event.event_type === "packet_receipted") ? "PASS" : "FAIL"
      }
    ];
    report.status = report.tests.every((test) => test.status === "PASS") ? "PASS" : "FAIL";
  } catch (error) {
    report.blockers.push(error instanceof Error ? error.message : String(error));
    if (watcher.stderrLines.length > 0) report.blockers.push(...watcher.stderrLines);
  } finally {
    watcher.child.kill();
  }

  writeJson(REPORT_PATH, report);
  console.log(JSON.stringify(report, null, 2));

  if (report.status !== "PASS") process.exitCode = 1;
}

await main();
