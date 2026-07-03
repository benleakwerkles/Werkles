import { NextResponse } from "next/server";

import { runPetraEmptyLinkLiveFire } from "@/lib/soledash/petra-empty-link/run-live-fire";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST() {
  try {
    const result = await runPetraEmptyLinkLiveFire();
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Live fire failed.",
        failure_class: "failed" as const
      },
      { status: 500 }
    );
  }
}
