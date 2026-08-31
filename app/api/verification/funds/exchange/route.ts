import { NextRequest, NextResponse } from "next/server";
import { isCruciblePreview } from "@/lib/app-infra-preview";
import { requireActiveMembership } from "@/lib/access-weight";
import { copy } from "@/lib/copy";
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

  return NextResponse.json(
    {
      status: "unavailable",
      error: copy.crucible.providerFundsCustodyRequired
    },
    { status: 503 }
  );
}
