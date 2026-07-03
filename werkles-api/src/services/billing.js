import { getBilling, setBilling } from "../store/index.js";

const PLANS = {
  free: {
    id: "free",
    label: "Free",
    priceMonthlyUsd: 0,
    features: ["Browse matches", "Queue intros", "Local proof checklist"],
  },
  partner: {
    id: "partner",
    label: "Partner",
    priceMonthlyUsd: 49,
    features: ["Priority intros", "Expanded proof workspace", "Billing stub checkout"],
  },
};

export function getBillingStatus(userId) {
  const billing = getBilling(userId);
  return {
    ...billing,
    plan: PLANS.partner.id,
    availablePlans: Object.values(PLANS),
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    mode: process.env.STRIPE_SECRET_KEY ? "live-capable" : "dry-run",
  };
}

export function createCheckoutSession(userId, planId = "partner") {
  const plan = PLANS[planId];
  if (!plan) {
    throw new Error(`Unknown plan "${planId}"`);
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    setBilling(userId, {
      status: "checkout-dry-run",
      lastCheckoutPlan: planId,
      lastCheckoutAt: new Date().toISOString(),
    });

    return {
      mode: "dry-run",
      plan,
      checkoutUrl: null,
      message:
        "Stripe is not configured. Human gate required for STRIPE_SECRET_KEY and live checkout.",
    };
  }

  throw new Error(
    "Stripe secret key is present but live checkout is not implemented in this scaffold."
  );
}

export function createBillingPortalSession(userId) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      mode: "dry-run",
      portalUrl: null,
      message: "Billing portal requires Stripe configuration and a human gate.",
    };
  }

  throw new Error("Live Stripe portal is not implemented in this scaffold.");
}
