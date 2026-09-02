#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const PACKET_DIR = path.join(ROOT, "data", "organism", "contracts", "packets");
const DEFAULT_BASE_URL = process.env.WERKLES_LOCAL_BASE_URL || "http://127.0.0.1:3000";
const DEFAULT_OUT_DIR = path.join(ROOT, "foreman", "handoffs", "receiver-bundles");

function slash(value) {
  return value.split(path.sep).join("/");
}

function repoRel(value) {
  return slash(path.relative(ROOT, value));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function safeFileId(value) {
  return String(value || "packet")
    .trim()
    .replace(/[^A-Za-z0-9_.-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function usage() {
  return [
    "Usage:",
    "  node scripts/foreman/organism-receiver-handoff-bundle.mjs [--packet-id <packet_id>] [--receiver Receiver@Machine] [--base-url http://127.0.0.1:3000] [--out-dir foreman/handoffs/receiver-bundles]",
    "",
    "Behavior:",
    "  Creates a receiver handoff folder with packet.json, receipt-template.json, HANDOFF.md, and manifest.json.",
    "  The receipt template is intentionally blocked with TEMPLATE_NOT_FILLED until the receiver edits proof fields.",
  ].join("\n");
}

function parseArgs(argv) {
  const parsed = {
    packetId: "",
    receiver: "",
    baseUrl: DEFAULT_BASE_URL,
    outDir: DEFAULT_OUT_DIR,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    }

    if (arg === "--packet-id") {
      parsed.packetId = next || "";
      index += 1;
      continue;
    }

    if (arg === "--receiver") {
      parsed.receiver = next || "";
      index += 1;
      continue;
    }

    if (arg === "--base-url") {
      parsed.baseUrl = next || "";
      index += 1;
      continue;
    }

    if (arg === "--out-dir") {
      parsed.outDir = next ? (path.isAbsolute(next) ? next : path.join(ROOT, next)) : "";
      index += 1;
      continue;
    }

    throw new Error(`UNKNOWN_ARG:${arg}\n${usage()}`);
  }

  if (!parsed.baseUrl.trim()) throw new Error("BASE_URL_REQUIRED");
  if (!parsed.outDir) throw new Error("OUT_DIR_REQUIRED");
  return parsed;
}

async function readJsonFile(filePath) {
  const raw = await readFile(filePath, "utf8");
  return {
    raw,
    json: JSON.parse(raw),
    sha256: sha256(raw),
  };
}

async function loadPackets() {
  const names = await readdir(PACKET_DIR);
  const packets = [];

  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const fullPath = path.join(PACKET_DIR, name);
    const read = await readJsonFile(fullPath);
    if (!read.json?.packet_id) continue;
    packets.push({
      packet: read.json,
      fullPath,
      path: repoRel(fullPath),
      sha256: read.sha256,
    });
  }

  return packets;
}

async function selectPacket(packetId) {
  const packets = await loadPackets();
  if (packets.length === 0) throw new Error("NO_CONTRACT_PACKETS_FOUND");

  if (packetId) {
    const found = packets.find((entry) => entry.packet.packet_id === packetId || path.basename(entry.path, ".json") === packetId);
    if (!found) throw new Error(`PACKET_NOT_FOUND:${packetId}`);
    return found;
  }

  packets.sort((left, right) => Date.parse(right.packet.created_at) - Date.parse(left.packet.created_at));
  return packets[0];
}

function receiptTemplateFor({ packet, packetPath, packetHash, receiver }) {
  const receiptId = `receiver_receipt_template_${safeFileId(packet.packet_id)}_${Date.now().toString(36)}`;
  return {
    schema: "harvey_nerdkle_receipt_v0",
    receipt_id: receiptId,
    packet_id: packet.packet_id,
    created_at: new Date().toISOString(),
    receiver,
    status: "blocked",
    what_was_attempted: `TEMPLATE: replace this with what ${receiver} actually attempted for packet ${packet.packet_id}.`,
    what_changed: [
      "TEMPLATE_NOT_FILLED",
    ],
    what_did_not_change: [
      "No receiver completion proof has been claimed by this template.",
      "Do not post this unchanged unless the receiver is intentionally returning a blocked receipt.",
    ],
    proof: [
      {
        kind: "artifact_path",
        value: packetPath,
      },
      {
        kind: "hash",
        value: `${packetPath} sha256 ${packetHash}`,
      },
      {
        kind: "readback",
        value: "TEMPLATE_NOT_FILLED: replace with receiver readback before claiming partial or completed status.",
      },
    ],
    blocked_reason: "TEMPLATE_NOT_FILLED",
    next_safe_action: "Receiver edits this receipt with real proof, then posts it with organism-receiver-receipt-post.mjs.",
    source_hashes_used: {
      [packetPath]: packetHash,
    },
  };
}

function handoffMarkdown({ packet, receiver, baseUrl, bundlePaths, packetHash }) {
  const postCommand = `node scripts/foreman/organism-receiver-receipt-post.mjs --receipt ${bundlePaths.receiptTemplate} --base-url ${baseUrl} --detected-by ${receiver}`;

  return [
    `# Receiver Handoff Bundle: ${packet.packet_id}`,
    "",
    `Receiver: ${receiver}`,
    `Packet lane: ${packet.lane}`,
    `Packet from/to: ${packet.from} -> ${packet.to}`,
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Files",
    "",
    `- Packet copy: \`${bundlePaths.packet}\``,
    `- Receipt template: \`${bundlePaths.receiptTemplate}\``,
    `- Manifest: \`${bundlePaths.manifest}\``,
    "",
    "## Packet Readback",
    "",
    `- packet_id: \`${packet.packet_id}\``,
    `- requested_action: ${packet.requested_action}`,
    `- operator_intent: ${packet.operator_intent}`,
    `- acceptance_criteria: ${packet.acceptance_criteria.join("; ")}`,
    `- stop_conditions: ${packet.stop_conditions.join("; ")}`,
    `- packet_sha256: \`${packetHash}\``,
    "",
    "## Return Command",
    "",
    "Edit the receipt template with real receiver proof, then run:",
    "",
    "```powershell",
    postCommand,
    "```",
    "",
    "## Truth Boundary",
    "",
    "The included receipt template is intentionally `blocked` with `TEMPLATE_NOT_FILLED`. Change it only when the receiver has real proof. A posted template is not completion proof.",
    "",
  ].join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const selected = await selectPacket(args.packetId);
  const receiver = args.receiver.trim() || selected.packet.to || "Receiver@Unknown";
  const bundleDir = path.join(args.outDir, safeFileId(selected.packet.packet_id));
  const packetCopyPath = path.join(bundleDir, "packet.json");
  const receiptTemplatePath = path.join(bundleDir, "receipt-template.json");
  const handoffPath = path.join(bundleDir, "HANDOFF.md");
  const manifestPath = path.join(bundleDir, "manifest.json");

  await mkdir(bundleDir, { recursive: true });
  await writeFile(packetCopyPath, `${JSON.stringify(selected.packet, null, 2)}\n`, "utf8");

  const packetCopyRaw = await readFile(packetCopyPath, "utf8");
  const packetCopyHash = sha256(packetCopyRaw);
  const packetCopyRel = repoRel(packetCopyPath);
  const receiptTemplate = receiptTemplateFor({
    packet: selected.packet,
    packetPath: packetCopyRel,
    packetHash: packetCopyHash,
    receiver,
  });
  await writeFile(receiptTemplatePath, `${JSON.stringify(receiptTemplate, null, 2)}\n`, "utf8");

  const bundlePaths = {
    packet: packetCopyRel,
    receiptTemplate: repoRel(receiptTemplatePath),
    handoff: repoRel(handoffPath),
    manifest: repoRel(manifestPath),
  };
  await writeFile(
    handoffPath,
    handoffMarkdown({
      packet: selected.packet,
      receiver,
      baseUrl: args.baseUrl,
      bundlePaths,
      packetHash: packetCopyHash,
    }),
    "utf8",
  );

  const receiptTemplateRaw = await readFile(receiptTemplatePath, "utf8");
  const handoffRaw = await readFile(handoffPath, "utf8");
  const manifest = {
    schema: "harvey_nerdkle_receiver_handoff_bundle_v0",
    generated_at: new Date().toISOString(),
    packet_id: selected.packet.packet_id,
    receiver,
    base_url: args.baseUrl,
    endpoint: `${args.baseUrl.replace(/\/+$/g, "")}/api/organism/contracts/receiver-receipts`,
    source_packet_path: selected.path,
    source_packet_sha256: selected.sha256,
    bundle_paths: bundlePaths,
    files: [
      {
        path: bundlePaths.packet,
        sha256: packetCopyHash,
      },
      {
        path: bundlePaths.receiptTemplate,
        sha256: sha256(receiptTemplateRaw),
      },
      {
        path: bundlePaths.handoff,
        sha256: sha256(handoffRaw),
      },
    ],
    post_command: `node scripts/foreman/organism-receiver-receipt-post.mjs --receipt ${bundlePaths.receiptTemplate} --base-url ${args.baseUrl} --detected-by ${receiver}`,
    truth_boundary: "Receipt template is blocked until the receiver replaces TEMPLATE_NOT_FILLED with real proof.",
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const manifestExists = existsSync(manifestPath);
  console.log(
    JSON.stringify(
      {
        ok: true,
        packet_id: selected.packet.packet_id,
        receiver,
        bundle_dir: repoRel(bundleDir),
        handoff_path: bundlePaths.handoff,
        packet_path: bundlePaths.packet,
        receipt_template_path: bundlePaths.receiptTemplate,
        manifest_path: bundlePaths.manifest,
        manifest_written: manifestExists,
        post_command: manifest.post_command,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, status: "BLOCKER", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
