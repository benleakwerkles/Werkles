import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type JsonRecord = Record<string, unknown>;

const DATA_DIR = path.join(process.cwd(), "data", "thinkit");
const STATE_PATH = path.join(DATA_DIR, "next_three_projects.json");
const DECISIONS_PATH = path.join(DATA_DIR, "next_three_decisions.jsonl");
const MOMENTUM_STATE_PATH = path.join(DATA_DIR, "momentum_state.json");
const SPEAKER_ROOT = process.env.SPEAKER_ROOT || "C:\\speaker";

const speakerSurfacePaths = [
  ["speaker_root", SPEAKER_ROOT],
  ["speaker_db", path.join(SPEAKER_ROOT, "speaker.sqlite")],
  ["current_repo_state", path.join(SPEAKER_ROOT, "bootloader", "templates", "CURRENT_REPO_STATE.md")],
  ["skybro_bootpack", path.join(SPEAKER_ROOT, "bootpacks", "out", "Skybro.Betsy.BOOTPACK.md")],
  ["petra_bootpack", path.join(SPEAKER_ROOT, "bootpacks", "out", "Petra.Betsy.NERDKLE_BRAINBOOT.BOOTPACK.md")],
  ["brainboot_outbox", path.join(SPEAKER_ROOT, "brainboot", "outbox")],
  ["brainboot_receipts", path.join(SPEAKER_ROOT, "brainboot", "receipts")],
  ["aeye_relay_root", path.join(SPEAKER_ROOT, "aeye_relay")],
  ["speaker_ingest_log", path.join(SPEAKER_ROOT, "logs", "ingest.jsonl")]
] as const;

function nowIso() {
  return new Date().toISOString();
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" ? (value as JsonRecord) : null;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function sha256File(filePath: string) {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function boundedFileCount(rootPath: string, maxFiles = 800): Promise<{ file_count: number; truncated: boolean }> {
  let fileCount = 0;
  let truncated = false;

  async function walk(currentPath: string) {
    if (truncated) return;
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      if (truncated) return;
      const nextPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(nextPath);
      } else if (entry.isFile()) {
        fileCount += 1;
        if (fileCount >= maxFiles) truncated = true;
      }
    }
  }

  await walk(rootPath);
  return { file_count: fileCount, truncated };
}

async function inspectSurface(label: string, targetPath: string) {
  try {
    const stats = await fs.stat(targetPath);
    const base = {
      label,
      path: targetPath,
      exists: true,
      kind: stats.isDirectory() ? "directory" : "file",
      modified_at: stats.mtime.toISOString(),
      byte_count: stats.isFile() ? stats.size : null
    };

    if (stats.isFile()) {
      return {
        ...base,
        sha256: await sha256File(targetPath)
      };
    }

    const count = await boundedFileCount(targetPath);
    return {
      ...base,
      ...count
    };
  } catch (error) {
    return {
      label,
      path: targetPath,
      exists: false,
      kind: "missing",
      error: error instanceof Error ? error.message : "Path read failed"
    };
  }
}

async function readJsonFile(filePath: string) {
  const text = await fs.readFile(filePath, "utf8");
  return JSON.parse(text) as JsonRecord;
}

async function writeJsonFile(filePath: string, value: JsonRecord) {
  await ensureDataDir();
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readState() {
  await ensureDataDir();
  return readJsonFile(STATE_PATH);
}

async function readRecentDecisions(limit = 20) {
  try {
    const text = await fs.readFile(DECISIONS_PATH, "utf8");
    return text
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-limit)
      .map((line) => JSON.parse(line) as JsonRecord)
      .reverse();
  } catch {
    return [];
  }
}

async function readSpeakerState() {
  const surfaces = await Promise.all(speakerSurfacePaths.map(([label, targetPath]) => inspectSurface(label, targetPath)));
  const missing = surfaces.filter((surface) => !surface.exists).map((surface) => surface.label);
  return {
    status: missing.length === 0 ? "SPEAKER_READBACK_READY" : "SPEAKER_READBACK_PARTIAL",
    root: SPEAKER_ROOT,
    memory_answer:
      "Speaker is the file-backed memory/current-state substrate at C:\\speaker. Brainboot packets and receipts live under C:\\speaker\\brainboot, bootpacks under C:\\speaker\\bootpacks\\out, relay proof under C:\\speaker\\aeye_relay, and repo-state bootloader text under C:\\speaker\\bootloader\\templates.",
    brainboot_rule:
      "Aeyes restart from rendered bootpack text plus receiver-side Brainboot receipts. Dispatch is not proof; RECEIVED and COMPLETED/BLOCKER receipts are proof.",
    missing,
    surfaces,
    receiver_surfaces: [
      {
        target: "Skybro.Betsy",
        receive_url: "http://10.1.10.8:3339/aeye/Skybro.Betsy",
        brainboot_status_url: "http://10.1.10.8:3339/v1/brainboot/status"
      },
      {
        target: "Petra.Betsy",
        receive_url: "http://10.1.10.8:3339/aeye/Petra.Betsy",
        brainboot_status_url: "http://10.1.10.8:3339/v1/brainboot/status"
      }
    ]
  };
}

