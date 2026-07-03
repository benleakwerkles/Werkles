import { NextResponse } from "next/server";

import { loadPermissionFlyPanel } from "@/lib/soledash/permission-fly/actions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const panel = loadPermissionFlyPanel();
    return NextResponse.json({ ok: true, panel });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Permission fly load failed" },
      { status: 500 }
    );
  }
}
