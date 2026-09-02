/**
 * Mechanical Stripe test checkout + webhook smoke (no browser, test mode only).
 * Names-only output. No secrets printed.
 */
import Stripe from "stripe";
import { randomBytes } from "node:crypto";

const webhookUrl = process.env.WERKLES_WEBHOOK_URL || "https://werkles.com/api/webhooks/stripe";
const siteOrigin = process.env.WERKLES_SITE_ORIGIN || "https://werkles.com";

const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
const monthlyPriceId = process.env.STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID?.trim();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const result = {
  ok: true,
  schema: "WERKLES_STRIPE_CHECKOUT_SMOKE_V1",
  timestamp: new Date().toISOString(),
  secret_values_printed: "NO",
  checks: []
};

function addCheck(name, status, detail = {}) {
  result.checks.push({ name, status, ...detail });
  if (status === "FAIL") result.ok = false;
}

function supabaseHeaders() {
  return {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
    "Content-Type": "application/json"
  };
}

let stripe;
let muleUserId;
let muleCustomerId;
let muleSubscriptionId;

try {
  if (!stripeSecret?.match(/^(sk|rk)_(test|live)_/)) {
    throw new Error("STRIPE_SECRET_KEY missing or invalid shape");
  }
  if (!webhookSecret?.startsWith("whsec_")) {
    throw new Error("STRIPE_WEBHOOK_SECRET missing or invalid shape");
  }
  if (!monthlyPriceId?.startsWith("price_")) {
    throw new Error("STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID missing or invalid shape");
  }
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase URL or service role key missing");
  }

  stripe = new Stripe(stripeSecret);
  const testMode = stripeSecret.includes("_test_");
  addCheck("stripe_test_mode", testMode ? "PASS" : "FAIL", { mode: testMode ? "test" : "live" });
  if (!testMode) {
    throw new Error("Refusing to run checkout mule outside Stripe test mode");
  }

  const price = await stripe.prices.retrieve(monthlyPriceId);
  addCheck("stripe_monthly_price", price.active ? "PASS" : "FAIL", {
    price_id: price.id,
    recurring: price.recurring?.interval || null
  });

  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const target = endpoints.data.find((item) => item.url === webhookUrl && !item.disabled);
  const events = target?.enabled_events || [];
  const hasCheckout = events.includes("checkout.session.completed") || events.includes("*");
  addCheck("stripe_webhook_endpoint", target && hasCheckout ? "PASS" : "FAIL", {
    webhook_id: target?.id || null,
    event_count: events.length,
    has_checkout_session_completed: hasCheckout
  });

  const membershipRoute = await fetch(`${siteOrigin}/membership`, { method: "GET" });
  addCheck("production_membership_route", membershipRoute.status === 200 ? "PASS" : "FAIL", {
    http_status: membershipRoute.status
  });

  const unsignedWebhook = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}"
  });
  addCheck("webhook_rejects_unsigned", unsignedWebhook.status === 400 ? "PASS" : "FAIL", {
    http_status: unsignedWebhook.status
  });

  const tag = Date.now().toString(36);
  const muleEmail = `mule-checkout-${tag}@werkles.test`;

  const createUserRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify({
      email: muleEmail,
      password: randomBytes(24).toString("hex"),
      email_confirm: true
    })
  });
  const createUserPayload = await createUserRes.json();
  if (!createUserRes.ok || !createUserPayload.id) {
    throw new Error(`supabase_create_user_failed:${createUserPayload.msg || createUserRes.status}`);
  }
  muleUserId = createUserPayload.id;
  addCheck("supabase_mule_user", "PASS", { user_id: muleUserId });

  const profileInsert = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: "POST",
    headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify({
      id: muleUserId,
      email: muleEmail,
      display_name: "Checkout Mule",
      location_city: "Smokeville",
      location_state: "ZZ",
      lane: "Operator",
      work_preference: "Local Only",
      membership_tier: "free",
      subscription_status: null
    })
  });
  if (!profileInsert.ok && profileInsert.status !== 409) {
    const body = await profileInsert.text();
    throw new Error(`supabase_profile_insert_failed:${profileInsert.status}:${body.slice(0, 120)}`);
  }
  addCheck("supabase_mule_profile", "PASS", { membership_tier_before: "free" });

  const customer = await stripe.customers.create({
    email: muleEmail,
    metadata: { user_id: muleUserId, mule: "checkout_smoke" }
  });
  muleCustomerId = customer.id;

  const paymentMethod = await stripe.paymentMethods.create({
    type: "card",
    card: { token: "tok_visa" }
  });
  await stripe.paymentMethods.attach(paymentMethod.id, { customer: muleCustomerId });
  await stripe.customers.update(muleCustomerId, {
    invoice_settings: { default_payment_method: paymentMethod.id }
  });

  const subscription = await stripe.subscriptions.create({
    customer: muleCustomerId,
    items: [{ price: monthlyPriceId }],
    default_payment_method: paymentMethod.id,
    metadata: { user_id: muleUserId, plan: "monthly", mule: "checkout_smoke" }
  });
  muleSubscriptionId = subscription.id;
  addCheck("stripe_test_subscription", subscription.status === "active" || subscription.status === "trialing" ? "PASS" : "FAIL", {
    subscription_id: muleSubscriptionId,
    status: subscription.status
  });

  const checkoutSessionObject = {
    id: `cs_mule_${tag}`,
    object: "checkout.session",
    mode: "subscription",
    livemode: false,
    customer: muleCustomerId,
    subscription: muleSubscriptionId,
    client_reference_id: muleUserId,
    metadata: { user_id: muleUserId, plan: "monthly", mule: "checkout_smoke" }
  };

  const event = {
    id: `evt_mule_${tag}`,
    object: "event",
    type: "checkout.session.completed",
    livemode: false,
    created: Math.floor(Date.now() / 1000),
    data: { object: checkoutSessionObject }
  };

  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret
  });

  const webhookRes = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": signature
    },
    body: payload
  });
  const webhookBody = await webhookRes.json().catch(() => ({}));
  addCheck("checkout_session_completed_webhook", webhookRes.ok ? "PASS" : "FAIL", {
    status: webhookRes.status,
    received: webhookBody.received === true
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const profileRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${muleUserId}&select=membership_tier,subscription_status,stripe_subscription_id,stripe_customer_id`,
    { headers: supabaseHeaders() }
  );
  const profiles = await profileRes.json();
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  const memberActive =
    profile?.membership_tier === "member" &&
    (profile?.subscription_status === "active" || profile?.subscription_status === "trialing");

  addCheck("supabase_membership_state", memberActive ? "PASS" : "FAIL", {
    membership_tier: profile?.membership_tier || null,
    subscription_status: profile?.subscription_status || null,
    stripe_subscription_id: profile?.stripe_subscription_id || null
  });
} catch (error) {
  addCheck("mule_runner", "FAIL", {
    error: error instanceof Error ? error.message : String(error)
  });
} finally {
  if (stripe && muleSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(muleSubscriptionId);
    } catch {
      // cleanup best-effort
    }
  }
  if (muleUserId && supabaseUrl && serviceKey) {
    try {
      await fetch(`${supabaseUrl}/auth/v1/admin/users/${muleUserId}`, {
        method: "DELETE",
        headers: supabaseHeaders()
      });
    } catch {
      // cleanup best-effort
    }
  }
}

console.log(JSON.stringify(result));
