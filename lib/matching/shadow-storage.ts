import "server-only";

import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { ShadowMatchingRun } from "@/lib/matching/types";

const SHADOW_DIR = "data/matching";
const SHADOW_INDEX = "data/matching/shadow-runs.jsonl";

function repoPath(relative: string) {
  return path.join(process.cwd(), relative);
}

export async function persistShadowRun(run: ShadowMatchingRun): Promise<void> {
  await mkdir(repoPath(SHADOW_DIR), { recursive: true });
  const line = `${JSON.stringify(run)}\n`;
  await appendFile(repoPath(SHADOW_INDEX), line, "utf8");
}

export function newShadowRunId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `shadow_${stamp}_${randomUUID().slice(0, 8)}`;
}
