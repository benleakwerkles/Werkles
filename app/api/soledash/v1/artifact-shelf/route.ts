import { NextResponse } from "next/server";

import { buildArtifactShelf } from "@/lib/soledash/artifact-shelf/build-shelf";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const shelf = buildArtifactShelf();
    return NextResponse.json({ ok: true, shelf });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Artifact shelf load failed" },
      { status: 500 }
    );
  }
}
