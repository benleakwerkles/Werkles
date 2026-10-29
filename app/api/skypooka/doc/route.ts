import { NextResponse } from "next/server";

import { readSkyPookaDoc } from "@/lib/skypooka/doc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const docPath = searchParams.get("path");

  if (!docPath) {
    return NextResponse.json({ ok: false, error: "PATH_REQUIRED" }, { status: 400 });
  }

  try {
    return NextResponse.json(await readSkyPookaDoc(docPath));
  } catch (error) {
    const message = error instanceof Error ? error.message : "DOC_READ_FAILED";
    const status = message === "DOC_PATH_NOT_ALLOWED" ? 403 : 404;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
