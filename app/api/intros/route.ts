import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/request";
import { copy } from "@/lib/copy";

const writableStatuses = new Set(copy.introStatuses);

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const { data, error } = await auth.supabase
    .from("intro_requests")
    .select("*")
    .or(
      `scout_user_id.eq.${auth.user.id},co_sign_user_id.eq.${auth.user.id},target_user_id.eq.${auth.user.id}`
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ intros: data || [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const body = await request.json();
  const blueprintId = String(body?.blueprint_id || "");
  const targetUserId = String(body?.target_user_id || "");
  const coSignUserId = String(body?.co_sign_user_id || "");
  const message = body?.message ? String(body.message).slice(0, 2000) : null;

  if (!blueprintId || !targetUserId || !coSignUserId) {
    return NextResponse.json(
      { error: "blueprint_id, target_user_id, and co_sign_user_id are required" },
      { status: 400 }
    );
  }

  const { data, error } = await auth.supabase
    .from("intro_requests")
    .insert({
      blueprint_id: blueprintId,
      scout_user_id: auth.user.id,
      target_user_id: targetUserId,
      co_sign_user_id: coSignUserId,
      message
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ intro: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const body = await request.json();
  const id = String(body?.id || "");
  const status = String(body?.status || "");

  if (!id || !writableStatuses.has(status as (typeof copy.introStatuses)[number])) {
    return NextResponse.json({ error: "Valid id and status are required" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("intro_requests")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ intro: data });
}
