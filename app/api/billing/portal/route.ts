import { NextRequest, NextResponse } from "next/server";
import { isAuthStripeTestBlocked } from "@/lib/app-infra-preview";
import { getStripe } from "@/lib/stripe";
import { getSupabaseService } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/request";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (isAuthStripeTestBlocked()) {
    return NextResponse.json(
      { error: "Billing portal is disabled during APP_INFRA preview." },
      { status: 403 }
    );
  }

  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const supabase = getSupabaseService();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const customerId = profile?.stripe_customer_id as string | null | undefined;
  if (!customerId) {
    return NextResponse.json(
      { error: "No Stripe customer on file. Complete Foundry Dues checkout first." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const origin = request.nextUrl.origin;
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/dashboard/billing`
  });

  return NextResponse.json({ url: session.url });
}
