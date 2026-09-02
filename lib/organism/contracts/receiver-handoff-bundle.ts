import { createHash } from "node:crypto";
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { HARVEY_NERDKLE_RECEIPT_SCHEMA, type OrganismReceipt, validateOrganismReceipt } from "./receipt";
import { ORGANISM_CONTRACT_PACKET_DIR } from "./storage";
import { type OrganismPacket, validateOrganismPacket } from "./packet";

export const RECEIVER_HANDOFF_BUNDLE_ROOT = path.join(process.cwd(), "foreman", "handoffs", "receiver-bundles");

export type CreateReceiverHandoffBundleInput = {
  packet_id: string;
  receiver?: string;
  base_url?: string;
  bundle_id?: string;
};

export type ReceiverHandoffBundleResult = {
  ok: true;
  packet_id: string;
  receiver: string;
  bundle_id: string;
  bundle_dir: string;
  handoff_path: string;
  packet_path: string;
  receipt_template_path: string;
  manifest_path: string;
  manifest_written: true;
  post_command: string;
  receipt_template_status: "blocked";
  receipt_template_blocked_reason: "TEMPLATE_NOT_FILLED";
};

type PacketEntry = {
  packet: OrganismPacket;
  path: string;
  sha256: string;
};

const DEFAULT_BASE_URL = process.env.WERKLES_LOCAL_BASE_URL || "http://127.0.0.1:3000";

function slash(value: string) {
  return value.split(path.sep).join("/");
}

function repoRel(filePath: string) {
  return slash(path.relative(process.cwd(), filePath));
}

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function safeFileId(value: string, fallback = "bundle") {
  return value
    .trim()
    .replace(/[^A-Za-z0-9_.-]+/g, "_")
    .replace(/^_+|_+$/g, "") || `${fallback}_${Date.now().toString(36)}`;
}

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readPacketEntry(filePath: string): Promise<PacketEntry | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const validation = validateOrganismPacket(parsed);
    if (!validation.ok) return null;
    return {
      packet: validation.value,
      path: repoRel(filePath),
      sha256: sha256(raw),
    };
  } catch {
    return null;
  }
}

async function loadPacket(packetId: string): Promise<PacketEntry> {
  const entries = await readdir(ORGANISM_CONTRACT_PACKET_DIR, { withFileTypes: true });
  const matches = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => readPacketEntry(path.join(ORGANISM_CONTRACT_PACKET_DIR, entry.name))),
  );
  const packet = matches
    .filter((entry): entry is PacketEntry => Boolean(entry))
    .find((entry) => entry.packet.packet_id === packetId || path.basename(entry.path, ".json") === packetId);

  if (!packet) throw new Error(`PACKET_NOT_FOUND:${packetId}`);
  return packet;
}

function receiptTemplateFor(params: {
  packet: OrganismPacket;
  packetPath: string;
  packetHash: string;
  receiver: string;
}): OrganismReceipt {
  const receiptId = `receiver_receipt_template_${safeFileId(params.packet.packet_id, "packet")}_${Date.now().toString(36)}`;
  return {
    schema: HARVEY_NERDKLE_RECEIPT_SCHEMA,
    receipt_id: receiptId,
    packet_id: params.packet.packet_id,
    created_at: new Date().toISOString(),
    receiver: params.receiver,
    status: "blocked",
    what_was_attempted: `TEMPLATE: replace this with what ${params.receiver} actually attempted for packet ${params.packet.packet_id}.`,
    what_changed: ["TEMPLATE_NOT_FILLED"],
    what_did_not_change: [
      "No receiver completion proof has been claimed by this template.",
      "Do not post this unchanged unless the receiver is intentionally returning a blocked receipt.",
    ],
    proof: [
      {
        kind: "artifact_path",
        value: params.packetPath,
      },
      {
        kind: "hash",
        value: `${params.packetPath} sha256 ${params.packetHash}`,
      },
      {
        kind: "readback",
        value: "TEMPLATE_NOT_FILLED: replace with receiver readback before claiming partial or completed status.",
      },
    ],
    blocked_reason: "TEMPLATE_NOT_FILLED",
    next_safe_action: "Receiver edits this receipt with real proof, then posts it with organism-receiver-receipt-post.mjs.",
    source_hashes_used: {
      [params.packetPath]: params.packetHash,
    },
  };
}

