import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type DeliveryVerificationState =
  | "LOCAL_STORAGE_PROVEN"
  | "DELIVERY_UNVERIFIED"
  | "DELIVERY_PROVEN"
  | "RECEIPT_PROVEN"
  | "ASSIMILATION_PROVEN";

export type DeliveryVerificationInput = {
  deliveryId: string;
  senderPath: string;
  receiverReadbackPath: string;
  receiver?: string;
  receiverReadbackLogPath?: string;
  receiptPath?: string;
  assimilationPath?: string;
  eventLogPath?: string;
  repoRoot?: string;
  destinationGuess?: string;
  detectedBy?: string;
};

export type DeliveryVerificationRecord = {
  timestamp: string;
  delivery_id: string;
  state: DeliveryVerificationState;
  sender_path: string;
  receiver_readback_path: string;
  receipt_path: string | null;
  assimilation_path: string | null;
  source_hash: string | null;
  receiver_hash: string | null;
  receiver_readback_log_path: string;
  hash_match: boolean;
  local_storage_proven: boolean;
  receiver_readback_proven: boolean;
  delivery_proven: boolean;
  receipt_proven: boolean;
  assimilation_proven: boolean;
  detected_by: string;
  destination_guess: string | null;
  blocker: string | null;
};

const DEFAULT_EVENT_LOG_PATH = path.join("data", "organism", "delivery_verification.jsonl");
const DEFAULT_RECEIVER_READBACK_LOG_PATH = path.join("data", "organism", "receiver_readback.jsonl");

export type ReceiverReadbackEntry = {
  artifact_id: string;
  receiver: string;
  read_timestamp: string;
  hash: string;
  byte_count: number;
  path: string;
};

function resolveFromRoot(repoRoot: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);
}

function toRepoRelative(repoRoot: string, filePath: string): string {
  const absolutePath = resolveFromRoot(repoRoot, filePath);
  return path.relative(repoRoot, absolutePath).split(path.sep).join("/");
}

function fileProof(filePath: string): { exists: boolean; sha256: string | null; byteCount: number | null } {
  if (!fs.existsSync(filePath)) return { exists: false, sha256: null, byteCount: null };

  const stat = fs.statSync(filePath);
  if (!stat.isFile()) return { exists: false, sha256: null, byteCount: null };

  const hash = crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  return { exists: true, sha256: hash, byteCount: stat.size };
}

