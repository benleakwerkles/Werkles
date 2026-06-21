import fs from "node:fs";
import path from "node:path";

import type { MockTestReceiptFile, TransportActionFile } from "@/protocol/index";

const ROOT = process.cwd();
const RECEIPTS_DIR = path.join(ROOT, "foreman", "soledash", "receipts");
const ACTIONS_DIR = path.join(ROOT, "foreman", "soledash", "actions");

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export type WriteMockTestFilesResult =
  | { ok: true; receipt_path: string; action_path: string | null }
  | { ok: false; error: string };

export function writeMockTestFiles(
  receipt: MockTestReceiptFile,
  action: TransportActionFile | null
): WriteMockTestFilesResult {
  try {
    ensureDir(RECEIPTS_DIR);
    const receiptFileName = `${receipt.action_id}.json`;
    const receiptPath = path.join(RECEIPTS_DIR, receiptFileName);
    fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");

    let actionPath: string | null = null;
    if (action) {
      ensureDir(ACTIONS_DIR);
      const actionFileName = `${action.action_id}.json`;
      actionPath = path.join(ACTIONS_DIR, actionFileName);
      fs.writeFileSync(actionPath, `${JSON.stringify(action, null, 2)}\n`, "utf8");
    }

    return {
      ok: true,
      receipt_path: `foreman/soledash/receipts/${receiptFileName}`,
      action_path: actionPath ? `foreman/soledash/actions/${path.basename(actionPath)}` : null
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to write mock test files."
    };
  }
}
