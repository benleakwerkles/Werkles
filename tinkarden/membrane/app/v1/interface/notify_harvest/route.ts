import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
const SPEAKER_ROOT = path.join(REPO_ROOT, "speaker");
const INTERFACE_NOTIFY_LOG_PATH = path.join(SPEAKER_ROOT, "logs", "interface-notify.jsonl");

type JsonRecord = Record<string, unknown>;

function stamp() {
  return new Date().toISOString();
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function appendJsonl(filePath: string, entry: JsonRecord) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(entry)}\n`, "utf8");
}

function harvestNotice(body: JsonRecord) {
  const writtenFiles = Array.isArray(body.written_files)
    ? body.written_files.map(String)
    : body.written_file
      ? [String(body.written_file)]
      : [];

  return {
    event: "interface_harvest_notification",
    event_type: "clipboard_ingest",
    status: "CLIPBOARD_INGEST_SUCCESSFUL",
    badge: "[ CLIPBOARD_INGEST: SUCCESSFUL ]",
    timestamp: stamp(),
    source: "POST /v1/interface/notify_harvest",
    capsule_id: text(body.capsule_id) || text(body.receipt_id) || path.basename(writtenFiles[0] || ""),
    written_files: writtenFiles,
    clipboard_cleared: body.clipboard_cleared === true,
    payload: body
  };
}

export async function POST(request: Request) {
  let body: JsonRecord = {};
  try {
    const parsed = await request.json();
    body = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as JsonRecord : {};
  } catch {
    body = {};
  }

  const entry = harvestNotice(body);
  appendJsonl(INTERFACE_NOTIFY_LOG_PATH, entry);

  return Response.json({
    ok: true,
    status: entry.status,
    badge: entry.badge,
    timestamp: entry.timestamp,
    log_path: "speaker/logs/interface-notify.jsonl"
  });
}
