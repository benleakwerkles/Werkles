#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const SPEAKER_ROOT = path.resolve(__dirname, "..");
const STAGED_DIR = path.join(SPEAKER_ROOT, "receipts", "staged");
const RAW_INBOX_DIR = path.join(SPEAKER_ROOT, "receipts", "raw", "inbox");
const LOG_PATH = path.join(SPEAKER_ROOT, "logs", "clip_harvest.jsonl");
const DEFAULT_INTERVAL_MS = 1000;

const PATTERN_MATCHING_ARRAY = Object.freeze([
  {
    name: "packet_blocks",
    regex: /(?:^|\r?\n)(PACKET_ID:[\s\S]*?)(?=\r?\n\s*(?:\*{3,}|-{3,})\s*(?:\r?\n|$)|$)/g,
    verifies: "Globally isolates each packet from PACKET_ID through the line before a *** or --- separator."
  },
  {
    name: "packet_id_header",
    regex: /^PACKET_ID:\s*([^\r\n]+)/mi,
    verifies: "Captures the packet identifier from the isolated packet header."
  },
  {
    name: "to_header",
    regex: /^TO:\s*([^\s@\r\n]+)@([^\s\r\n]+)/mi,
    verifies: "Captures the target node and machine from TO: [NODE]@[MACHINE]."
  },
  {
    name: "target_path_header",
    regex: /^TARGET_PATH:\s*([^\r\n]+)/mi,
    verifies: "Captures the declared target path without consuming payload body lines."
  },
  {
    name: "payload_fences",
    regex: /```[^\r\n]*(?:\r?\n)([\s\S]*?)```/g,
    verifies: "Captures every fenced payload body while discarding markdown fence wrappers."
  },
  {
    name: "transmission_classifier",
    regex: /\b(?:TRANSMISSION|RAW_EXECUTION|EXECUTION_INBOX|RECEIPTS_RAW_INBOX)\b|receipts[\\/]+raw[\\/]+inbox/i,
    verifies: "Routes transmission payloads to the raw execution inbox instead of staged receipts."
  }
]);

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      parsed._.push(arg);
      continue;
    }
    const eq = arg.indexOf("=");
    if (eq !== -1) {
      parsed[arg.slice(2, eq)] = arg.slice(eq + 1);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      parsed[key] = next;
      i += 1;
    } else {
      parsed[key] = true;
    }
  }
  return parsed;
}

