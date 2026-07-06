import { NextRequest, NextResponse } from "next/server";
import { isCruciblePreview } from "@/lib/app-infra-preview";
import { requireActiveMembership } from "@/lib/access-weight";
import { exchangePlaidPublicToken } from "@/lib/crucible-providers";
import { copy } from "@/lib/copy";
import { getSupabaseService } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/request";

export async function POST(request: NextRequest) {
  if (isCruciblePreview()) {
    return NextResponse.json(
      { error: "Sandbox action disabled in APP_INFRA preview." },
      { status: 403 }
    );
  }

  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const gate = await requireActiveMembership(auth.user.id);
  if (!gate.ok) return gate.response;

  const body = await request.json().catch(() => ({}));
  const publicToken = typeof body?.public_token === "string" ? body.public_token : "";

  if (!publicToken) {
    return NextResponse.json({ error: "Missing Plaid public_token." }, { status: 400 });
  }

  const exchange = await exchangePlaidPublicToken(publicToken);
  if (!exchange.ok) {
    return NextResponse.json({ error: copy.crucible.providerFundsExchangeFailed }, { status: 502 });
  }

  const { error } = await getSupabaseService()
    .from("profiles")
    .update({ funds_status: "sandbox_verified" })
    .eq("id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    mode: "plaid_link_test",
    status: "sandbox_verified",
    label: copy.crucible.providerFundsVerified,
    item_id: exchange.itemId
  });
}
