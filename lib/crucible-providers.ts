import "server-only";

import { getStripe } from "@/lib/stripe";
import { isCrucibleProviderTestEnabled } from "@/lib/app-infra-preview";

export type CrucibleProviderMode = "sandbox_stub" | "stripe_identity_test" | "plaid_link_test";

export function getPlaidApiBase() {
  const env = (process.env.PLAID_ENV || "sandbox").toLowerCase();
  if (env === "production") return "https://production.plaid.com";
  if (env === "development") return "https://development.plaid.com";
  return "https://sandbox.plaid.com";
}

export function hasPlaidCredentials() {
  return Boolean(process.env.PLAID_CLIENT_ID?.trim() && process.env.PLAID_SECRET?.trim());
}

export function canRunCrucibleProviderTest() {
  return isCrucibleProviderTestEnabled();
}

export async function createStripeIdentityVerificationSession(input: {
  userId: string;
  returnUrl: string;
}) {
  if (!canRunCrucibleProviderTest()) {
    return { ok: false as const, reason: "provider_test_disabled" };
  }

  const stripe = getStripe();
  const session = await stripe.identity.verificationSessions.create({
    type: "document",
    metadata: { user_id: input.userId },
    return_url: input.returnUrl,
    options: {
      document: {
        allowed_types: ["driving_license", "passport", "id_card"]
      }
    }
  });

  if (!session.url) {
    return { ok: false as const, reason: "missing_verification_url" };
  }

  return {
    ok: true as const,
    mode: "stripe_identity_test" as const,
    verificationSessionId: session.id,
    status: session.status,
    url: session.url
  };
}

export async function createPlaidLinkToken(input: { userId: string }) {
  if (!canRunCrucibleProviderTest()) {
    return { ok: false as const, reason: "provider_test_disabled" };
  }

  if (!hasPlaidCredentials()) {
    return { ok: false as const, reason: "plaid_credentials_missing" };
  }

  const response = await fetch(`${getPlaidApiBase()}/link/token/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      user: { client_user_id: input.userId },
      client_name: "Werkles",
      products: ["assets"],
      country_codes: ["US"],
      language: "en"
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.link_token) {
    return { ok: false as const, reason: "plaid_link_token_failed" };
  }

  return {
    ok: true as const,
    mode: "plaid_link_test" as const,
    linkToken: payload.link_token as string
  };
}

export async function exchangePlaidPublicToken(publicToken: string) {
  if (!hasPlaidCredentials()) {
    return { ok: false as const, reason: "plaid_credentials_missing" };
  }

  const response = await fetch(`${getPlaidApiBase()}/item/public_token/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      public_token: publicToken
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    return { ok: false as const, reason: "plaid_exchange_failed" };
  }

  return {
    ok: true as const,
    itemId: payload.item_id as string,
    accessToken: payload.access_token as string
  };
}

export function mapIdentityVerificationStatus(
  status: string,
  livemode: boolean
): "sandbox_pending" | "sandbox_verified" | "live_verified" | "none" {
  if (status === "verified") {
    return livemode ? "live_verified" : "sandbox_verified";
  }
  if (status === "processing" || status === "requires_input") {
    return "sandbox_pending";
  }
  return "none";
}
