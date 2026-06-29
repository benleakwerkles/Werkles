import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DRIFT_LOG_PATH = path.join(process.cwd(), "tinkarden", "membrane", "drift_log.json");

function sourcePath() {
  return path.relative(process.cwd(), DRIFT_LOG_PATH).split(path.sep).join("/");
}

export async function GET() {
  try {
    const parsed = JSON.parse(await readFile(DRIFT_LOG_PATH, "utf8"));
    return NextResponse.json(Array.isArray(parsed) ? parsed : [parsed]);
  } catch (error) {
    return NextResponse.json([
      {
        id: "drift_api_read_blocked",
        timestamp: new Date().toISOString(),
        sensor: "TinkerDenAPI",
        severity: "WOUND",
        code: "DRIFT_LOG_READ_BLOCKED",
        message: error instanceof Error ? error.message : "drift_log.json could not be read",
        source_path: sourcePath()
      }
    ]);
  }
}
