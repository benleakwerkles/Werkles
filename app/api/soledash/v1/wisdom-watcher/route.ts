import { NextResponse } from "next/server";

import { loadWisdomWatchPanel } from "@/lib/soledash/wisdom-watcher/actions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const panel = loadWisdomWatchPanel();
    return NextResponse.json({ ok: true, panel });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Wisdom Watch failed" },
      { status: 500 }
    );
  }
}
