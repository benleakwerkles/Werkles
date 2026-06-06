/**
 * APP_INFRA / Stripe test wiring gates.
 * Crucible verification stays preview-blocked while auth + subscription test wiring runs.
 */

/** Crucible UI + verification POST routes — blocked until a later gate. */
export const APP_INFRA_PREVIEW_CRUCIBLE = true;

/** Login, signup, checkout, billing portal — enabled for test-mode wiring. */
export const AUTH_STRIPE_TEST_WIRING_ENABLED = true;

export function isCruciblePreview(): boolean {
  return APP_INFRA_PREVIEW_CRUCIBLE;
}

export function isAuthStripeTestBlocked(): boolean {
  return !AUTH_STRIPE_TEST_WIRING_ENABLED;
}

/** Crucible and verification APIs only. */
export function isAppInfraPreview(): boolean {
  return isCruciblePreview();
}
