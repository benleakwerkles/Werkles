export type MatchingStorageMode = "file" | "supabase";

export function parseMatchingStorageMode(value: string | undefined): MatchingStorageMode {
  // On Vercel the filesystem is ephemeral: file mode silently writes real
  // intakes to /tmp and loses them on lambda recycle. If the env var goes
  // missing there, fail toward durability, never silently toward file
  // (Locke, correction-side review 2026-07-31).
  const fallback: MatchingStorageMode = process.env.VERCEL === "1" ? "supabase" : "file";
  const configured = (value ?? fallback).trim().toLowerCase();
  if (configured === "file" || configured === "supabase") return configured;
  throw new Error(`Unsupported MATCHING_STORAGE_MODE: ${configured}`);
}

export function getMatchingStorageMode(): MatchingStorageMode {
  return parseMatchingStorageMode(process.env.MATCHING_STORAGE_MODE);
}

export function matchingReceiptPath(mode = getMatchingStorageMode()): string {
  return mode === "supabase"
    ? "supabase:public.matching_shadow_runs"
    : "data/matching/shadow-runs.jsonl";
}
