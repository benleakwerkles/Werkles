import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/request";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const blueprintId = request.nextUrl.searchParams.get("blueprint_id");
  if (!blueprintId) {
    return NextResponse.json({ error: "blueprint_id is required" }, { status: 400 });
  }

  const { data, error } = await auth.supabase.rpc("match_candidates_for_blueprint", {
    p_blueprint_id: blueprintId,
    p_scout_user_id: auth.user.id
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ matches: data || [] });
}
