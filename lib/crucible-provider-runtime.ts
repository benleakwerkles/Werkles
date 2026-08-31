import "server-only";

import type { CruciblePriceKey } from "@/lib/pricing";
import type { ProviderRuntimeAvailability } from "@/lib/crucible-provider-readiness";
import {
  checkPlaidSandboxSafety,
  checkStripeIdentityTestSafety
} from "@/lib/crucible-provider-safety";
import { isCrucibleProviderTestEnabled } from "@/lib/app-infra-preview";

export type CrucibleProviderRuntimeSnapshot = Readonly<
  Partial<Record<CruciblePriceKey, ProviderRuntimeAvailability>>
>;

/**
 * Server-only, names-free readiness. This reports whether a provider test can
 * start in this runtime without exposing credentials or claiming that a
 * completed check will create a durable proof receipt.
 */
export function crucibleProviderRuntimeSnapshot(): CrucibleProviderRuntimeSnapshot {
  const providerTestEnabled = isCrucibleProviderTestEnabled();
  const stripe = checkStripeIdentityTestSafety({
    providerTestEnabled,
    secretKey: process.env.STRIPE_SECRET_KEY
  });
  const plaid = checkPlaidSandboxSafety({
    providerTestEnabled,
    plaidEnv: process.env.PLAID_ENV
  });
  const plaidCredentialsPresent = Boolean(
    process.env.PLAID_CLIENT_ID?.trim() && process.env.PLAID_SECRET?.trim()
  );

  return Object.freeze({
    identity: stripe.ok ? "available" : "unavailable",
    funds: plaid.ok && plaidCredentialsPresent ? "available" : "unavailable"
  });
}
