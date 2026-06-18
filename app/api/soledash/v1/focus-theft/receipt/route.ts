import { NextResponse } from "next/server";

import { latestFocusTheftReceipt, readFocusTheftReceipt } from "@/lib/soledash/focus-theft/submit-report";
import { RECEIPTS_DIR, rel } from "@/lib/soledash/focus-theft/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const incidentId = searchParams.get("incident_id")?.trim();

  if (incidentId) {
    const receipt = readFocusTheftReceipt(incidentId);
    if (!receipt) {
      return NextResponse.json({ ok: false, error: "Receipt not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, receipt });
  }

  const latest = latestFocusTheftReceipt();
  if (!latest) {
    return NextResponse.json({ ok: false, error: "No focus theft receipts yet" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    receipt: latest,
    receipt_dir: rel(RECEIPTS_DIR)
  });
}
