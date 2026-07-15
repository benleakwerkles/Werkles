import { NextResponse } from "next/server";

import { readHarveySnapshot } from "@/lib/harvey/snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = (etag: string) => ({
  "cache-control": "no-store, max-age=0",
  etag,
  "x-content-type-options": "nosniff"
});

export async function GET(request: Request) {
  const snapshot = await readHarveySnapshot();
  const etag = `"${snapshot.revision}"`;
  const matches = (request.headers.get("if-none-match") ?? "")
    .split(",")
    .map((value) => value.trim())
    .includes(etag);
  if (matches) return new NextResponse(null, { status: 304, headers: responseHeaders(etag) });
  return NextResponse.json(snapshot, { headers: responseHeaders(etag) });
}
