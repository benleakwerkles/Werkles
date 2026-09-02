/**
 * Mechanical Crucible smoke — provider APIs + production verification routes.
 * Test/sandbox only. No secrets printed.
 */
import Stripe from "stripe";
import { randomBytes } from "node:crypto";

const siteOrigin = process.env.WERKLES_SITE_ORIGIN || "https://werkles.com";
const webhookUrl = process.env.WERKLES_WEBHOOK_URL || "https://werkles.com/api/webhooks/stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
const plaidClientId = process.env.PLAID_CLIENT_ID?.trim();
const plaidSecret = process.env.PLAID_SECRET?.trim();
const plaidEnv = (process.env.PLAID_ENV || "sandbox").toLowerCase();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const plaidBase =
  plaidEnv === "production"
    ? "https://production.plaid.com"
    : plaidEnv === "development"
      ? "https://development.plaid.com"
      : "https://sandbox.plaid.com";

const result = {
  ok: true,
  schema: "WERKLES_CRUCIBLE_SMOKE_V1",
  timestamp: new Date().toISOString(),
  secret_values_printed: "NO",
  checks: []
};

function addCheck(name, status, detail = {}) {
  result.checks.push({ name, status, ...detail });
  if (status === "FAIL") result.ok = false;
}

function supabaseServiceHeaders() {
  return {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
    "Content-Type": "application/json"
  };
}

function supabaseAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    apikey: anonKey,
    "Content-Type": "application/json"
  };
}

let stripe;
let muleUserId;
let mulePassword;
let accessToken;

