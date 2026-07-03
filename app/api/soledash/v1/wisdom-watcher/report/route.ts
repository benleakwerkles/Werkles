import { NextResponse } from "next/server";

import { getOrRefreshReport, readReportMarkdown } from "@/lib/soledash/wisdom-watcher/actions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { report } = getOrRefreshReport();
    const markdown = readReportMarkdown();
    return NextResponse.json({ ok: true, report, markdown });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Report load failed" },
      { status: 500 }
    );
  }
}
