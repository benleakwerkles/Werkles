import { NextRequest, NextResponse } from "next/server";

import { ownerVerificationStatusFromProfile } from "@/lib/crucible-owner-status";
import { requireUser } from "@/lib/supabase/request";
import { getSupabaseService } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) {
    auth.response.headers.set("Cache-Control", "private, no-store");
    return auth.response;
  }

  const { data, error } = await getSupabaseService()
    .from("profiles")
    .select("id_status, funds_status")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Unable to load verification status." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  return NextResponse.json(ownerVerificationStatusFromProfile(data), {
    headers: { "Cache-Control": "private, no-store" }
  });
}
