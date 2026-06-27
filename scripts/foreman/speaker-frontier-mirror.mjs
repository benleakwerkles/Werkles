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
const bootloaderPath = repoPath("foreman", "source-truth", "readbacks", "NERDKLE_BOOTLOADER_FRONTIER_READBACK.json");
if (!existsSync(frontierPath)) throw new Error(`Missing ${rel(frontierPath)}`);

const frontier = JSON.parse(readFileSync(frontierPath, "utf8"));
const bootloader = existsSync(bootloaderPath)
  ? JSON.parse(readFileSync(bootloaderPath, "utf8"))
  : {
      frontier_status: frontier.next_bootloader?.status || frontier.current_day?.status || "UNKNOWN",
      blockers: frontier.next_bootloader?.blocking_next_day || [],
      next_actions: (frontier.next_bootloader?.blocking_next_day || []).map((blocker) => ({
        owner: blocker.next_owner || blocker.owner || "UNKNOWN",
        action: blocker.next_action || "BLOCKER_WITHOUT_NEXT_ACTION",
        blocker_id: blocker.blocker_id || "UNKNOWN",
        missing_path: blocker.missing_path || null,
      })),
    };
const blockers = bootloader.blockers || [];
const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const entryId = `DRAFT_${ymd}-frontier-blocked-on-production-ledger`;
const speakerDir = repoPath("foreman", "speaker");
const entriesDir = repoPath("foreman", "speaker", "entries");
const receiptDir = repoPath("foreman", "speaker", "receipts");
const mirrorPath = repoPath("foreman", "speaker", "SPEAKER_FRONTIER_MIRROR.json");
const entryPath = path.join(entriesDir, `${entryId}.md`);

const mirror = {
  mirror_id: "SPEAKER_FRONTIER_MIRROR",
  created_at: new Date().toISOString(),
  organ: "Speaker",
  status: "ARTIFACT",
  frontier_status: bootloader.frontier_status,
  frontier_path: rel(frontierPath),
  frontier_hash: sha256File(frontierPath),
  bootloader_readback_path: rel(bootloaderPath),
  bootloader_readback_hash: existsSync(bootloaderPath) ? sha256File(bootloaderPath) : null,
  rationale: "Speaker mirrors the frontier warning so tomorrow's Aeye does not start from chat memory.",
  warnings: [
    "Daily memory is blocked until production circulation.db exists.",
    "Do not invent completed packets while completed_packet_count is 0.",
    "Do not treat a review branch as canonical source truth.",
  ],
  blockers,
  next_actions: bootloader.next_actions || [],
  speaker_boundaries: {
    may: ["mirror rationale", "warn on drift", "point to source-truth files"],
    may_not: ["create production database", "promote branches", "execute work", "delete receipts"],
  },
};

let entryStatus = "NOT_WRITTEN";
if (writeMode) {
  mkdirSync(speakerDir, { recursive: true });
  mkdirSync(entriesDir, { recursive: true });
  mkdirSync(receiptDir, { recursive: true });
  writeFileSync(mirrorPath, `${JSON.stringify(mirror, null, 2)}\n`, "utf8");

  if (!existsSync(entryPath)) {
    const firstBlocker = blockers[0] || {};
    const entry = `---
id: ${entryId}
status: DRAFT
title: Frontier Blocked On Production Ledger
created_at: ${new Date().toISOString().slice(0, 10)}
source_notes:
  - foreman/source-truth/shared_frontier.json
  - foreman/source-truth/readbacks/NERDKLE_BOOTLOADER_FRONTIER_READBACK.json
tags:
  - speaker
  - frontier
  - nerdkle
warning_triggers:
  - tomorrow starts without reading shared_frontier
  - completed work is claimed while ledger readback is blocked
  - production circulation.db is missing
---

## Event

The sleep cycle wrote a durable frontier, but the frontier status is \`${bootloader.frontier_status}\`.

## Current blocker

- blocker_id: ${firstBlocker.blocker_id || "UNKNOWN"}
- missing_path: ${firstBlocker.missing_path || "UNKNOWN"}
- next_action: ${firstBlocker.next_action || "UNKNOWN"}

## Lesson

Tomorrow's Bootloader must read \`foreman/source-truth/shared_frontier.json\` before accepting new Nerdkle momentum. If the production ledger is still missing, the correct state is blocker, not silence.
`;
    writeFileSync(entryPath, entry, "utf8");
    entryStatus = "CREATED";
  } else {
    entryStatus = "EXISTS_UNCHANGED";
  }

  const receipt = {
    receipt_id: "SPEAKER_FRONTIER_MIRROR_RECEIPT",
    mission: "SPEAKER_FRONTIER_MIRROR",
    owner: "Speaker",
    created_at: new Date().toISOString(),
    status: "ARTIFACT",
    mirror_path: rel(mirrorPath),
    mirror_hash: sha256File(mirrorPath),
    mirror_byte_count: statSync(mirrorPath).size,
    draft_entry_path: rel(entryPath),
    draft_entry_status: entryStatus,
    frontier_status: bootloader.frontier_status,
    blocker_count: blockers.length,
  };
  const receiptPath = path.join(receiptDir, "SPEAKER_FRONTIER_MIRROR_RECEIPT.json");
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  mirror.receipt = {
    path: rel(receiptPath),
    hash: sha256File(receiptPath),
    byte_count: statSync(receiptPath).size,
  };
  mirror.draft_entry = {
    path: rel(entryPath),
    status: entryStatus,
  };
}

process.stdout.write(`${JSON.stringify(mirror, null, 2)}\n`);
