import { NextRequest, NextResponse } from "next/server";
import {
  isCruciblePreview,
  PUBLIC_TEST_PROVIDER_ACTIONS_CLOSED_MESSAGE,
  PUBLIC_TEST_PROVIDER_ACTIONS_OPEN
} from "@/lib/app-infra-preview";
import { requireActiveMembership } from "@/lib/access-weight";
import { createPlaidLinkToken } from "@/lib/crucible-providers";
import { copy } from "@/lib/copy";
import { getSupabaseService } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/request";

export async function POST(request: NextRequest) {
  if (!PUBLIC_TEST_PROVIDER_ACTIONS_OPEN) {
    const response = NextResponse.json(
      {
        error: PUBLIC_TEST_PROVIDER_ACTIONS_CLOSED_MESSAGE,
        state: "Closed"
      },
      { status: 503 }
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

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

  const plaid = await createPlaidLinkToken({ userId: auth.user.id });
  if (plaid.ok) {
    const { error } = await getSupabaseService()
      .from("profiles")
      .update({ funds_status: "sandbox_pending" })
      .eq("id", auth.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      mode: plaid.mode,
      status: "sandbox_pending",
      label: copy.crucible.providerFundsLink,
      link_token: plaid.linkToken
    });
  }

  const assetReportToken = `sandbox_asset_report_${auth.user.id}_${Date.now()}`;
  const { error } = await getSupabaseService()
    .from("profiles")
    .update({ funds_status: "sandbox_pending" })
    .eq("id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    mode: "sandbox_stub",
    status: "sandbox_pending",
    label: copy.verification.prepared,
    asset_report_token: assetReportToken,
    provider_note: copy.crucible.providerFundsSandboxOnly
  });
}
