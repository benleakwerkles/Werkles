import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
const MEMBRANE_ROOT = path.join(REPO_ROOT, "tinkarden", "membrane");
const SPEAKER_ROOT = path.join(REPO_ROOT, "speaker");
const TAP_LOG_PATH = path.join(MEMBRANE_ROOT, "momentum_taps.jsonl");
const TAP_RECEIPT_DIR = path.join(MEMBRANE_ROOT, "momentum_taps");
const INTERFACE_NOTIFY_LOG_PATH = path.join(SPEAKER_ROOT, "logs", "interface-notify.jsonl");

type CapsuleInput = {
  id?: unknown;
  origin?: unknown;
  target_mutations?: unknown;
  awaiting?: unknown;
  source_path?: unknown;
  status?: unknown;
  timestamp?: unknown;
};

function rel(filePath: string) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join("/");
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function stamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

function sha256(value: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function writeJsonl(filePath: string, value: Record<string, unknown>) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function existingTapFor(capsuleId: string) {
  try {
    return fs
      .readFileSync(TAP_LOG_PATH, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>)
      .reverse()
      .find((tap) => tap.capsule_id === capsuleId) ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { capsule?: CapsuleInput };
    const capsule = body.capsule || {};
    const capsuleId = text(capsule.id);
    if (!capsuleId) {
      return NextResponse.json({ ok: false, error: "CAPSULE_ID_REQUIRED" }, { status: 400 });
    }

    const existingTap = existingTapFor(capsuleId);
    if (existingTap) {
      return NextResponse.json({
        ok: true,
        duplicate_ignored: true,
        tap: existingTap
      });
    }

    const targetMutations = Array.isArray(capsule.target_mutations) ? capsule.target_mutations.map(String) : [];
    const now = new Date().toISOString();
    const tapId = `momentum_tap_${stamp()}_${crypto.randomBytes(3).toString("hex")}`;
    const tap = {
      schema: "feral_membrane_momentum_tap_v0",
      event_type: "momentum_tap",
      tap_id: tapId,
      capsule_id: capsuleId,
      origin: text(capsule.origin, "UNKNOWN@BETSY"),
      source_path: text(capsule.source_path, "UNKNOWN_SOURCE"),
      target_mutations: targetMutations,
      previous_status: text(capsule.status, "UNKNOWN"),
      status: "MOMENTUM_TAPPED",
      awaiting: "SWANSON_FUNCTIONAL_RELAY_MERGE",
      note: "Operator momentum tap recorded. No target file mutation performed by this tap.",
      swanson_merge_contract: {
        expected_consumer: "Swanson functional relay page",
        pending_until: "functional relay page exists",
        tap_log_path: rel(TAP_LOG_PATH),
        interface_event_path: rel(INTERFACE_NOTIFY_LOG_PATH)
      },
      created_at: now,
      capsule_hash: sha256(capsule)
    };
    const receiptPath = path.join(TAP_RECEIPT_DIR, `${safeName(tapId)}.json`);

    fs.mkdirSync(TAP_RECEIPT_DIR, { recursive: true });
    fs.writeFileSync(receiptPath, `${JSON.stringify(tap, null, 2)}\n`, "utf8");
    writeJsonl(TAP_LOG_PATH, { ...tap, receipt_path: rel(receiptPath) });
    writeJsonl(INTERFACE_NOTIFY_LOG_PATH, { ...tap, receipt_path: rel(receiptPath) });

    return NextResponse.json({
      ok: true,
      tap: {
        ...tap,
        receipt_path: rel(receiptPath),
        event_path: rel(INTERFACE_NOTIFY_LOG_PATH),
        tap_path: rel(TAP_LOG_PATH)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "MOMENTUM_TAP_FAILED" },
      { status: 500 }
    );
  }
}
