#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import {
  appendEvent,
  destinationGuessFor,
  eventTypeFor,
  extractIds,
} from "./chokidar-neurocirculymphatic-v0.mjs";

const ROOT = process.cwd();
const RECEIPT_PATH = path.join(ROOT, "foreman", "receipts", "BOOK_ARCHITECTURE_EVENT_SPINE_NORMALIZATION_V0_RECEIPT_20260706.json");
const SMOKE_ROOT = path.join(ROOT, "foreman", "tmp", "event-spine-normalization-smoke");
const EVENTS_PATH = path.join(ROOT, "data", "organism", "events.jsonl");
const WATCHER_PATH = "scripts/foreman/chokidar-neurocirculymphatic-v0.mjs";

function slash(value) {
  return value.split(path.sep).join("/");
}

function repoRel(value) {
  return slash(path.relative(ROOT, value));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assertPass(condition, message) {
  if (!condition) throw new Error(message);
}

function assertInside(child, parent, label) {
  const childFull = path.resolve(child);
  const parentFull = path.resolve(parent);
  assertPass(childFull.startsWith(parentFull + path.sep) || childFull === parentFull, `${label} escaped root: ${childFull}`);
}

async function fileHash(relativePath) {
  return sha256(await readFile(path.join(ROOT, relativePath)));
}

async function readEventLines() {
  if (!existsSync(EVENTS_PATH)) return [];
  const raw = await readFile(EVENTS_PATH, "utf8");
  return raw
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
}

async function main() {
  assertInside(SMOKE_ROOT, path.join(ROOT, "foreman", "tmp"), "Smoke root");
  await rm(SMOKE_ROOT, { recursive: true, force: true });
  await mkdir(SMOKE_ROOT, { recursive: true });

  const beforeEvents = await readEventLines();
  const beforeCount = beforeEvents.length;
  const now = new Date().toISOString();
  const packetId = `BOOK_ARCHITECTURE_EVENT_SPINE_NORMALIZATION_V0_${Date.now().toString(36)}`;
  const receiptId = `BOOK_ARCHITECTURE_EVENT_SPINE_NORMALIZATION_V0_RECEIPT_${Date.now().toString(36)}`;
  const packetPath = path.join(ROOT, "tinkerden", "dispatch", "packets", `${packetId}.json`);
  const receiptPath = path.join(ROOT, "data", "tinkerden", "receipts", `${receiptId}.json`);

  const packet = {
    schema: "harvey_nerdkle_packet_v0",
    packet_id: packetId,
    created_at: now,
    from: "EventSpineSmoke@Betsy",
    to: "EventSpineSmokeReceiver@Betsy",
    lane: "Harvey/Nerdkle architecture",
    operator_intent: "Prove watcher event normalization extracts packet ids.",
  };
  const receipt = {
    schema: "harvey_nerdkle_receipt_v0",
    receipt_id: receiptId,
    packet_id: packetId,
    created_at: now,
    receiver: "EventSpineSmokeReceiver@Betsy",
    status: "completed",
    what_was_attempted: "Prove watcher event normalization extracts packet and receipt ids.",
  };

  await mkdir(path.dirname(packetPath), { recursive: true });
  await mkdir(path.dirname(receiptPath), { recursive: true });
  await writeFile(packetPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");

  const packetStat = await stat(packetPath);
  const receiptStat = await stat(receiptPath);
  const packetIds = extractIds(packetPath, await readFile(packetPath));
  const receiptIds = extractIds(receiptPath, await readFile(receiptPath));
  const packetDestination = destinationGuessFor(packetPath);
  const receiptDestination = destinationGuessFor(receiptPath);
  const packetEventType = eventTypeFor("add", packetDestination, packetIds);
  const receiptEventType = eventTypeFor("add", receiptDestination, receiptIds);

  const packetEvent = appendEvent("add", packetPath, packetStat);
  const receiptEvent = appendEvent("add", receiptPath, receiptStat);

  assertPass(packetIds.packet_id === packetId, "packet id extraction failed");
  assertPass(packetIds.receipt_id === null, "packet fixture should not extract receipt id");
  assertPass(receiptIds.packet_id === packetId, "receipt packet id extraction failed");
  assertPass(receiptIds.receipt_id === receiptId, "receipt id extraction failed");
  assertPass(packetDestination === "tinkerden_dispatch", "packet destination guess mismatch");
  assertPass(receiptDestination === "tinkerden_receipts", "receipt destination guess mismatch");
  assertPass(packetEventType === "packet_dispatched", "packet event type did not normalize to packet_dispatched");
  assertPass(receiptEventType === "packet_receipted", "receipt event type did not normalize to packet_receipted");
  assertPass(packetEvent?.schema === "harvey_nerdkle_event_v0", "packet event missing schema");
  assertPass(receiptEvent?.schema === "harvey_nerdkle_event_v0", "receipt event missing schema");
  assertPass(packetEvent.packet_id === packetId, "packet event missing packet id");
  assertPass(packetEvent.receipt_id === null, "packet event should have null receipt id");
  assertPass(receiptEvent.packet_id === packetId, "receipt event missing packet id");
  assertPass(receiptEvent.receipt_id === receiptId, "receipt event missing receipt id");
  assertPass(Boolean(packetEvent.event_id), "packet event missing event id");
  assertPass(Boolean(receiptEvent.event_id), "receipt event missing event id");

  const afterEvents = await readEventLines();
  const joinedEvents = afterEvents.filter((event) => event.packet_id === packetId);
  const dispatchEvent = joinedEvents.find((event) => event.event_type === "packet_dispatched");
  const receiptedEvent = joinedEvents.find((event) => event.event_type === "packet_receipted" && event.receipt_id === receiptId);
  assertPass(afterEvents.length >= beforeCount + 2, "events jsonl did not append at least two events");
  assertPass(Boolean(dispatchEvent), "normalized dispatch event missing from JSONL");
  assertPass(Boolean(receiptedEvent), "normalized receipt event missing from JSONL");

  const touchedFiles = [
    WATCHER_PATH,
    "scripts/foreman/organism-event-spine-normalization-smoke.mjs",
    repoRel(packetPath),
    repoRel(receiptPath),
    "data/organism/events.jsonl",
  ];

  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_EVENT_SPINE_NORMALIZATION_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: process.env.COMPUTERNAME || "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: "BOOK_ARCHITECTURE_EVENT_SPINE_NORMALIZATION_V0",
    receipt_id: "BOOK_ARCHITECTURE_EVENT_SPINE_NORMALIZATION_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/organism-event-spine-normalization-smoke.mjs",
    validation: {
      watcher_exports_normalization_helpers: true,
      packet_id_extracted_from_packet_json: true,
      packet_id_and_receipt_id_extracted_from_receipt_json: true,
      packet_event_normalizes_to_packet_dispatched: true,
      receipt_event_normalizes_to_packet_receipted: true,
      normalized_events_include_schema_and_event_id: true,
      normalized_events_join_by_packet_id_and_receipt_id: true,
      events_jsonl_append_proved: true,
      truth_boundary:
        "This smoke writes fixture packet and receipt files plus two watcher events. It does not start the persistent watcher, send anything externally, or claim Mack returned a review.",
    },
    fixture_readback: {
      packet_path: repoRel(packetPath),
      receipt_path: repoRel(receiptPath),
      events_path: repoRel(EVENTS_PATH),
      packet_event_id: packetEvent.event_id,
      receipt_event_id: receiptEvent.event_id,
      packet_id: packetId,
      receipt_id: receiptId,
      event_count_before: beforeCount,
      event_count_after: afterEvents.length,
    },
    file_hashes: await Promise.all(
      touchedFiles.map(async (relativePath) => ({
        path: relativePath,
        sha256: await fileHash(relativePath),
      })),
    ),
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no external send claim",
      "no Mack receipt claim",
    ],
  };

  await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
  await writeFile(RECEIPT_PATH, `${JSON.stringify(outputReceipt, null, 2)}\n`, "utf8");
  const finalRaw = await readFile(RECEIPT_PATH);
  console.log(
    JSON.stringify(
      {
        ok: true,
        receipt_path: repoRel(RECEIPT_PATH),
        receipt_sha256: sha256(finalRaw),
        packet_id: packetId,
        receipt_id: receiptId,
        packet_event_id: packetEvent.event_id,
        receipt_event_id: receiptEvent.event_id,
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
