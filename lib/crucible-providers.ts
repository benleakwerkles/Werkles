import "server-only";

import { getStripe } from "@/lib/stripe";
import { isCrucibleProviderTestEnabled } from "@/lib/app-infra-preview";
import {
  checkPlaidSandboxSafety,
  checkStripeIdentityTestSafety
} from "@/lib/crucible-provider-safety";
import { buildPlaidSandboxLinkTokenRequest } from "@/lib/plaid/link-token-request";
import { PLAID_LINK_CUSTOMIZATION_NAME } from "@/lib/plaid/link-config";

export type CrucibleProviderMode = "stripe_identity_test" | "plaid_link_test";

const PLAID_SANDBOX_API_BASE = "https://sandbox.plaid.com";

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
  const safety = checkStripeIdentityTestSafety({
    providerTestEnabled: canRunCrucibleProviderTest(),
    secretKey: process.env.STRIPE_SECRET_KEY
  });
  if (!safety.ok) {
    return { ok: false as const, reason: safety.reason };
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

export async function createPlaidLinkToken(input: {
  userId: string;
  linkCustomizationName: typeof PLAID_LINK_CUSTOMIZATION_NAME;
}) {
  if (input.linkCustomizationName !== PLAID_LINK_CUSTOMIZATION_NAME) {
    return { ok: false as const, reason: "plaid_link_configuration_invalid" };
  }

  const safety = checkPlaidSandboxSafety({
    providerTestEnabled: canRunCrucibleProviderTest(),
    plaidEnv: process.env.PLAID_ENV
  });
  if (!safety.ok) {
    return { ok: false as const, reason: safety.reason };
  }

  const clientId = process.env.PLAID_CLIENT_ID?.trim();
  const secret = process.env.PLAID_SECRET?.trim();
  if (!clientId || !secret) {
    return { ok: false as const, reason: "plaid_credentials_missing" };
  }

  let publicRequest;
  try {
    publicRequest = buildPlaidSandboxLinkTokenRequest({
      ownerUserId: input.userId,
      linkCustomizationName: input.linkCustomizationName
    });
  } catch {
    return { ok: false as const, reason: "plaid_link_configuration_invalid" };
  }

  const response = await fetch(`${PLAID_SANDBOX_API_BASE}/link/token/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      secret,
      ...publicRequest
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (
    !response.ok ||
    typeof payload.link_token !== "string" ||
    payload.link_token.trim().length === 0
  ) {
    return { ok: false as const, reason: "plaid_link_token_failed" };
  }

  return {
    ok: true as const,
    mode: "plaid_link_test" as const,
    linkToken: payload.link_token as string
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
