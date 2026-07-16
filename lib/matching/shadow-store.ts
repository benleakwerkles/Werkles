import "server-only";

import { appendFile, mkdir, readFile } from "node:fs/promises";

import { getSupabaseService } from "@/lib/supabase/server";
import { dataPath } from "@/lib/server/writable-data-root";
import type { ShadowMatchingRun } from "@/lib/matching/types";
import {
  getMatchingStorageMode,
  matchingReceiptPath
} from "@/lib/matching/storage-mode";

export { getMatchingStorageMode, matchingReceiptPath } from "@/lib/matching/storage-mode";

const FILE_RECEIPT_PATH = "data/matching/shadow-runs.jsonl";

/** Normalize legacy payloads that stored packaging under `speaker`. */
function normalizeShadowRun(raw: unknown): ShadowMatchingRun {
  const run = raw as ShadowMatchingRun & { speaker?: ShadowMatchingRun["readout"] };
  if (!run.readout && run.speaker) {
    return {
      ...run,
      readout: run.speaker,
      memberCausalDraft: run.memberCausalDraft ?? null
    };
  }
  return {
    ...run,
    memberCausalDraft: run.memberCausalDraft ?? null
  };
}

async function ensureIntakeCustody(run: ShadowMatchingRun): Promise<void> {
  const { error } = await getSupabaseService()
    .from("discovery_intakes")
    .upsert(
      {
        intake_id: run.intakeId,
        source: run.source,
        state: "Received",
        normalized_payload: {
          intake_id: run.intakeId,
          source: run.source,
          stated_need: run.signals.statedNeed,
          signals: run.signals
        },
        received_at: run.createdAt,
        updated_at: run.createdAt
      },
      { onConflict: "intake_id" }
    );

  if (error) throw new Error(`Discovery intake custody write failed: ${error.message}`);
}

async function persistFile(run: ShadowMatchingRun): Promise<void> {
  const directory = dataPath("data", "matching");
  await mkdir(directory, { recursive: true });
  await appendFile(dataPath(FILE_RECEIPT_PATH), `${JSON.stringify(run)}\n`, "utf8");
}

async function persistSupabase(run: ShadowMatchingRun): Promise<void> {
  await ensureIntakeCustody(run);

  const { error } = await getSupabaseService()
    .from("matching_shadow_runs")
    .insert({
      run_id: run.runId,
      intake_id: run.intakeId,
      source: run.source,
      mode: run.mode,
      engine_version: run.readout.version,
      created_at: run.createdAt,
      payload: run
    });

  if (error) {
    if (error.code === "23505") {
      throw new Error(`Matching shadow run already exists for run_id ${run.runId}`);
    }
    throw new Error(`Matching shadow durable write failed: ${error.message}`);
  }
}

export async function persistMatchingShadowRun(run: ShadowMatchingRun): Promise<void> {
  const mode = getMatchingStorageMode();
  if (mode === "supabase") {
    await persistSupabase(run);
    return;
  }
  await persistFile(run);
}

async function readFileRuns(limit: number): Promise<ShadowMatchingRun[]> {
  let content: string;
  try {
    content = await readFile(dataPath(FILE_RECEIPT_PATH), "utf8");
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === "ENOENT") return [];
    throw error;
  }

  return content
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-limit)
    .map((line) => normalizeShadowRun(JSON.parse(line)))
    .reverse();
}

async function readSupabaseRuns(limit: number): Promise<ShadowMatchingRun[]> {
  const { data, error } = await getSupabaseService()
    .from("matching_shadow_runs")
    .select("payload")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Matching shadow durable read failed: ${error.message}`);
  return (data ?? []).map((row) => normalizeShadowRun(row.payload));
}

export async function readMatchingShadowRuns(limit = 10): Promise<ShadowMatchingRun[]> {
  const boundedLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  return getMatchingStorageMode() === "supabase"
    ? readSupabaseRuns(boundedLimit)
    : readFileRuns(boundedLimit);
}
