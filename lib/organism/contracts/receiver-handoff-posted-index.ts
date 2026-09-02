import {
  readReceiverHandoffIndex,
  type ReceiverHandoffIndexRecord,
} from "./receiver-handoff-index";

export type ReceiverHandoffPostedIndex = {
  ok: true;
  source_path: string;
  count: number;
  posted_count: number;
  source_total_count: number;
  latest: ReceiverHandoffIndexRecord | null;
  records: ReceiverHandoffIndexRecord[];
  truth_boundary: string;
};

const MAX_SCAN_LIMIT = 10000;

export async function readReceiverHandoffPostedIndex(limit = 25): Promise<ReceiverHandoffPostedIndex> {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 25;
  const source = await readReceiverHandoffIndex(MAX_SCAN_LIMIT);
  const posted = source.records.filter((record) => record.state === "posted");
  const records = posted.slice(0, safeLimit);

  return {
    ok: true,
    source_path: source.source_path,
    count: records.length,
    posted_count: posted.length,
    source_total_count: source.count,
    latest: records[0] ?? null,
    records,
    truth_boundary: "Posted-only receiver handoff index filters the canonical receiver handoff index to posted records; it does not create, fill, or post receipts.",
  };
}
