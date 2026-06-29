import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
const MEMBRANE_ROOT = path.join(REPO_ROOT, "tinkarden", "membrane");
const SPEAKER_ROOT = path.join(REPO_ROOT, "speaker");
const DECISION_LOG_PATH = path.join(MEMBRANE_ROOT, "final_assembly_decisions.jsonl");
const DECISION_DIR = path.join(MEMBRANE_ROOT, "final_assembly_decisions");
const INTERFACE_NOTIFY_LOG_PATH = path.join(SPEAKER_ROOT, "logs", "interface-notify.jsonl");
const DECISIONS = new Set(["MERGE", "KEEP", "LET_DIE"]);

type JsonRecord = Record<string, unknown>;

type Decision = "MERGE" | "KEEP" | "LET_DIE";

type DecisionRequest = {
  module_id?: unknown;
  title?: unknown;
  system?: unknown;
  status?: unknown;
  merge_state?: unknown;
  proof_path?: unknown;
  decision?: unknown;
};

function rel(filePath: string) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join("/");
}

function text(value: unknown, fallback = "") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function stamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

function decisionLabel(decision: Decision) {
  return decision === "LET_DIE" ? "Let Die" : decision.charAt(0) + decision.slice(1).toLowerCase();
}

function normalizeDecision(value: unknown): Decision | null {
  const decision = text(value).replace(/[\s-]+/g, "_").toUpperCase();
  return DECISIONS.has(decision) ? decision as Decision : null;
}

function decisionEffect(decision: Decision) {
  if (decision === "MERGE") return "Candidate should move into the final first-screen relay surface.";
  if (decision === "KEEP") return "Candidate should stay available as a support/proof lane.";
  return "Candidate should leave the final UI candidate set while its proof path remains preserved.";
}

function sha256(value: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function writeJsonl(filePath: string, value: JsonRecord) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function readJsonl(filePath: string) {
  try {
    return fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as JsonRecord);
  } catch {
    return [];
  }
}

function latestDecisions() {
  const decisions = new Map<string, JsonRecord>();
  for (const decision of readJsonl(DECISION_LOG_PATH)) {
    const moduleId = text(decision.module_id);
    if (!moduleId) continue;
    decisions.set(moduleId, decision);
  }
  return Array.from(decisions.values());
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    decisions: latestDecisions(),
    decision_log_path: rel(DECISION_LOG_PATH)
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DecisionRequest;
    const moduleId = safeName(text(body.module_id));
    if (!moduleId) {
      return NextResponse.json({ ok: false, error: "MODULE_ID_REQUIRED" }, { status: 400 });
    }

    const decision = normalizeDecision(body.decision);
    if (!decision) {
      return NextResponse.json({ ok: false, error: "MERGE_KEEP_OR_LET_DIE_REQUIRED" }, { status: 400 });
    }

    const createdAt = new Date().toISOString();
    const decisionId = `final_assembly_decision_${moduleId}_${stamp()}_${crypto.randomBytes(3).toString("hex")}`;
    const decisionPath = path.join(DECISION_DIR, `${moduleId}.json`);
    const decisionRecord = {
      schema: "feral_membrane_final_assembly_decision_v0",
      event_type: "final_assembly_decision",
      decision_id: decisionId,
      module_id: moduleId,
      title: text(body.title, moduleId),
      system: text(body.system, "unknown"),
      status: text(body.status, "unknown"),
      merge_state: text(body.merge_state, "unknown"),
      decision,
      decision_label: decisionLabel(decision),
      decision_effect: decisionEffect(decision),
      proof_path: text(body.proof_path, "proof_path_missing"),
      decision_path: rel(decisionPath),
      decision_log_path: rel(DECISION_LOG_PATH),
      event_path: rel(INTERFACE_NOTIFY_LOG_PATH),
      operator: "Operator@Betsy",
      no_code_merge_performed: true,
      next_consumer: "Swanson functional relay final merge page",
      created_at: createdAt
    };
    const recordWithHash = {
      ...decisionRecord,
      sha256: sha256(decisionRecord)
    };

    fs.mkdirSync(DECISION_DIR, { recursive: true });
    fs.writeFileSync(decisionPath, `${JSON.stringify(recordWithHash, null, 2)}\n`, "utf8");
    writeJsonl(DECISION_LOG_PATH, recordWithHash);
    writeJsonl(INTERFACE_NOTIFY_LOG_PATH, recordWithHash);

    return NextResponse.json({
      ok: true,
      decision: recordWithHash
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "FINAL_ASSEMBLY_DECISION_FAILED" },
      { status: 500 }
    );
  }
}
