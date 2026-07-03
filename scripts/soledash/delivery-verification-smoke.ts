/**
 * Smoke test — delivery verification proof chain.
 * Run: npm run test:delivery-verification
 */
import fs from "node:fs";
import path from "node:path";
import { emitReceiverReadback, verifyDelivery } from "../../lib/organism/delivery-verification/verifier";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }

  console.log(`ok: ${message}`);
}

const repoRoot = process.cwd();
const testRoot = path.join("data", "organism", "delivery-verification-test");
const senderPath = path.join(testRoot, "sender", "packet.txt");
const receiverPath = path.join(testRoot, "receiver", "packet.txt");
const receiptPath = path.join(testRoot, "receipts", "packet-receipt.json");
const assimilationPath = path.join(testRoot, "assimilation", "packet-assimilation.json");
const eventLogPath = path.join("data", "organism", "delivery_verification.jsonl");
const receiverReadbackLogPath = path.join("data", "organism", "receiver_readback.jsonl");
const deliveryId = "delivery_verification_smoke_v0";
const receiver = "TinkerDen Intake";
const payload = "DELIVERY_VERIFICATION_V0 proves receiver readback before delivery claim.\n";

function absolute(relativePath: string): string {
  return path.join(repoRoot, relativePath);
}

for (const relativePath of [senderPath, receiverPath, receiptPath, assimilationPath]) {
  fs.rmSync(absolute(relativePath), { force: true });
}
fs.rmSync(absolute(receiverReadbackLogPath), { force: true });

fs.mkdirSync(path.dirname(absolute(senderPath)), { recursive: true });
fs.writeFileSync(absolute(senderPath), payload, "utf8");

const senderOnly = verifyDelivery({
  deliveryId,
  senderPath,
  receiverReadbackPath: receiverPath,
  receiver,
  receiverReadbackLogPath,
  receiptPath,
  assimilationPath,
  eventLogPath,
  destinationGuess: "delivery_verification_smoke",
});

assert(senderOnly.local_storage_proven, "sender storage is proven");
assert(senderOnly.state === "DELIVERY_UNVERIFIED", "sender-only storage cannot prove delivery");
assert(!senderOnly.delivery_proven, "delivery is false without receiver readback");
assert(senderOnly.blocker === "RECEIVER_STORAGE_MISSING", "missing receiver storage is the blocker");

fs.mkdirSync(path.dirname(absolute(receiverPath)), { recursive: true });
fs.copyFileSync(absolute(senderPath), absolute(receiverPath));

const receiverReadback = verifyDelivery({
  deliveryId,
  senderPath,
  receiverReadbackPath: receiverPath,
  receiver,
  receiverReadbackLogPath,
  receiptPath,
  assimilationPath,
  eventLogPath,
  destinationGuess: "delivery_verification_smoke",
});

assert(receiverReadback.state === "DELIVERY_PROVEN", "matching receiver readback proves delivery");
assert(receiverReadback.hash_match, "sender and receiver hashes match");
assert(!receiverReadback.receipt_proven, "receipt is not proven before receipt file exists");
assert(!receiverReadback.receiver_readback_proven, "receiver-readback JSONL is required beyond delivery proven");

fs.mkdirSync(path.dirname(absolute(receiptPath)), { recursive: true });
fs.writeFileSync(
  absolute(receiptPath),
  `${JSON.stringify(
    {
      delivery_id: deliveryId,
      receiver_readback_path: receiverPath,
      source_hash: receiverReadback.source_hash,
      receiver_hash: receiverReadback.receiver_hash,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

const withReceipt = verifyDelivery({
  deliveryId,
  senderPath,
  receiverReadbackPath: receiverPath,
  receiver,
  receiverReadbackLogPath,
  receiptPath,
  assimilationPath,
  eventLogPath,
  destinationGuess: "delivery_verification_smoke",
});

assert(withReceipt.state === "DELIVERY_PROVEN", "receipt cannot advance without receiver-readback JSONL");
assert(!withReceipt.receipt_proven, "receipt_proven stays false without receiver-readback JSONL");
assert(withReceipt.blocker === "RECEIVER_READBACK_RECORD_MISSING", "false-delivery receipt is automatically detectable");

const readbackEntry = emitReceiverReadback({
  deliveryId,
  receiverReadbackPath: receiverPath,
  receiver,
  receiverReadbackLogPath,
});

assert(readbackEntry.artifact_id === deliveryId, "receiver_readback.jsonl records artifact id");
assert(readbackEntry.receiver === receiver, "receiver_readback.jsonl records receiver");
assert(Boolean(readbackEntry.read_timestamp), "receiver_readback.jsonl records read timestamp");
assert(readbackEntry.hash === receiverReadback.receiver_hash, "receiver_readback.jsonl records matching hash");
assert(readbackEntry.byte_count > 0, "receiver_readback.jsonl records byte count");
assert(readbackEntry.path === receiverPath.replace(/\\/g, "/"), "receiver_readback.jsonl records receiver path");

const withReceiptReadback = verifyDelivery({
  deliveryId,
  senderPath,
  receiverReadbackPath: receiverPath,
  receiver,
  receiverReadbackLogPath,
  receiptPath,
  assimilationPath,
  eventLogPath,
  destinationGuess: "delivery_verification_smoke",
});

assert(withReceiptReadback.state === "RECEIPT_PROVEN", "receipt advances only after receiver-readback JSONL exists");
assert(withReceiptReadback.receipt_proven, "receipt_proven flag is true after readback");

fs.mkdirSync(path.dirname(absolute(assimilationPath)), { recursive: true });
fs.writeFileSync(
  absolute(assimilationPath),
  `${JSON.stringify({ delivery_id: deliveryId, assimilated_from: receiptPath }, null, 2)}\n`,
  "utf8",
);

const withAssimilation = verifyDelivery({
  deliveryId,
  senderPath,
  receiverReadbackPath: receiverPath,
  receiver,
  receiverReadbackLogPath,
  receiptPath,
  assimilationPath,
  eventLogPath,
  destinationGuess: "delivery_verification_smoke",
});

assert(withAssimilation.state === "ASSIMILATION_PROVEN", "assimilation file advances state to assimilation proven");
assert(withAssimilation.assimilation_proven, "assimilation_proven flag is true");

console.log(`\nDelivery verification smoke PASS: ${eventLogPath}`);
