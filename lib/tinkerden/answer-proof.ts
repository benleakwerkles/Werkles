import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

export type NerdkleAnswerProof = {
  receipt_id: string;
  packet_id: string;
  status: string;
  message: string;
  created_at: string;
  source_outbox_path: string;
  received_path: string;
  answer_path: string;
  returned_path: string;
  answer_sha256: string;
  limitation: string;
};

const RECEIPTS_DIR = path.join("foreman", "messages", "receipts");

function repoPath(relativePath: string) {
  return path.join(process.cwd(), relativePath);
}

function text(value: unknown, fallback = "UNKNOWN") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

async function readJson(relativePath: string): Promise<JsonRecord | null> {
  try {
    const parsed = JSON.parse(await readFile(repoPath(relativePath), "utf8")) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as JsonRecord) : null;
  } catch {
    return null;
  }
}

async function listAnswerReceiptFiles() {
  try {
    const entries = await readdir(repoPath(RECEIPTS_DIR), { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.startsWith("nerdkle_answer_receipt_") && entry.name.endsWith(".json"))
      .map((entry) => path.join(RECEIPTS_DIR, entry.name).split(path.sep).join("/"));
  } catch {
    return [];
  }
}

export async function readLatestNerdkleAnswerProofs(limit = 8): Promise<NerdkleAnswerProof[]> {
  const files = await listAnswerReceiptFiles();
  const receipts = await Promise.all(
    files.map(async (receiptPath) => {
      const receipt = await readJson(receiptPath);
      if (!receipt || receipt.schema !== "nerdkle_answer_receipt_v0") return null;
      return {
        receipt_id: text(receipt.receipt_id),
        packet_id: text(receipt.packet_id),
        status: text(receipt.status),
        message: text(receipt.message),
        created_at: text(receipt.created_at),
        source_outbox_path: text(receipt.source_outbox_path),
        received_path: text(receipt.received_path),
        answer_path: text(receipt.answer_path),
        returned_path: text(receipt.returned_path),
        answer_sha256: text(receipt.answer_sha256),
        limitation: text(receipt.limitation)
      };
    })
  );

  return receipts
    .filter((receipt): receipt is NerdkleAnswerProof => receipt !== null)
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .slice(0, limit);
}
