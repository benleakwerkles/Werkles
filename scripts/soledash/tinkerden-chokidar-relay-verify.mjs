#!/usr/bin/env node
import chokidar from "chokidar";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const WATCH_DIRS = [
  path.join(ROOT, "foreman", "messages", "outbox"),
  path.join(ROOT, "foreman", "messages", "inbox"),
  path.join(ROOT, "foreman", "messages", "receipts"),
  path.join(ROOT, "data", "tinkerden", "receipts")
];
const TEST_RECEIPT_DIR = path.join(ROOT, "foreman", "messages", "receipts");
const VERIFICATION_DIR = path.join(ROOT, "foreman", "receipts");

function rel(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join("/");
}

function safeStamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function ensureDirs() {
  for (const dir of [...WATCH_DIRS, VERIFICATION_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function createTestReceipt() {
  const stamp = safeStamp();
  const packetId = `packet_tinkerpit_chokidar_verify_${stamp}`;
  const receiptId = `receipt_tinkerpit_chokidar_verify_${stamp}`;
  const receipt = {
    receipt_id: receiptId,
    packet_id: packetId,
    from_aeye: "Dink",
    from_machine: "Betsy",
    status: "ACKNOWLEDGED",
    message: "TINKERPIT_RELAY_SUPPORT_V0 chokidar verification receipt.",
    created_at: new Date().toISOString()
  };
  const filePath = path.join(TEST_RECEIPT_DIR, `${receiptId}.json`);
  writeJson(filePath, receipt);
  return { receipt, filePath };
}

function waitForReady(watcher) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("chokidar ready timeout")), 5000);
    watcher.once("ready", () => {
      clearTimeout(timeout);
      resolve();
    });
    watcher.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function waitForEvent(watcher, expectedPath) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`chokidar did not observe ${rel(expectedPath)}`)), 5000);

    function handle(eventPath, stat) {
      if (path.resolve(eventPath) !== path.resolve(expectedPath)) return;
      clearTimeout(timeout);
      watcher.off("add", handle);
      watcher.off("change", handle);
      resolve({ eventPath, stat });
    }

    watcher.on("add", handle);
    watcher.on("change", handle);
    watcher.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function main() {
  ensureDirs();

  const watcher = chokidar.watch(WATCH_DIRS, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 150,
      pollInterval: 50
    }
  });

  try {
    await waitForReady(watcher);
    const { receipt, filePath } = createTestReceipt();
    const observed = await waitForEvent(watcher, filePath);
    const raw = fs.readFileSync(filePath, "utf8");
    const verification = {
      receipt_id: `TINKERPIT_RELAY_SUPPORT_V0_${safeStamp()}`,
      mission: "TINKERPIT_RELAY_SUPPORT_V0",
      status: "PASS",
      verified_at: new Date().toISOString(),
      watcher: "chokidar",
      watched_paths: WATCH_DIRS.map(rel),
      observed_path: rel(observed.eventPath),
      observed_size_bytes: observed.stat?.size ?? raw.length,
      observed_sha256: sha256(raw),
      created_receipt_id: receipt.receipt_id,
      created_packet_id: receipt.packet_id
    };
    const verificationPath = path.join(VERIFICATION_DIR, `${verification.receipt_id}.json`);
    writeJson(verificationPath, verification);

    console.log(JSON.stringify({ ok: true, verification, verification_path: rel(verificationPath) }, null, 2));
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          status: "FAIL",
          error: error instanceof Error ? error.message : String(error),
          watched_paths: WATCH_DIRS.map(rel)
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  } finally {
    await watcher.close();
  }
}

await main();
