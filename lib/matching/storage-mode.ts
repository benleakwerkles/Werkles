export type MatchingStorageMode = "file" | "supabase";

export function parseMatchingStorageMode(value: string | undefined): MatchingStorageMode {
  const configured = (value ?? "file").trim().toLowerCase();
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
