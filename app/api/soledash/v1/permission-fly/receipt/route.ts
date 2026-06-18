import { NextResponse } from "next/server";

import { latestPermissionFlyReceipt, readPermissionFlyReceipt, RECEIPTS_DIR, rel } from "@/lib/soledash/permission-fly/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const receiptId = searchParams.get("receipt_id")?.trim();

  if (receiptId) {
    const receipt = readPermissionFlyReceipt(receiptId);
    if (!receipt) {
      return NextResponse.json({ ok: false, error: "Receipt not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, receipt });
  }

  const latest = latestPermissionFlyReceipt();
  if (!latest) {
    return NextResponse.json({ ok: false, error: "No permission fly receipts yet" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    receipt: latest,
    receipt_dir: rel(RECEIPTS_DIR)
  });
}
