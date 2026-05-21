import { NextRequest, NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";

function cronToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : null;
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }

  if (cronToken(request) !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabaseService().rpc("process_intro_request_ttl");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ processed: data ?? 0 });
}