function handoffMarkdown(params: {
  packet: OrganismPacket;
  receiver: string;
  baseUrl: string;
  bundlePaths: { packet: string; receiptTemplate: string; manifest: string };
  packetHash: string;
}) {
  const postCommand = `node scripts/foreman/organism-receiver-receipt-post.mjs --receipt ${params.bundlePaths.receiptTemplate} --base-url ${params.baseUrl} --detected-by ${params.receiver}`;

  return [
    `# Receiver Handoff Bundle: ${params.packet.packet_id}`,
    "",
    `Receiver: ${params.receiver}`,
    `Packet lane: ${params.packet.lane}`,
    `Packet from/to: ${params.packet.from} -> ${params.packet.to}`,
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Files",
    "",
    `- Packet copy: \`${params.bundlePaths.packet}\``,
    `- Receipt template: \`${params.bundlePaths.receiptTemplate}\``,
    `- Manifest: \`${params.bundlePaths.manifest}\``,
    "",
    "## Packet Readback",
    "",
    `- packet_id: \`${params.packet.packet_id}\``,
    `- requested_action: ${params.packet.requested_action}`,
    `- operator_intent: ${params.packet.operator_intent}`,
    `- acceptance_criteria: ${params.packet.acceptance_criteria.join("; ")}`,
    `- stop_conditions: ${params.packet.stop_conditions.join("; ")}`,
    `- packet_sha256: \`${params.packetHash}\``,
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

export async function createReceiverHandoffBundle(
  input: CreateReceiverHandoffBundleInput,
): Promise<ReceiverHandoffBundleResult> {
  const packetId = input.packet_id?.trim();
  if (!packetId) throw new Error("PACKET_ID_REQUIRED");

  const selected = await loadPacket(packetId);
  const receiver = input.receiver?.trim() || selected.packet.to || "Receiver@Unknown";
  const baseUrl = input.base_url?.trim() || DEFAULT_BASE_URL;
  const bundleId = safeFileId(input.bundle_id?.trim() || `${selected.packet.packet_id}_${Date.now().toString(36)}`, "bundle");
  const bundleDir = path.join(RECEIVER_HANDOFF_BUNDLE_ROOT, bundleId);
  const returnedReceiptPath = path.join(bundleDir, "returned-receipt.json");

  if (await exists(returnedReceiptPath)) {
    throw new Error(`BUNDLE_HAS_RETURNED_RECEIPT:${repoRel(returnedReceiptPath)}`);
  }

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
  const receiptValidation = validateOrganismReceipt(receiptTemplate);
  if (!receiptValidation.ok) {
    throw new Error(`RECEIPT_TEMPLATE_INVALID:${JSON.stringify(receiptValidation.issues)}`);
  }

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
      baseUrl,
      bundlePaths,
      packetHash: packetCopyHash,
    }),
    "utf8",
  );

  const receiptTemplateRaw = await readFile(receiptTemplatePath, "utf8");
  const handoffRaw = await readFile(handoffPath, "utf8");
  const postCommand = `node scripts/foreman/organism-receiver-receipt-post.mjs --receipt ${bundlePaths.receiptTemplate} --base-url ${baseUrl} --detected-by ${receiver}`;
  const manifest = {
    schema: "harvey_nerdkle_receiver_handoff_bundle_v0",
    generated_at: new Date().toISOString(),
    bundle_id: bundleId,
    packet_id: selected.packet.packet_id,
    receiver,
    lane: selected.packet.lane,
    base_url: baseUrl,
    endpoint: `${baseUrl.replace(/\/+$/g, "")}/api/organism/contracts/receiver-receipts`,
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
    post_command: postCommand,
    truth_boundary: "Receipt template is blocked until the receiver replaces TEMPLATE_NOT_FILLED with real proof.",
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  return {
    ok: true,
    packet_id: selected.packet.packet_id,
    receiver,
    bundle_id: bundleId,
    bundle_dir: repoRel(bundleDir),
    handoff_path: bundlePaths.handoff,
    packet_path: bundlePaths.packet,
    receipt_template_path: bundlePaths.receiptTemplate,
    manifest_path: bundlePaths.manifest,
    manifest_written: true,
    post_command: postCommand,
    receipt_template_status: "blocked",
    receipt_template_blocked_reason: "TEMPLATE_NOT_FILLED",
  };
}
