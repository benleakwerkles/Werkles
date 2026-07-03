import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type ReceiptRecord = Record<string, unknown>;

export type ReceiptStreamResponse = {
  source: "data/organism/receipt_pickup.jsonl";
  source_exists: boolean;
  limit: 10;
  count: number;
  records: ReceiptRecord[];
  blocker?: string;
};

const SOURCE_RELATIVE_PATH = "data/organism/receipt_pickup.jsonl";
const LIMIT = 10;

function sourcePath() {
  return join(process.cwd(), "data", "organism", "receipt_pickup.jsonl");
}

function parseReceiptLine(line: string, lineNumber: number): ReceiptRecord {
  const parsed = JSON.parse(line) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`receipt_pickup.jsonl line ${lineNumber} is not a JSON object`);
  }

  return parsed as ReceiptRecord;
}

export async function readLatestReceiptRecords(): Promise<ReceiptStreamResponse> {
  let raw: string;

  try {
    raw = await readFile(sourcePath(), "utf8");
  } catch (error) {
    const failed = error as NodeJS.ErrnoException;
    if (failed.code === "ENOENT") {
      return {
        source: SOURCE_RELATIVE_PATH,
        source_exists: false,
        limit: LIMIT,
        count: 0,
        records: [],
        blocker: "data/organism/receipt_pickup.jsonl not found",
      };
    }

    throw error;
  }

  const lines = raw
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter((entry) => entry.line);

  const latest = lines.slice(-LIMIT).map((entry) => parseReceiptLine(entry.line, entry.lineNumber));

  return {
    source: SOURCE_RELATIVE_PATH,
    source_exists: true,
    limit: LIMIT,
    count: latest.length,
    records: latest,
  };
}
