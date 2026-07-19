import { NextRequest, NextResponse } from "next/server";
import {
  isCruciblePreview,
  PUBLIC_TEST_PROVIDER_ACTIONS_CLOSED_MESSAGE,
  PUBLIC_TEST_PROVIDER_ACTIONS_OPEN
} from "@/lib/app-infra-preview";
import { requireActiveMembership } from "@/lib/access-weight";
import { createStripeIdentityVerificationSession } from "@/lib/crucible-providers";
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

  const origin = request.nextUrl.origin;
  const returnUrl = `${origin}/dashboard/crucible?check=identity&return=1`;

  try {
    const provider = await createStripeIdentityVerificationSession({
      userId: auth.user.id,
      returnUrl
    });

    if (provider.ok) {
      const { error } = await getSupabaseService()
        .from("profiles")
        .update({ id_status: "sandbox_pending" })
        .eq("id", auth.user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        mode: provider.mode,
        status: provider.status,
        label: copy.crucible.providerIdentityRedirect,
        url: provider.url,
        verification_session_id: provider.verificationSessionId
      });
    }
  } catch {
    // Fall through to sandbox stub when Stripe Identity is not enabled on the account.
  }

  const sessionId = `sandbox_identity_${auth.user.id}_${Date.now()}`;
  const { error } = await getSupabaseService()
    .from("profiles")
    .update({ id_status: "sandbox_pending" })
    .eq("id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    mode: "sandbox_stub",
    status: "sandbox_pending",
    label: copy.verification.prepared,
    verification_session_id: sessionId
  });
}
