import "server-only";

import { randomUUID } from "node:crypto";

import type { ShadowMatchingRun } from "@/lib/matching/types";
import { persistMatchingShadowRun, readMatchingShadowRuns } from "@/lib/matching/shadow-store";

export { readMatchingShadowRuns, matchingReceiptPath, getMatchingStorageMode } from "@/lib/matching/shadow-store";

export async function persistShadowRun(run: ShadowMatchingRun): Promise<void> {
  await persistMatchingShadowRun(run);
}

export function newShadowRunId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `shadow_${stamp}_${randomUUID().slice(0, 8)}`;
}

export async function readLatestShadowRuns(limit = 10): Promise<ShadowMatchingRun[]> {
  return readMatchingShadowRuns(limit);
}
