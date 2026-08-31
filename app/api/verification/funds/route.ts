import { NextRequest, NextResponse } from "next/server";
import { isCruciblePreview } from "@/lib/app-infra-preview";
import { requireActiveMembership } from "@/lib/access-weight";
import { createPlaidLinkToken } from "@/lib/crucible-providers";
import { copy } from "@/lib/copy";
import { PLAID_LINK_CUSTOMIZATION_NAME } from "@/lib/plaid/link-config";
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

  const plaid = await createPlaidLinkToken({
    userId: auth.user.id,
    linkCustomizationName: PLAID_LINK_CUSTOMIZATION_NAME
  });
  if (plaid.ok) {
    return NextResponse.json({
      mode: plaid.mode,
      status: "sandbox_ready",
      label: copy.crucible.providerFundsReady,
      link_token: plaid.linkToken
    });
  }

  const configurationFailure = [
    "provider_test_disabled",
    "plaid_sandbox_required",
    "plaid_credentials_missing",
    "plaid_link_configuration_invalid"
  ].includes(plaid.reason);

  return NextResponse.json(
    { error: copy.crucible.providerFundsUnavailable },
    { status: configurationFailure ? 503 : 502 }
  );
}
