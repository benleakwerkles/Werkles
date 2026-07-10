import os from "node:os";
import path from "node:path";

let cachedRoot: string | null = null;

/**
 * Writable root for JSONL / intake files.
 * Vercel/Lambda deploy cwd (/var/task) is read-only — use os.tmpdir() there.
 */
export function writableDataRoot(): string {
  if (cachedRoot) return cachedRoot;

  if (process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    cachedRoot = path.join(os.tmpdir(), "werkles-data");
    return cachedRoot;
  }

  cachedRoot = process.cwd();
  return cachedRoot;
}

export function dataPath(...segments: string[]): string {
  return path.join(writableDataRoot(), ...segments);
}
