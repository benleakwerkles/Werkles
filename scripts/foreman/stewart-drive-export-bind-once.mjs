import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Retired live entrypoint. A whole-workbook bearer URL and workbook bytes
 * cannot pass through the Aeye orchestration process under the requested
 * credential-isolation boundary. This function intentionally never reads
 * stdin, fetches Drive, resolves a handle, or contacts a provider.
 */
export async function runStewartDisneyDriveExportBindOnce() {
  throw new Error("STEWART_DRIVE_LIVE_INGRESS_NOT_ISOLATED");
}

if (process.argv[1] && resolve(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  process.stderr.write("STEWART_DRIVE_LIVE_INGRESS_NOT_ISOLATED\n");
  process.exitCode = 1;
}
