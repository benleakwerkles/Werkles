import { NextResponse } from "next/server";

import { loadPermissionSwatterReceiptLog } from "@/lib/soledash/permission-swatter/load-receipt-log";
import { loadPermissionSwatterScoreboard } from "@/lib/soledash/permission-swatter/load-scoreboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const scoreboard = loadPermissionSwatterScoreboard();
    const entries = loadPermissionSwatterReceiptLog();
    return NextResponse.json({ ok: true, scoreboard, entries });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Scoreboard load failed" },
      { status: 500 }
    );
  }
}
