/**
 * APP_INFRA / Stripe test wiring gates.
 * Crucible verification stays preview-blocked while auth + subscription test wiring runs.
 */

import { isLocalRoutePreviewUnlocked } from "@/lib/local-route-preview";

/** Crucible UI + verification POST routes — unlocked for sandbox + provider test (2026-07-05). */
export const APP_INFRA_PREVIEW_CRUCIBLE = false;

/** Stripe Identity + Plaid Link test wiring (test/sandbox providers only). */
export const CRUCIBLE_PROVIDER_TEST_ENABLED = true;

/** Public-test releases must not start provider actions or mutate verification state. */
export const PUBLIC_TEST_PROVIDER_ACTIONS_OPEN = false;

export const PUBLIC_TEST_PROVIDER_ACTIONS_CLOSED_MESSAGE =
  "Verification provider actions are unavailable during public testing.";

/** Login, signup, checkout, billing portal — enabled for test-mode wiring. */
export const AUTH_STRIPE_TEST_WIRING_ENABLED = true;

/**
 * Tier-A Vercel + 1Password custody complete (2026-07-05).
 * Test-mode checkout may run; live Stripe keys remain gated separately.
 */
export const TIER_A_PAYMENT_ENV_READY = true;

/** True while operator tier-A secret entry / env sync is still in flight. */
export function isFoundryDuesCheckoutPaused(): boolean {
  if (isAuthStripeTestBlocked()) return true;
  return !TIER_A_PAYMENT_ENV_READY;
}

export function isCruciblePreview(): boolean {
  return APP_INFRA_PREVIEW_CRUCIBLE;
}

export function isCrucibleProviderTestEnabled(): boolean {
  return (
    PUBLIC_TEST_PROVIDER_ACTIONS_OPEN &&
    CRUCIBLE_PROVIDER_TEST_ENABLED &&
    !APP_INFRA_PREVIEW_CRUCIBLE
  );
}

export function isAuthStripeTestBlocked(): boolean {
  if (isLocalRoutePreviewUnlocked()) return false;
  return !AUTH_STRIPE_TEST_WIRING_ENABLED;
}

/** Crucible and verification APIs only. */
export function isAppInfraPreview(): boolean {
  return isCruciblePreview() || !PUBLIC_TEST_PROVIDER_ACTIONS_OPEN;
}
