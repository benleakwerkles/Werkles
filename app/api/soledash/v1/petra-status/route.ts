import { NextResponse } from "next/server";

import { loadPetraStatus } from "@/lib/soledash/petra-status/load-petra-status";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = loadPetraStatus();
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Petra status load failed" },
      { status: 500 }
    );
  }
}