function findLane(state: JsonRecord, laneId: string) {
  return asArray(state.lanes).map(asRecord).find((lane) => asText(lane?.lane_id) === laneId) ?? null;
}

function findMove(lane: JsonRecord | null, moveId: string) {
  return asArray(lane?.moves).map(asRecord).find((move) => asText(move?.move_id) === moveId) ?? null;
}

async function appendDecision(decision: JsonRecord) {
  await ensureDataDir();
  await fs.appendFile(DECISIONS_PATH, `${JSON.stringify(decision)}\n`, "utf8");
}

async function buildResponse(status = "NEXT_THREE_READY") {
  const state = await readState();
  const [speaker, recentDecisions] = await Promise.all([readSpeakerState(), readRecentDecisions()]);
  return {
    ok: true,
    status,
    generated_at: nowIso(),
    state_path: STATE_PATH,
    decisions_path: DECISIONS_PATH,
    momentum_state_path: MOMENTUM_STATE_PATH,
    lanes: state.lanes,
    principle: state.principle,
    recent_decisions: recentDecisions,
    speaker
  };
}

export async function GET() {
  try {
    return NextResponse.json(await buildResponse());
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "NEXT_THREE_READBACK_BLOCKED",
        state_path: STATE_PATH,
        error: error instanceof Error ? error.message : "Next Three readback failed"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as JsonRecord;
    const action = asText(body.action, "REFRESH_NEXT_THREE");
    const state = await readState();

    if (action === "REFRESH_NEXT_THREE") {
      const snapshot = {
        schema: "thinkit_momentum_state_v0",
        updated_at: nowIso(),
        note: asText(body.note, "Operator refreshed Next Three Projects."),
        source_state_path: STATE_PATH,
        decisions_path: DECISIONS_PATH,
        speaker_root: SPEAKER_ROOT,
        lane_count: asArray(state.lanes).length
      };
      await writeJsonFile(MOMENTUM_STATE_PATH, snapshot);
      return NextResponse.json({
        ...(await buildResponse("NEXT_THREE_REFRESHED")),
        snapshot
      });
    }

    if (action === "DECISION") {
      const laneId = asText(body.lane_id);
      const moveId = asText(body.move_id);
      const choice = asText(body.choice, "REVIEW");
      const lane = findLane(state, laneId);
      const move = findMove(lane, moveId);

      if (!lane || !move) {
        return NextResponse.json(
          {
            ok: false,
            status: "NEXT_THREE_DECISION_BLOCKED",
            error: "UNKNOWN_LANE_OR_MOVE",
            lane_id: laneId,
            move_id: moveId
          },
          { status: 404 }
        );
      }

      const decisionId = `NEXT_THREE_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
      const decision = {
        decision_id: decisionId,
        created_at: nowIso(),
        lane_id: laneId,
        project: asText(lane.project, laneId),
        move_id: moveId,
        move_title: asText(move.title, moveId),
        choice,
        operator_note: asText(body.note, ""),
        target: asText(move.target, "Petra.Betsy"),
        packet_type: asText(move.packet_type, "MOMENTUM_NEXT_MOVE"),
        proof_required: asText(move.proof_required, "Receiver-side receipt or blocker required."),
        source_state_path: STATE_PATH
      };
      await appendDecision(decision);

      return NextResponse.json({
        ...(await buildResponse("NEXT_THREE_DECISION_RECORDED")),
        decision
      });
    }

    return NextResponse.json(
      {
        ok: false,
        status: "NEXT_THREE_ACTION_BLOCKED",
        error: "UNKNOWN_ACTION",
        action
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "NEXT_THREE_WRITE_BLOCKED",
        error: error instanceof Error ? error.message : "Next Three write failed"
      },
      { status: 500 }
    );
  }
}
