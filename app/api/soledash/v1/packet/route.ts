import fs from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rel = new URL(request.url).searchParams.get("path");
  if (!rel || !rel.startsWith("foreman/handoffs/outbox/") || rel.includes("..")) {
    return NextResponse.json({ ok: false, error: "Invalid path." }, { status: 400 });
  }

  const abs = path.join(process.cwd(), rel.replace(/\//g, path.sep));
  if (!fs.existsSync(abs)) {
    return NextResponse.json({ ok: false, error: "File not found." }, { status: 404 });
  }

  const content = fs.readFileSync(abs, "utf8");
  return NextResponse.json({ ok: true, path: rel, content });
}