function stamp() {
  return new Date().toISOString();
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sanitize(value, fallback = "packet") {
  const sanitized = String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_.-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
  return sanitized || fallback;
}

function ensureDirs() {
  fs.mkdirSync(STAGED_DIR, { recursive: true });
  fs.mkdirSync(RAW_INBOX_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
}

function appendLog(entry) {
  ensureDirs();
  fs.appendFileSync(LOG_PATH, `${JSON.stringify({ timestamp: stamp(), ...entry })}\n`, "utf8");
}

function readClipboard() {
  const child = spawnSync("powershell.exe", ["-NoProfile", "-Command", "Get-Clipboard -Raw"], {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024
  });
  if (child.error) throw child.error;
  if (child.status !== 0) {
    throw new Error(`CLIPBOARD_READ_FAILED: ${(child.stderr || "").trim() || child.status}`);
  }
  return child.stdout || "";
}

function clearClipboard() {
  spawnSync("powershell.exe", ["-NoProfile", "-Command", "Set-Clipboard -Value ''"], {
    encoding: "utf8",
    windowsHide: true
  });
}

function readInput(args) {
  if (args.source) return fs.readFileSync(path.resolve(args.source), "utf8");
  if (args.stdin) return fs.readFileSync(0, "utf8");
  return readClipboard();
}

function matchOne(regex, text) {
  const match = text.match(regex);
  return match ? match.slice(1).map((part) => part.trim()) : [];
}

function isolatePacketBlocks(rawText) {
  const blocks = [];
  const regex = PATTERN_MATCHING_ARRAY.find((pattern) => pattern.name === "packet_blocks").regex;
  regex.lastIndex = 0;
  let match;
  while ((match = regex.exec(rawText)) !== null) {
    const block = match[1].trim();
    if (block) blocks.push(block);
  }
  return blocks;
}

function extractPayloads(packetText) {
  const payloads = [];
  const regex = PATTERN_MATCHING_ARRAY.find((pattern) => pattern.name === "payload_fences").regex;
  regex.lastIndex = 0;
  let match;
  while ((match = regex.exec(packetText)) !== null) {
    payloads.push(match[1]);
  }
  return payloads.length > 0 ? payloads : [packetText];
}

function parsePacket(packetText) {
  const [packetId] = matchOne(PATTERN_MATCHING_ARRAY.find((pattern) => pattern.name === "packet_id_header").regex, packetText);
  const [node, machine] = matchOne(PATTERN_MATCHING_ARRAY.find((pattern) => pattern.name === "to_header").regex, packetText);
  const [targetPath] = matchOne(PATTERN_MATCHING_ARRAY.find((pattern) => pattern.name === "target_path_header").regex, packetText);
  const classifier = PATTERN_MATCHING_ARRAY.find((pattern) => pattern.name === "transmission_classifier").regex;
  const payloads = extractPayloads(packetText);
  return {
    packet_id: sanitize(packetId, `packet_${sha256(packetText).slice(0, 12)}`),
    raw_packet_id: packetId || null,
    to_node: node || null,
    to_machine: machine || null,
    target_path: targetPath || null,
    route: classifier.test(`${packetText}\n${targetPath || ""}`) ? "raw_inbox" : "staged",
    payload: payloads.join("\n"),
    payload_count: payloads.length,
    source_sha256: sha256(packetText)
  };
}

function extensionFromTarget(targetPath, route) {
  const ext = path.extname(String(targetPath || ""));
  if (ext && /^[.][A-Za-z0-9]+$/.test(ext)) return ext;
  return route === "raw_inbox" ? ".txt" : ".md";
}

function uniquePath(dir, filename) {
  const parsed = path.parse(filename);
  let candidate = path.join(dir, filename);
  let counter = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(dir, `${parsed.name}.${counter}${parsed.ext}`);
    counter += 1;
  }
  return candidate;
}

function writePacket(packet) {
  const destinationDir = packet.route === "raw_inbox" ? RAW_INBOX_DIR : STAGED_DIR;
  const targetBase = sanitize(path.basename(String(packet.target_path || ""), path.extname(String(packet.target_path || ""))), "payload");
  const ext = extensionFromTarget(packet.target_path, packet.route);
  const destinationPath = uniquePath(destinationDir, `${packet.packet_id}__${targetBase}${ext}`);
  fs.writeFileSync(destinationPath, packet.payload, "utf8");
  return destinationPath;
}

function harvestText(rawText) {
  ensureDirs();
  if (!String(rawText || "").includes("PACKET_ID:")) {
    return { ok: true, status: "NO_PACKETS_FOUND", packets: [], written_files: [] };
  }

  const packets = isolatePacketBlocks(rawText).map(parsePacket);
  const writtenFiles = [];
  for (const packet of packets) {
    const destinationPath = writePacket(packet);
    writtenFiles.push(destinationPath);
    appendLog({
      event: "clip_packet_harvested",
      status: "PASS",
      packet_id: packet.raw_packet_id || packet.packet_id,
      to: packet.to_node && packet.to_machine ? `${packet.to_node}@${packet.to_machine}` : null,
      target_path: packet.target_path,
      route: packet.route,
      written_file: destinationPath,
      payload_count: packet.payload_count,
      source_sha256: packet.source_sha256,
      output_sha256: sha256(packet.payload)
    });
  }

  return {
    ok: true,
    status: packets.length > 0 ? "CLIP_PACKETS_HARVESTED" : "NO_PACKETS_FOUND",
    packets: packets.map((packet, index) => ({
      packet_id: packet.raw_packet_id || packet.packet_id,
      to: packet.to_node && packet.to_machine ? `${packet.to_node}@${packet.to_machine}` : null,
      target_path: packet.target_path,
      route: packet.route,
      payload_count: packet.payload_count,
      written_file: writtenFiles[index]
    })),
    written_files: writtenFiles
  };
}

function printResult(result) {
  console.log(JSON.stringify(result));
}

function runOnce(args) {
  const result = harvestText(readInput(args));
  printResult(result);
  if (result.written_files.length > 0 && process.env.CLIP_HARVEST_CLEAR_CLIPBOARD === "1" && !args.source && !args.stdin) {
    clearClipboard();
  }
  return result;
}

function runDaemon(args) {
  const intervalMs = Number(args.intervalMs || args["interval-ms"] || DEFAULT_INTERVAL_MS);
  const seen = new Set();
  setInterval(() => {
    try {
      const raw = readClipboard();
      const digest = sha256(raw);
      if (seen.has(digest)) return;
      seen.add(digest);
      const result = harvestText(raw);
      if (result.written_files.length > 0) {
        printResult(result);
        if (process.env.CLIP_HARVEST_CLEAR_CLIPBOARD === "1") clearClipboard();
      }
    } catch (error) {
      appendLog({
        event: "clip_harvest_error",
        status: "FAIL",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : DEFAULT_INTERVAL_MS);
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  if (args.once || args.source || args.stdin) {
    runOnce(args);
  } else {
    runDaemon(args);
  }
}

module.exports = {
  PATTERN_MATCHING_ARRAY,
  harvestText,
  isolatePacketBlocks,
  parsePacket,
  runOnce
};
