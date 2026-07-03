import { NextResponse } from "next/server";

import { buildSkyPookaFieldFeed } from "@/lib/skypooka/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await buildSkyPookaFieldFeed());
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "SKYPOOKA_FEED_FAILED"
      },
      { status: 500 }
    );
  }
}