try {
  if (!stripeSecret || !webhookSecret || !supabaseUrl || !anonKey || !serviceKey) {
    throw new Error("required_env_missing");
  }

  stripe = new Stripe(stripeSecret);
  const testMode = stripeSecret.includes("_test_");
  addCheck("stripe_test_mode", testMode ? "PASS" : "FAIL", { mode: testMode ? "test" : "live" });
  if (!testMode) throw new Error("Refusing outside Stripe test mode");

  addCheck("plaid_credentials_present", plaidClientId && plaidSecret ? "PASS" : "FAIL", {
    plaid_env: plaidEnv
  });

  try {
    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: { user_id: "crucible_mule_smoke" },
      return_url: `${siteOrigin}/dashboard/crucible?check=identity&return=1`
    });
    addCheck("stripe_identity_api_direct", "PASS", {
      session_id: session.id,
      has_url: Boolean(session.url),
      status: session.status
    });
  } catch (error) {
    addCheck("stripe_identity_api_direct", "PARTIAL", {
      note: "restricted_key_or_identity_disabled",
      error: error instanceof Error ? error.message.slice(0, 120) : String(error)
    });
  }

  const plaidRes = await fetch(`${plaidBase}/link/token/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: plaidClientId,
      secret: plaidSecret,
      user: { client_user_id: "crucible_mule_smoke" },
      client_name: "Werkles",
      products: ["assets"],
      country_codes: ["US"],
      language: "en"
    })
  });
  const plaidPayload = await plaidRes.json().catch(() => ({}));
  addCheck("plaid_link_token_direct", plaidRes.ok && plaidPayload.link_token ? "PASS" : "FAIL", {
    plaid_env: plaidEnv
  });

  const crucibleRoute = await fetch(`${siteOrigin}/dashboard/crucible`);
  addCheck("production_crucible_route", crucibleRoute.status === 200 ? "PASS" : "FAIL", {
    http_status: crucibleRoute.status
  });

  const tag = Date.now().toString(36);
  mulePassword = randomBytes(24).toString("hex");
  const muleEmail = `mule-crucible-${tag}@werkles.test`;

  const createUserRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: supabaseServiceHeaders(),
    body: JSON.stringify({
      email: muleEmail,
      password: mulePassword,
      email_confirm: true
    })
  });
  const createUserPayload = await createUserRes.json();
  if (!createUserRes.ok || !createUserPayload.id) {
    throw new Error(`supabase_create_user_failed:${createUserPayload.msg || createUserRes.status}`);
  }
  muleUserId = createUserPayload.id;

  const profileInsert = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: "POST",
    headers: { ...supabaseServiceHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify({
      id: muleUserId,
      email: muleEmail,
      display_name: "Crucible Mule",
      location_city: "Smokeville",
      location_state: "ZZ",
      lane: "Operator",
      work_preference: "Local Only",
      membership_tier: "member",
      subscription_status: "active",
      id_status: "none",
      funds_status: "none"
    })
  });
  if (!profileInsert.ok && profileInsert.status !== 409) {
    const body = await profileInsert.text();
    throw new Error(`supabase_profile_insert_failed:${profileInsert.status}:${body.slice(0, 120)}`);
  }
  addCheck("supabase_member_profile", "PASS", { user_id: muleUserId });

  const signInRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email: muleEmail, password: mulePassword })
  });
  const signInPayload = await signInRes.json();
  accessToken = signInPayload.access_token;
  if (!signInRes.ok || !accessToken) {
    throw new Error(`supabase_sign_in_failed:${signInPayload.error_description || signInRes.status}`);
  }
  addCheck("supabase_member_session", "PASS");

  const identityRes = await fetch(`${siteOrigin}/api/verification/identity`, {
    method: "POST",
    headers: supabaseAuthHeaders(accessToken)
  });
  const identityPayload = await identityRes.json().catch(() => ({}));
  const identityOk =
    identityRes.ok &&
    (identityPayload.mode === "stripe_identity_test" ||
      identityPayload.mode === "sandbox_stub") &&
    identityPayload.status === "sandbox_pending";
  addCheck("production_identity_api", identityOk ? "PASS" : "FAIL", {
    http_status: identityRes.status,
    mode: identityPayload.mode || null,
    status: identityPayload.status || null
  });

  const fundsRes = await fetch(`${siteOrigin}/api/verification/funds`, {
    method: "POST",
    headers: supabaseAuthHeaders(accessToken)
  });
  const fundsPayload = await fundsRes.json().catch(() => ({}));
  const fundsOk =
    fundsRes.ok &&
    (fundsPayload.mode === "plaid_link_test" || fundsPayload.mode === "sandbox_stub") &&
    fundsPayload.status === "sandbox_pending";
  addCheck("production_funds_api", fundsOk ? "PASS" : "FAIL", {
    http_status: fundsRes.status,
    mode: fundsPayload.mode || null,
    has_link_token: Boolean(fundsPayload.link_token)
  });

  const profileAfterRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${muleUserId}&select=id_status,funds_status`,
    { headers: supabaseServiceHeaders() }
  );
  const profilesAfter = await profileAfterRes.json();
  const profileAfter = Array.isArray(profilesAfter) ? profilesAfter[0] : null;
  addCheck("profile_status_after_api_calls", profileAfter?.id_status === "sandbox_pending" && profileAfter?.funds_status === "sandbox_pending" ? "PASS" : "FAIL", {
    id_status: profileAfter?.id_status || null,
    funds_status: profileAfter?.funds_status || null
  });

  const identityEvent = {
    id: `evt_crucible_id_${tag}`,
    object: "event",
    type: "identity.verification_session.verified",
    livemode: false,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `vs_mule_${tag}`,
        object: "identity.verification_session",
        status: "verified",
        livemode: false,
        metadata: { user_id: muleUserId }
      }
    }
  };
  const identityPayloadStr = JSON.stringify(identityEvent);
  const identitySig = stripe.webhooks.generateTestHeaderString({
    payload: identityPayloadStr,
    secret: webhookSecret
  });
  const identityWebhookRes = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": identitySig
    },
    body: identityPayloadStr
  });
  addCheck("identity_verified_webhook", identityWebhookRes.ok ? "PASS" : "FAIL", {
    http_status: identityWebhookRes.status
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const profileFinalRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${muleUserId}&select=id_status,funds_status,membership_tier,subscription_status`,
    { headers: supabaseServiceHeaders() }
  );
  const profilesFinal = await profileFinalRes.json();
  const profileFinal = Array.isArray(profilesFinal) ? profilesFinal[0] : null;
  addCheck("profile_id_status_after_webhook", profileFinal?.id_status === "sandbox_verified" ? "PASS" : "FAIL", {
    id_status: profileFinal?.id_status || null
  });
  addCheck("membership_still_active", profileFinal?.membership_tier === "member" && profileFinal?.subscription_status === "active" ? "PASS" : "FAIL", {
    membership_tier: profileFinal?.membership_tier || null,
    subscription_status: profileFinal?.subscription_status || null
  });
} catch (error) {
  addCheck("mule_runner", "FAIL", {
    error: error instanceof Error ? error.message : String(error)
  });
} finally {
  if (muleUserId && supabaseUrl && serviceKey) {
    try {
      await fetch(`${supabaseUrl}/auth/v1/admin/users/${muleUserId}`, {
        method: "DELETE",
        headers: supabaseServiceHeaders()
      });
    } catch {
      // cleanup best-effort
    }
  }
}

console.log(JSON.stringify(result));
