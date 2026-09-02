import { NextRequest, NextResponse } from "next/server";

import { writeOrganismPacketRecord } from "@/lib/organism/contracts/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await writeOrganismPacketRecord(body, {
    detected_by: "app/api/organism/contracts/packets",
  });

  return NextResponse.json(result, { status: result.ok ? 201 : 422 });
}

