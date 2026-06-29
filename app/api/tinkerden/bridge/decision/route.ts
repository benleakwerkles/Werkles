import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DECISIONS = new Set(["PROCEED", "DEFER", "KILL"]);
const LEDGER_PATH = path.join("tinkerden", "feedback", "decision-ledger.jsonl");
const INHERITANCE_DIR = path.join("tinkerden", "feedback", "inheritance");
const SPEAKER_LEDGER_PATH = path.join("speaker", "inheritance", "inheritance_ledger.json");

type DecisionBody = {
  card_id?: string;
  move?: string;
  recommendation?: string;
  composite_score?: number;
  decision?: string;
  operator_reason?: string;
};

type BridgeInheritanceEntry = {
  inheritance_id: string;
  title: string;
  origin_receipt: string;
  lesson: string;
  why_it_matters: string;
  status: "ACTIVE";
  timestamp: string;
  source_decision: string;
  operator_decision: string;
  recommendation: string;
  composite_score: number | null;
  artifact_path: string;
};

function decisionId() {
  return `td_decision_${new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function inheritanceId() {
  return `td_inheritance_${new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

async function readSpeakerLedger(fullPath: string): Promise<BridgeInheritanceEntry[]> {
  try {
    return JSON.parse(await readFile(fullPath, "utf8")) as BridgeInheritanceEntry[];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DecisionBody;
    const decision = body.decision?.trim().toUpperCase();
    const operatorReason = body.operator_reason?.trim() ?? "";

    if (!body.card_id?.trim()) {
      return NextResponse.json({ ok: false, error: "CARD_ID_REQUIRED" }, { status: 400 });
    }

    if (!decision || !DECISIONS.has(decision)) {
      return NextResponse.json({ ok: false, error: "VALID_DECISION_REQUIRED" }, { status: 400 });
    }

    if ((decision === "DEFER" || decision === "KILL") && !operatorReason) {
      return NextResponse.json({ ok: false, error: "OPERATOR_REASON_REQUIRED" }, { status: 400 });
    }

    const id = decisionId();
    const timestamp = new Date().toISOString();
    const compositeScore = Number.isFinite(body.composite_score) ? body.composite_score! : null;
    const entry = {
      decision_id: id,
      timestamp,
      card_id: body.card_id.trim(),
      move: body.move?.trim() || "unknown move",
      recommendation: body.recommendation?.trim() || "unknown",
      composite_score: compositeScore,
      decision,
      operator_reason: operatorReason || null,
      destination: "TinkerDen Intake",
      assimilation_destination: "Speak"
    };
    const inheritance_id = inheritanceId();
    const artifactPath = path.join(INHERITANCE_DIR, `${inheritance_id}.json`);
    const inheritance: BridgeInheritanceEntry = {
      inheritance_id,
      title: `Bridge decision: ${entry.decision} ${entry.move}`,
      origin_receipt: entry.decision_id,
      lesson: `Operator chose ${entry.decision} for "${entry.move}" after Bridge recommendation ${entry.recommendation}.`,
      why_it_matters: "Bridge decisions must survive as memory so future moves can learn from operator choices.",
      status: "ACTIVE",
      timestamp,
      source_decision: entry.decision_id,
      operator_decision: entry.decision,
      recommendation: entry.recommendation,
      composite_score: entry.composite_score,
      artifact_path: artifactPath.replaceAll("\\", "/")
    };

    const fullPath = path.join(process.cwd(), LEDGER_PATH);
    const fullArtifactPath = path.join(process.cwd(), artifactPath);
    const fullSpeakerLedgerPath = path.join(process.cwd(), SPEAKER_LEDGER_PATH);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await mkdir(path.dirname(fullArtifactPath), { recursive: true });
    await mkdir(path.dirname(fullSpeakerLedgerPath), { recursive: true });
    await appendFile(fullPath, `${JSON.stringify(entry)}\n`, "utf8");
    await writeFile(fullArtifactPath, `${JSON.stringify(inheritance, null, 2)}\n`, "utf8");

    const speakerLedger = await readSpeakerLedger(fullSpeakerLedgerPath);
    speakerLedger.unshift(inheritance);
    await writeFile(fullSpeakerLedgerPath, `${JSON.stringify(speakerLedger, null, 2)}\n`, "utf8");

    return NextResponse.json({
      ok: true,
      entry,
      inheritance,
      ledger_path: LEDGER_PATH.replaceAll("\\", "/"),
      inheritance_path: artifactPath.replaceAll("\\", "/"),
      speaker_ledger_path: SPEAKER_LEDGER_PATH.replaceAll("\\", "/")
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "DECISION_WRITE_FAILED" },
      { status: 500 }
    );
  }
}
