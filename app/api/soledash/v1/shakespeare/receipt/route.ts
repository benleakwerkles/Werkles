import fs from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const RECEIPT_DIR = path.join(process.cwd(), "foreman", "soledash", "shakespeare-verdicts");

export async function GET(request: Request) {
  try {
    const file = new URL(request.url).searchParams.get("file");
    if (!file || file.includes("..") || file.includes("/") || file.includes("\\")) {
      return NextResponse.json({ ok: false, error: "invalid file" }, { status: 400 });
    }

    const filePath = path.join(RECEIPT_DIR, file);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ ok: false, error: "receipt not found" }, { status: 404 });
    }

    const raw = fs.readFileSync(filePath, "utf8");
    return new NextResponse(raw, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "receipt read failed" },
      { status: 500 }
    );
  }
}
