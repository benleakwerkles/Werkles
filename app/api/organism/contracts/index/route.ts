import { NextResponse } from "next/server";

import { readOrganismContractIndex } from "@/lib/organism/contracts/read-index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "25");

  try {
    return NextResponse.json(await readOrganismContractIndex(Number.isFinite(limit) ? limit : 25));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "organism contract index read failed",
        records: [],
        count: 0,
      },
      { status: 500 },
    );
  }
}
