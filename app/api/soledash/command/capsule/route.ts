import { NextResponse } from "next/server";

import { buildMachineCapsule, saveCapsuleSnapshot } from "@/lib/soledash/command-surface/machine-capsule";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const save = searchParams.get("save") === "1";
    const capsule = await buildMachineCapsule();
    const savedPath = save ? saveCapsuleSnapshot(capsule) : null;
    return NextResponse.json({ ok: true, capsule, savedPath });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Capsule generation failed." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { save?: boolean };
    const capsule = await buildMachineCapsule();
    const savedPath = body.save ? saveCapsuleSnapshot(capsule) : null;
    return NextResponse.json({ ok: true, capsule, savedPath });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Capsule generation failed." },
      { status: 500 }
    );
  }
}
