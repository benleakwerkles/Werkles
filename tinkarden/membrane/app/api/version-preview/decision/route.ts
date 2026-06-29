import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
const MEMBRANE_ROOT = path.join(REPO_ROOT, "tinkarden", "membrane");
const SPEAKER_INTERFACE_LOG = path.join(REPO_ROOT, "speaker", "logs", "interface-notify.jsonl");
const DECISION_DIR = path.join(MEMBRANE_ROOT, "version_preview_decisions");
const DECISION_LOG = path.join(MEMBRANE_ROOT, "version_preview_decisions.jsonl");

const DECISIONS = new Set(["KEEP", "STEAL_PARTS", "LET_DIE"]);

type VersionDecisionReceipt = {
  event_type: "version_preview_decision";
  receipt_id: string;
  version_id: string;
  title: string;
  family: string;
  decision: "KEEP" | "STEAL_PARTS" | "LET_DIE";
  source_path: string;
  evidence_path: string;
  source_url: string | null;
  useful_parts: string[];
  decided_at: string;
  receipt_path: string;
};

function rel(filePath: string) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join("/");
}

function safeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 96) || "version_preview";
}

async function appendJsonl(filePath: string, record: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(record)}\n`, "utf8");
}

async function readLatestDecisions() {
  try {
    const raw = await fs.readFile(DECISION_LOG, "utf8");
    const latest = new Map<string, VersionDecisionReceipt>();
    for (const line of raw.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const parsed = JSON.parse(line) as VersionDecisionReceipt;
      if (typeof parsed.version_id === "string") latest.set(parsed.version_id, parsed);
    }
    return Array.from(latest.values()).sort((left, right) => right.decided_at.localeCompare(left.decided_at));
  } catch {
    return [];
  }
}

export async function GET() {
  const decisions = await readLatestDecisions();
  return NextResponse.json({
    ok: true,
    decisions: decisions.map((decision) => ({
      version_id: decision.version_id,
      decision: decision.decision,
      receipt_path: decision.receipt_path,
      decided_at: decision.decided_at
    }))
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const versionId = String(body.version_id || "");
    const decision = String(body.decision || "");

    if (!versionId) {
      return NextResponse.json({ ok: false, error: "VERSION_ID_REQUIRED" }, { status: 400 });
    }

    if (!DECISIONS.has(decision)) {
      return NextResponse.json({ ok: false, error: "DECISION_MUST_BE_KEEP_STEAL_PARTS_OR_LET_DIE" }, { status: 400 });
    }

    const decidedAt = new Date().toISOString();
    const receiptId = `version_preview_${safeId(versionId)}_${Date.now().toString(36)}_${randomUUID().slice(0, 6)}`;
    const receiptPath = path.join(DECISION_DIR, `${receiptId}.json`);

    const receipt: VersionDecisionReceipt = {
      event_type: "version_preview_decision",
      receipt_id: receiptId,
      version_id: versionId,
      title: String(body.title || versionId),
      family: String(body.family || "unknown"),
      decision: decision as VersionDecisionReceipt["decision"],
      source_path: String(body.source_path || "UNKNOWN_SOURCE"),
      evidence_path: String(body.evidence_path || "UNKNOWN_EVIDENCE"),
      source_url: typeof body.source_url === "string" ? body.source_url : null,
      useful_parts: Array.isArray(body.useful_parts) ? body.useful_parts.map((part) => String(part)) : [],
      decided_at: decidedAt,
      receipt_path: rel(receiptPath)
    };

    await fs.mkdir(DECISION_DIR, { recursive: true });
    await fs.writeFile(receiptPath, JSON.stringify(receipt, null, 2), "utf8");
    await appendJsonl(DECISION_LOG, receipt);
    await appendJsonl(SPEAKER_INTERFACE_LOG, {
      event_type: "version_preview_decision",
      timestamp: decidedAt,
      version_id: receipt.version_id,
      title: receipt.title,
      decision: receipt.decision,
      receipt_path: receipt.receipt_path,
      source: "FeralMembraneVersionPreviewWall"
    });

    return NextResponse.json({
      ok: true,
      decision: {
        version_id: receipt.version_id,
        decision: receipt.decision,
        receipt_path: receipt.receipt_path,
        decided_at: receipt.decided_at
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "VERSION_PREVIEW_DECISION_FAILED" },
      { status: 500 }
    );
  }
}
