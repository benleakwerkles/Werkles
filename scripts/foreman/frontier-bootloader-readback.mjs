#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..", "..");
const writeMode = process.argv.includes("--write");

function repoPath(...parts) {
  return path.join(repoRoot, ...parts);
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex").toUpperCase();
}

const frontierPath = repoPath("foreman", "source-truth", "shared_frontier.json");
if (!existsSync(frontierPath)) {
  throw new Error(`Missing ${rel(frontierPath)}. Run memory:sleep-cycle first.`);
}

const frontier = JSON.parse(readFileSync(frontierPath, "utf8"));
const currentDay = frontier.current_day || {};
const nextBootloader = frontier.next_bootloader || {};
const blockers = Array.isArray(nextBootloader.blocking_next_day)
  ? nextBootloader.blocking_next_day
  : [];
const builtToday = Array.isArray(currentDay.built_today) ? currentDay.built_today : [];

const readback = {
  readback_id: "NERDKLE_BOOTLOADER_FRONTIER_READBACK",
  created_at: new Date().toISOString(),
  owner: "Swanson@Doss",
  machine: "Doss",
  status: "ARTIFACT",
  frontier_status: nextBootloader.status || currentDay.status || "UNKNOWN",
  frontier_path: rel(frontierPath),
  frontier_hash: sha256File(frontierPath),
  bootloader_rule: "Read shared_frontier.json before starting new Nerdkle work.",
  next_bootloader: {
    date: nextBootloader.date || currentDay.date || null,
    status: nextBootloader.status || currentDay.status || "UNKNOWN",
    read_this_first: nextBootloader.read_this_first || rel(frontierPath),
    completed_packet_count: nextBootloader.completed_packet_count ?? currentDay.completed_packet_count ?? 0,
    blocker_count: nextBootloader.blocker_count ?? currentDay.blocker_count ?? blockers.length,
    warning: nextBootloader.warning || null,
  },
  completed_packets: builtToday,
  blockers,
  next_actions: blockers.map((blocker) => ({
    owner: blocker.next_owner || blocker.owner || "UNKNOWN",
    action: blocker.next_action || "BLOCKER_WITHOUT_NEXT_ACTION",
    blocker_id: blocker.blocker_id || "UNKNOWN",
    missing_path: blocker.missing_path || null,
  })),
  false_start_guard: [
    "Do not start tomorrow from chat memory.",
    "Do not call daily memory complete while frontier_status is BLOCKER.",
    "Do not invent completed packets when completed_packet_count is 0.",
  ],
};

if (writeMode) {
  const readbackDir = repoPath("foreman", "source-truth", "readbacks");
  const receiptDir = repoPath("foreman", "source-truth", "receipts", "memory");
  mkdirSync(readbackDir, { recursive: true });
  mkdirSync(receiptDir, { recursive: true });

  const readbackPath = path.join(readbackDir, "NERDKLE_BOOTLOADER_FRONTIER_READBACK.json");
  writeFileSync(readbackPath, `${JSON.stringify(readback, null, 2)}\n`, "utf8");
  const receipt = {
    receipt_id: "NERDKLE_BOOTLOADER_FRONTIER_READBACK_RECEIPT",
    mission: "NERDKLE_BOOTLOADER_FRONTIER_READBACK",
    owner: "Swanson@Doss",
    created_at: new Date().toISOString(),
    status: "ARTIFACT",
    frontier_status: readback.frontier_status,
    readback_path: rel(readbackPath),
    readback_hash: sha256File(readbackPath),
    readback_byte_count: statSync(readbackPath).size,
    blocker_count: blockers.length,
    completed_packet_count: builtToday.length,
  };
  const receiptPath = path.join(receiptDir, "NERDKLE_BOOTLOADER_FRONTIER_READBACK_RECEIPT.json");
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  readback.receipt = {
    path: rel(receiptPath),
    hash: sha256File(receiptPath),
    byte_count: statSync(receiptPath).size,
  };
}

process.stdout.write(`${JSON.stringify(readback, null, 2)}\n`);