function readJsonl(filePath: string): unknown[] {
  if (!fs.existsSync(filePath)) return [];

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as unknown;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function receiverReadbackMatches({
  logPath,
  artifactId,
  receiver,
  expectedHash,
  expectedByteCount,
  expectedPath,
}: {
  logPath: string;
  artifactId: string;
  receiver: string;
  expectedHash: string | null;
  expectedByteCount: number | null;
  expectedPath: string;
}): boolean {
  if (!expectedHash || expectedByteCount === null) return false;

  return readJsonl(logPath).some((entry) => {
    const readback = entry as Partial<ReceiverReadbackEntry>;

    return (
      readback.artifact_id === artifactId &&
      readback.receiver === receiver &&
      readback.hash === expectedHash &&
      readback.byte_count === expectedByteCount &&
      readback.path === expectedPath
    );
  });
}

function nextState({
  localStorageProven,
  deliveryProven,
  receiptProven,
  assimilationProven,
}: {
  localStorageProven: boolean;
  deliveryProven: boolean;
  receiptProven: boolean;
  assimilationProven: boolean;
}): DeliveryVerificationState {
  if (assimilationProven) return "ASSIMILATION_PROVEN";
  if (receiptProven) return "RECEIPT_PROVEN";
  if (deliveryProven) return "DELIVERY_PROVEN";
  if (localStorageProven) return "DELIVERY_UNVERIFIED";

  return "LOCAL_STORAGE_PROVEN";
}

function blockerFor({
  localStorageProven,
  receiverStorageProven,
  receiverReadbackProven,
  hashMatch,
  deliveryProven,
  receiptProven,
  assimilationProven,
  receiptPath,
  assimilationPath,
}: {
  localStorageProven: boolean;
  receiverStorageProven: boolean;
  receiverReadbackProven: boolean;
  hashMatch: boolean;
  deliveryProven: boolean;
  receiptProven: boolean;
  assimilationProven: boolean;
  receiptPath?: string;
  assimilationPath?: string;
}): string | null {
  if (!localStorageProven) return "SENDER_STORAGE_MISSING";
  if (!receiverStorageProven) return "RECEIVER_STORAGE_MISSING";
  if (!hashMatch) return "RECEIVER_HASH_MISMATCH";
  if (deliveryProven && !receiverReadbackProven) return "RECEIVER_READBACK_RECORD_MISSING";
  if (receiptPath && !receiptProven) return "RECEIPT_MISSING";
  if (assimilationPath && !assimilationProven) return "ASSIMILATION_MISSING";

  return null;
}

export function emitReceiverReadback(
  input: Pick<DeliveryVerificationInput, "deliveryId" | "receiverReadbackPath" | "repoRoot" | "receiverReadbackLogPath" | "receiver">,
): ReceiverReadbackEntry {
  const repoRoot = input.repoRoot ?? process.cwd();
  const receiverAbsolutePath = resolveFromRoot(repoRoot, input.receiverReadbackPath);
  const receiver = fileProof(receiverAbsolutePath);

  if (!receiver.exists || !receiver.sha256 || receiver.byteCount === null) {
    throw new Error(`Receiver readback target missing or unreadable: ${input.receiverReadbackPath}`);
  }

  const receiverReadbackLogPath = resolveFromRoot(
    repoRoot,
    input.receiverReadbackLogPath ?? DEFAULT_RECEIVER_READBACK_LOG_PATH,
  );
  const entry: ReceiverReadbackEntry = {
    artifact_id: input.deliveryId,
    receiver: input.receiver ?? "receiver",
    read_timestamp: new Date().toISOString(),
    hash: receiver.sha256,
    byte_count: receiver.byteCount,
    path: toRepoRelative(repoRoot, receiverAbsolutePath),
  };

  fs.mkdirSync(path.dirname(receiverReadbackLogPath), { recursive: true });
  fs.appendFileSync(receiverReadbackLogPath, `${JSON.stringify(entry)}\n`, "utf8");

  return entry;
}

export function verifyDelivery(input: DeliveryVerificationInput): DeliveryVerificationRecord {
  const repoRoot = input.repoRoot ?? process.cwd();
  const senderAbsolutePath = resolveFromRoot(repoRoot, input.senderPath);
  const receiverAbsolutePath = resolveFromRoot(repoRoot, input.receiverReadbackPath);
  const receiverReadbackLogPath = resolveFromRoot(
    repoRoot,
    input.receiverReadbackLogPath ?? DEFAULT_RECEIVER_READBACK_LOG_PATH,
  );
  const receiptAbsolutePath = input.receiptPath ? resolveFromRoot(repoRoot, input.receiptPath) : null;
  const assimilationAbsolutePath = input.assimilationPath ? resolveFromRoot(repoRoot, input.assimilationPath) : null;

  const sender = fileProof(senderAbsolutePath);
  const receiver = fileProof(receiverAbsolutePath);
  const receiptProven = receiptAbsolutePath ? fileProof(receiptAbsolutePath).exists : false;
  const assimilationProven = assimilationAbsolutePath ? fileProof(assimilationAbsolutePath).exists : false;

  const hashMatch = Boolean(sender.sha256 && receiver.sha256 && sender.sha256 === receiver.sha256);
  const deliveryProven = sender.exists && receiver.exists && hashMatch;
  const receiverReadbackProven =
    deliveryProven &&
    receiverReadbackMatches({
      logPath: receiverReadbackLogPath,
      artifactId: input.deliveryId,
      receiver: input.receiver ?? "receiver",
      expectedHash: receiver.sha256,
      expectedByteCount: receiver.byteCount,
      expectedPath: toRepoRelative(repoRoot, receiverAbsolutePath),
    });
  const state = nextState({
    localStorageProven: sender.exists,
    deliveryProven,
    receiptProven: deliveryProven && receiverReadbackProven && receiptProven,
    assimilationProven: deliveryProven && receiverReadbackProven && receiptProven && assimilationProven,
  });

  const record: DeliveryVerificationRecord = {
    timestamp: new Date().toISOString(),
    delivery_id: input.deliveryId,
    state,
    sender_path: toRepoRelative(repoRoot, senderAbsolutePath),
    receiver_readback_path: toRepoRelative(repoRoot, receiverAbsolutePath),
    receipt_path: receiptAbsolutePath ? toRepoRelative(repoRoot, receiptAbsolutePath) : null,
    assimilation_path: assimilationAbsolutePath ? toRepoRelative(repoRoot, assimilationAbsolutePath) : null,
    source_hash: sender.sha256,
    receiver_hash: receiver.sha256,
    receiver_readback_log_path: toRepoRelative(repoRoot, receiverReadbackLogPath),
    hash_match: hashMatch,
    local_storage_proven: sender.exists,
    receiver_readback_proven: receiverReadbackProven,
    delivery_proven: deliveryProven,
    receipt_proven: deliveryProven && receiverReadbackProven && receiptProven,
    assimilation_proven: deliveryProven && receiverReadbackProven && receiptProven && assimilationProven,
    detected_by: input.detectedBy ?? "Maker@Betsy",
    destination_guess: input.destinationGuess ?? null,
    blocker: blockerFor({
      localStorageProven: sender.exists,
      receiverStorageProven: receiver.exists,
      receiverReadbackProven,
      hashMatch,
      deliveryProven,
      receiptProven,
      assimilationProven,
      receiptPath: input.receiptPath,
      assimilationPath: input.assimilationPath,
    }),
  };

  const eventLogPath = resolveFromRoot(repoRoot, input.eventLogPath ?? DEFAULT_EVENT_LOG_PATH);
  fs.mkdirSync(path.dirname(eventLogPath), { recursive: true });
  fs.appendFileSync(eventLogPath, `${JSON.stringify(record)}\n`, "utf8");

  return record;
}
