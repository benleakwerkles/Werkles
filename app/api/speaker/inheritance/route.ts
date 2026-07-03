import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type InheritanceEntry = {
  inheritance_id: string;
  title: string;
  origin_receipt: string;
  lesson: string;
  why_it_matters: string;
  status: "ACTIVE" | "SUPERSEDED" | "ARCHIVED";
  timestamp: string;
};

type ReceiptProvenance = {
  receipt_id?: string;
  origin_type?: string;
  origin_actor?: string;
  origin_machine?: string;
  timestamp?: string;
  proof_reference?: string;
};

const ORIGIN_TYPES = new Set(["HUMAN", "AEYE", "SYSTEM", "EXTERNAL"]);
const PROVENANCE_FIELDS = [
  "receipt_id",
  "origin_type",
  "origin_actor",
  "origin_machine",
  "timestamp",
  "proof_reference"
] as const;

function inheritanceId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `inheritance_${stamp}_${suffix}`;
}

async function readLedger(storePath: string) {
  try {
    return JSON.parse(await readFile(storePath, "utf8")) as InheritanceEntry[];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    origin_receipt?: string;
    receipt_summary?: string;
    receipt_provenance?: ReceiptProvenance;
  };

  if (!body.origin_receipt?.trim()) {
    return NextResponse.json({ ok: false, error: "ORIGIN_RECEIPT_REQUIRED" }, { status: 400 });
  }

  const provenance = body.receipt_provenance;
  const missing = PROVENANCE_FIELDS.filter((field) => !provenance?.[field]?.trim());
  if (missing.length > 0) {
    return NextResponse.json({ ok: false, error: "RECEIPT_PROVENANCE_REQUIRED", missing }, { status: 400 });
  }

  if (provenance?.receipt_id !== body.origin_receipt.trim()) {
    return NextResponse.json({ ok: false, error: "PROVENANCE_RECEIPT_MISMATCH" }, { status: 400 });
  }

  if (!ORIGIN_TYPES.has(provenance.origin_type!)) {
    return NextResponse.json({ ok: false, error: "INVALID_ORIGIN_TYPE" }, { status: 400 });
  }

  const summary = body.receipt_summary?.trim() || "Receipt assimilated into visible inheritance.";
  const entry: InheritanceEntry = {
    inheritance_id: inheritanceId(),
    title: `Assimilated: ${body.origin_receipt.trim()}`,
    origin_receipt: body.origin_receipt.trim(),
    lesson: summary,
    why_it_matters: "Learning is visible in TinkerDen Speaker Feed instead of hidden behind assimilation.",
    status: "ACTIVE",
    timestamp: new Date().toISOString()
  };

  const dir = path.join(process.cwd(), "speaker", "inheritance");
  const storePath = path.join(dir, "inheritance_ledger.json");
  await mkdir(dir, { recursive: true });

  const ledger = await readLedger(storePath);
  ledger.unshift(entry);
  await writeFile(storePath, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");

  return NextResponse.json({ ok: true, entry });
}
