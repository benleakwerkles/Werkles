import { NextResponse } from "next/server";

import { buildDispatchMatrix } from "@/lib/soledash/dispatch-matrix/build-matrix";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const selected = searchParams.get("selected")?.trim();
    const selectedIds = selected ? selected.split(",").map((s) => s.trim()).filter(Boolean) : [];

    const matrix = buildDispatchMatrix(selectedIds);
    return NextResponse.json({ ok: true, matrix });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Dispatch matrix failed" },
      { status: 500 }
    );
  }
}
